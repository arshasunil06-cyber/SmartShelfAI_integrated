<?php
declare(strict_types=1);
require_once __DIR__ . '/_common.php';

try {
    $pdo = getPDO();

    $q = cleanString($_GET['q'] ?? '', 120);
    $category = cleanString($_GET['category'] ?? '', 80);
    $level = cleanString($_GET['level'] ?? '', 30);
    $availability = cleanString($_GET['availability'] ?? '', 20);

    $sql = 'SELECT id, title, author, category, subject, description, difficulty_level,
                   learning_goals, total_copies, available_copies, cover_url
            FROM books WHERE 1=1';
    $params = [];

    if ($q !== '') {
        $sql .= ' AND (title LIKE :q_title OR author LIKE :q_author OR subject LIKE :q_subject OR category LIKE :q_category)';
        $like = '%' . $q . '%';
        $params['q_title'] = $like;
        $params['q_author'] = $like;
        $params['q_subject'] = $like;
        $params['q_category'] = $like;
    }
    if ($category !== '') {
        $sql .= ' AND category = :category';
        $params['category'] = $category;
    }
    if ($level !== '') {
        $sql .= ' AND difficulty_level = :level';
        $params['level'] = $level;
    }
    if ($availability === 'available') {
        $sql .= ' AND available_copies > 0';
    } elseif ($availability === 'unavailable') {
        $sql .= ' AND available_copies = 0';
    }

    $sql .= ' ORDER BY title ASC LIMIT 200';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $books = $stmt->fetchAll();

    foreach ($books as &$book) {
        $book['id'] = (int)$book['id'];
        $book['total_copies'] = (int)$book['total_copies'];
        $book['available_copies'] = (int)$book['available_copies'];
        $book['is_available'] = $book['available_copies'] > 0;
        $book['learning_goals'] = $book['learning_goals'] === null
            ? [] : array_values(array_filter(array_map('trim', explode(',', $book['learning_goals']))));
    }
    unset($book);

    sendJson(['success' => true, 'count' => count($books), 'books' => $books]);
} catch (Throwable $e) {
    handleApiError($e);
}
