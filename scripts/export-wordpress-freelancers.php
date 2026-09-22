<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$options = getopt('', ['wordpress-root::', 'output::', 'summary']);
$wordpressRoot = rtrim((string)($options['wordpress-root'] ?? '/var/www/blog'), '/');
$wpLoad = $wordpressRoot . '/wp-load.php';

if (!is_file($wpLoad)) {
    fwrite(STDERR, "WordPress was not found at {$wordpressRoot}.\n");
    exit(1);
}

define('WP_USE_THEMES', false);
require_once $wpLoad;

global $wpdb;

function gx_clean_scalar($value): string
{
    if (is_array($value)) {
        foreach ($value as $item) {
            $cleaned = gx_clean_scalar($item);
            if ($cleaned !== '') {
                return $cleaned;
            }
        }
        return '';
    }
    if (is_object($value)) {
        return gx_clean_scalar((array)$value);
    }
    return trim(wp_strip_all_tags((string)$value));
}

function gx_normalize_phone($value): string
{
    $raw = gx_clean_scalar($value);
    if ($raw === '') {
        return '';
    }
    $digits = preg_replace('/\D+/', '', $raw) ?: '';
    if ($digits === '') {
        return '';
    }
    if (str_starts_with($digits, '00') && strlen($digits) > 10) {
        $digits = substr($digits, 2);
    }
    if (strlen($digits) === 10) {
        return '+91' . $digits;
    }
    return '+' . $digits;
}

function gx_first_value(array $values): string
{
    foreach ($values as $value) {
        $cleaned = gx_clean_scalar(maybe_unserialize($value));
        if ($cleaned !== '') {
            return $cleaned;
        }
    }
    return '';
}

$roleInventory = [];
$freelancerRoleKeys = [];
foreach (wp_roles()->roles as $roleKey => $role) {
    $roleName = (string)($role['name'] ?? $roleKey);
    $count = count(get_users(['role' => $roleKey, 'fields' => 'ID']));
    $roleInventory[$roleKey] = ['name' => $roleName, 'users' => $count];
    if (stripos((string)$roleKey, 'freelancer') !== false || stripos($roleName, 'freelancer') !== false) {
        $freelancerRoleKeys[] = (string)$roleKey;
    }
}

$users = get_users([
    'role__in' => $freelancerRoleKeys,
    'orderby' => 'ID',
    'order' => 'ASC',
]);

$userIds = array_map(static fn($user): int => (int)$user->ID, $users);
$userMetaKeyCounts = [];
$postMetaKeyCounts = [];

if ($userIds !== []) {
    $idList = implode(',', array_map('intval', $userIds));
    $userMetaRows = $wpdb->get_results(
        "SELECT meta_key, COUNT(*) AS item_count
         FROM {$wpdb->usermeta}
         WHERE user_id IN ({$idList})
           AND meta_key REGEXP 'phone|mobile|whatsapp|freelancer'
         GROUP BY meta_key
         ORDER BY item_count DESC, meta_key ASC",
        ARRAY_A
    );
    foreach ($userMetaRows as $row) {
        $userMetaKeyCounts[(string)$row['meta_key']] = (int)$row['item_count'];
    }

    $postMetaRows = $wpdb->get_results(
        "SELECT pm.meta_key, COUNT(*) AS item_count
         FROM {$wpdb->postmeta} pm
         JOIN {$wpdb->posts} p ON p.ID = pm.post_id
         WHERE p.post_type = 'freelancer'
           AND pm.meta_key REGEXP 'phone|mobile|whatsapp|email|user.*id|freelancer'
         GROUP BY pm.meta_key
         ORDER BY item_count DESC, pm.meta_key ASC",
        ARRAY_A
    );
    foreach ($postMetaRows as $row) {
        $postMetaKeyCounts[(string)$row['meta_key']] = (int)$row['item_count'];
    }
}

if (array_key_exists('summary', $options)) {
    echo json_encode([
        'freelancerUsers' => count($users),
        'freelancerRoleKeys' => $freelancerRoleKeys,
        'roleInventory' => $roleInventory,
        'userMetaKeyCounts' => $userMetaKeyCounts,
        'freelancerPostMetaKeyCounts' => $postMetaKeyCounts,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit;
}

$userPhoneKeys = array_values(array_unique(array_merge([
    'billing_phone',
    'phone',
    'mobile',
    'mobile_number',
    'whatsapp',
    'whatsapp_number',
    '_freelancer_phone',
    'freelancer_phone',
], array_keys($userMetaKeyCounts))));

$records = [];
foreach ($users as $user) {
    $userId = (int)$user->ID;
    $email = strtolower(trim((string)$user->user_email));
    $firstName = gx_clean_scalar(get_user_meta($userId, 'first_name', true));
    $lastName = gx_clean_scalar(get_user_meta($userId, 'last_name', true));
    $displayName = gx_clean_scalar($user->display_name);
    $username = gx_clean_scalar($user->user_login);
    $name = trim($firstName . ' ' . $lastName) ?: ($displayName ?: $username);

    $phone = '';
    $phoneSource = '';
    foreach ($userPhoneKeys as $metaKey) {
        $candidate = gx_normalize_phone(get_user_meta($userId, $metaKey, true));
        if ($candidate !== '') {
            $phone = $candidate;
            $phoneSource = 'user_meta:' . $metaKey;
            break;
        }
    }

    $profilePostId = 0;
    $profileCandidates = $wpdb->get_col($wpdb->prepare(
        "SELECT DISTINCT pm.post_id
         FROM {$wpdb->postmeta} pm
         JOIN {$wpdb->posts} p ON p.ID = pm.post_id
         WHERE p.post_type = 'freelancer'
           AND pm.meta_value = %s
           AND (pm.meta_key REGEXP 'user.*id|author.*id' OR pm.meta_key IN ('_freelancer_user_id', 'freelancer_user_id'))
         ORDER BY pm.post_id ASC",
        (string)$userId
    ));
    if ($profileCandidates !== []) {
        $profilePostId = (int)$profileCandidates[0];
    } elseif ($email !== '') {
        $profileCandidates = $wpdb->get_col($wpdb->prepare(
            "SELECT DISTINCT pm.post_id
             FROM {$wpdb->postmeta} pm
             JOIN {$wpdb->posts} p ON p.ID = pm.post_id
             WHERE p.post_type = 'freelancer'
               AND LOWER(pm.meta_value) = %s
               AND pm.meta_key REGEXP 'email'
             ORDER BY pm.post_id ASC",
            $email
        ));
        if ($profileCandidates !== []) {
            $profilePostId = (int)$profileCandidates[0];
        }
    }

    if ($profilePostId > 0) {
        $profileMeta = get_post_meta($profilePostId);
        if ($phone === '') {
            foreach ($profileMeta as $metaKey => $values) {
                if (!preg_match('/phone|mobile|whatsapp/i', (string)$metaKey)) {
                    continue;
                }
                $candidate = gx_normalize_phone(gx_first_value((array)$values));
                if ($candidate !== '') {
                    $phone = $candidate;
                    $phoneSource = 'post_meta:' . $metaKey;
                    break;
                }
            }
        }
        if ($email === '') {
            foreach ($profileMeta as $metaKey => $values) {
                if (!preg_match('/email/i', (string)$metaKey)) {
                    continue;
                }
                $candidate = sanitize_email(gx_first_value((array)$values));
                if ($candidate !== '') {
                    $email = strtolower($candidate);
                    break;
                }
            }
        }
    }

    $records[] = [
        'wordpressUserId' => $userId,
        'freelancerProfilePostId' => $profilePostId ?: null,
        'username' => $username,
        'displayName' => $name,
        'email' => $email,
        'phone' => $phone,
        'phoneSource' => $phoneSource,
        'registeredAt' => (string)$user->user_registered,
    ];
}

$payload = [
    'exportedAt' => gmdate('c'),
    'source' => 'blog.gigxomi.com',
    'freelancers' => $records,
];
$json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
if ($json === false) {
    fwrite(STDERR, "Unable to encode the WordPress freelancer export.\n");
    exit(1);
}

$output = (string)($options['output'] ?? '');
if ($output !== '') {
    if (file_put_contents($output, $json . PHP_EOL, LOCK_EX) === false) {
        fwrite(STDERR, "Unable to write {$output}.\n");
        exit(1);
    }
    chmod($output, 0600);
    echo json_encode([
        'output' => $output,
        'freelancers' => count($records),
        'withPhone' => count(array_filter($records, static fn(array $record): bool => $record['phone'] !== '')),
        'withEmail' => count(array_filter($records, static fn(array $record): bool => $record['email'] !== '')),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit;
}

echo $json . PHP_EOL;
