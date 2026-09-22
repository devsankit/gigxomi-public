<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This provisioning script is CLI-only.\n");
    exit(1);
}

$wordpressRoot = $argv[1] ?? '/var/www/blog';
$environmentFile = $argv[2] ?? '/var/www/gigxomi-app/.env';
$wpLoad = rtrim($wordpressRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'wp-load.php';

if (!is_file($wpLoad) || !is_file($environmentFile)) {
    fwrite(STDERR, "WordPress or the application environment file was not found.\n");
    exit(1);
}

require_once $wpLoad;

$administrators = get_users([
    'role' => 'administrator',
    'orderby' => 'ID',
    'order' => 'ASC',
    'number' => 1,
]);

if (!$administrators) {
    fwrite(STDERR, "No WordPress administrator is available for the editorial integration.\n");
    exit(1);
}

$user = $administrators[0];
$appId = 'c82d2df4-4248-4f89-a04c-8c06ac6e2fd1';
$applicationName = 'Gigxomi Editorial Scheduler';

foreach (WP_Application_Passwords::get_user_application_passwords($user->ID) as $credential) {
    if (($credential['app_id'] ?? '') === $appId || ($credential['name'] ?? '') === $applicationName) {
        WP_Application_Passwords::delete_application_password($user->ID, $credential['uuid']);
    }
}

$created = WP_Application_Passwords::create_new_application_password($user->ID, [
    'name' => $applicationName,
    'app_id' => $appId,
]);

if (is_wp_error($created)) {
    fwrite(STDERR, "WordPress could not create the editorial application password.\n");
    exit(1);
}

$password = preg_replace('/\s+/', '', (string) $created[0]);
$contents = (string) file_get_contents($environmentFile);
$keys = ['WORDPRESS_URL', 'WORDPRESS_USERNAME', 'WORDPRESS_APPLICATION_PASSWORD'];
foreach ($keys as $key) {
    $contents = preg_replace('/^' . preg_quote($key, '/') . '=.*(?:\R|$)/m', '', $contents) ?? $contents;
}

$contents = rtrim($contents) . PHP_EOL
    . 'WORDPRESS_URL=https://blog.gigxomi.com' . PHP_EOL
    . 'WORDPRESS_USERNAME=' . $user->user_login . PHP_EOL
    . 'WORDPRESS_APPLICATION_PASSWORD=' . $password . PHP_EOL;

if (file_put_contents($environmentFile, $contents, LOCK_EX) === false) {
    fwrite(STDERR, "Could not update the application environment file.\n");
    exit(1);
}

chmod($environmentFile, 0600);
fwrite(STDOUT, "Provisioned a dedicated WordPress editorial credential for user {$user->user_login}; the secret was written directly to the server environment.\n");
