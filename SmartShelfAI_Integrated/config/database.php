<?php
declare(strict_types=1);

/*
 * Update these values to match your local MySQL setup.
 * Do not upload real database passwords to a public repository.
 */
const DB_HOST = '127.0.0.1';
const DB_NAME = 'smartshelf_ai';
const DB_USER = 'root';
const DB_PASS = ''; // XAMPP default is often blank; change if yours differs.

function getPDO(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    return $pdo;
}
