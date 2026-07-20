<?php
declare(strict_types=1);

// Ten plik jest wyłącznie wzorem. Właściwy plik .analytics-config.php
// powstaje podczas wdrożenia z sekretów zapisanych w GitHubie.
return [
    'db_host' => 'localhost',
    'db_name' => 'oazapl_stats',
    'db_user' => 'oazapl_stats',
    'db_password' => 'UZUPELNIANE_PODCZAS_WDROZENIA',
    'admin_password_hash' => 'UZUPELNIANE_PODCZAS_WDROZENIA',
    'hash_key' => 'UZUPELNIANE_PODCZAS_WDROZENIA',
    'allowed_origins' => [
        'https://grupystudenckie.pl',
        'https://www.grupystudenckie.pl',
        'https://exoplayy.github.io',
    ],
];
