<?php

declare(strict_types=1);

$options = getopt('', ['apply', 'wordpress-root::', 'content-root::', 'backup-dir::']);
$apply = array_key_exists('apply', $options);
$wordpressRoot = rtrim((string)($options['wordpress-root'] ?? '/var/www/blog'), '/');
$contentRoots = isset($options['content-root'])
    ? [rtrim((string)$options['content-root'], '/')]
    : [dirname(__DIR__) . '/content/comparisons', dirname(__DIR__) . '/content/buyer-intent'];
$backupDir = rtrim((string)($options['backup-dir'] ?? '/var/backups/gigxomi-wordpress'), '/');
$wpLoad = $wordpressRoot . '/wp-load.php';

if (!is_file($wpLoad)) {
    fwrite(STDERR, "WordPress was not found at {$wordpressRoot}.\n");
    exit(1);
}

require $wpLoad;

if (!defined('WPSEO_VERSION')) {
    fwrite(STDERR, "Yoast SEO is not active. No editorial metadata was changed.\n");
    exit(1);
}

$files = [];
foreach ($contentRoots as $contentRoot) {
    $files = array_merge($files, glob($contentRoot . '/*.json') ?: []);
}
sort($files, SORT_STRING);

if ($files === []) {
    fwrite(STDERR, "No comparison content was found at {$contentRoot}.\n");
    exit(1);
}

$desired = [];
foreach ($files as $file) {
    $article = json_decode((string)file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    $slug = trim((string)($article['slug'] ?? ''));
    $title = trim((string)($article['title'] ?? ''));
    $description = trim((string)($article['seoDescription'] ?? ''));
    $focusKeyphrase = trim((string)($article['focusKeyphrase'] ?? ''));

    if ($slug === '' || $title === '' || $description === '' || $focusKeyphrase === '') {
        throw new RuntimeException("Incomplete SEO source fields in {$file}.");
    }
    if (stripos($title, $focusKeyphrase) === false) {
        throw new RuntimeException("The SEO title for {$slug} must contain the focus keyphrase '{$focusKeyphrase}'.");
    }
    $descriptionLength = function_exists('mb_strlen') ? mb_strlen($description) : strlen($description);
    if ($descriptionLength < 120 || $descriptionLength > 155) {
        throw new RuntimeException("The meta description for {$slug} must be 120-155 characters; found {$descriptionLength}.");
    }
    if (stripos($description, $focusKeyphrase) === false) {
        throw new RuntimeException("The meta description for {$slug} must contain the focus keyphrase '{$focusKeyphrase}'.");
    }

    $post = get_page_by_path($slug, OBJECT, 'post');
    if (!$post instanceof WP_Post) {
        continue;
    }

    $desired[] = [
        'id' => (int)$post->ID,
        'slug' => $slug,
        'status' => (string)$post->post_status,
        'meta' => [
            '_yoast_wpseo_focuskw' => $focusKeyphrase,
            '_yoast_wpseo_title' => $title,
            '_yoast_wpseo_metadesc' => $description,
        ],
    ];
}

$changes = [];
foreach ($desired as $entry) {
    $before = [];
    $after = [];
    foreach ($entry['meta'] as $key => $value) {
        $before[$key] = (string)get_post_meta($entry['id'], $key, true);
        $after[$key] = $value;
    }
    if ($before !== $after) {
        $changes[] = [
            'id' => $entry['id'],
            'slug' => $entry['slug'],
            'status' => $entry['status'],
            'before' => $before,
            'after' => $after,
        ];
    }
}

if (!$apply) {
    echo json_encode([
        'mode' => 'dry-run',
        'matchedPosts' => count($desired),
        'postsNeedingUpdate' => count($changes),
        'slugs' => array_column($changes, 'slug'),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(0);
}

if ($changes === []) {
    echo json_encode(['mode' => 'apply', 'updatedPosts' => 0, 'backup' => null], JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(0);
}

if (!is_dir($backupDir) && !mkdir($backupDir, 0700, true) && !is_dir($backupDir)) {
    throw new RuntimeException("Could not create backup directory {$backupDir}.");
}

$backupPath = $backupDir . '/yoast-editorial-before-' . gmdate('Ymd\THis\Z') . '.json';
$backup = json_encode([
    'createdAt' => gmdate(DATE_ATOM),
    'changes' => $changes,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
if (file_put_contents($backupPath, $backup . PHP_EOL, LOCK_EX) === false) {
    throw new RuntimeException("Could not write backup {$backupPath}.");
}
chmod($backupPath, 0600);

foreach ($changes as $change) {
    foreach ($change['after'] as $key => $value) {
        update_post_meta($change['id'], $key, $value);
    }
    $updated = wp_update_post(['ID' => $change['id']], true);
    if (is_wp_error($updated)) {
        throw new RuntimeException("WordPress could not refresh {$change['slug']}: " . $updated->get_error_message());
    }
    clean_post_cache($change['id']);
    foreach ($change['after'] as $key => $value) {
        if ((string)get_post_meta($change['id'], $key, true) !== $value) {
            throw new RuntimeException("Yoast metadata verification failed for {$change['slug']} ({$key}).");
        }
    }
}

echo json_encode([
    'mode' => 'apply',
    'updatedPosts' => count($changes),
    'backup' => $backupPath,
    'slugs' => array_column($changes, 'slug'),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
