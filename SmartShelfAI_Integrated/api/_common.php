<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
// For a same-origin XAMPP project, you usually do not need CORS headers.
// If the frontend is hosted on a different origin, configure CORS narrowly.

require_once __DIR__ . '/../config/database.php';

function sendJson(array $payload, int $status = 200): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function cleanString(mixed $value, int $maxLength = 100): string {
    if (!is_string($value) && !is_numeric($value)) return '';
    return mb_substr(trim((string)$value), 0, $maxLength);
}

function handleApiError(Throwable $e): never {
    // Log details on the server; do not expose database credentials or stack traces.
    error_log((string)$e);
    sendJson(['success' => false, 'message' => 'A server error occurred. Check the PHP error log.'], 500);
}
