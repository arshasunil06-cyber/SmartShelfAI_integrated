<?php
declare(strict_types=1);
require_once __DIR__ . '/_common.php';

try {
    $pdo = getPDO();
    $id = filter_input(INPUT_GET, 'book_id', FILTER_VALIDATE_INT);
    if (!$id || $id < 1) {
        sendJson(['success' => false, 'message' => 'A valid book_id is required.'], 422);
    }

    $stmt = $pdo->prepare(
        'SELECT id, title, author, subject, category, difficulty_level,
                total_copies, available_copies
         FROM books WHERE id = :id'
    );
    $stmt->execute(['id' => $id]);
    $book = $stmt->fetch();

    if (!$book) {
        sendJson(['success' => false, 'message' => 'Book not found.'], 404);
    }

    $book['id'] = (int)$book['id'];
    $book['total_copies'] = (int)$book['total_copies'];
    $book['available_copies'] = (int)$book['available_copies'];
    $book['is_available'] = $book['available_copies'] > 0;

    $alternatives = [];
    if (!$book['is_available']) {
        $alt = $pdo->prepare(
            'SELECT id, title, author, subject, category, difficulty_level,
                    total_copies, available_copies
             FROM books
             WHERE id <> :id AND available_copies > 0
               AND (subject = :subject OR category = :category)
             ORDER BY (subject = :subject_order) DESC, title ASC
             LIMIT 5'
        );
        $alt->execute([
            'id' => $id,
            'subject' => $book['subject'],
            'category' => $book['category'],
            'subject_order' => $book['subject']
        ]);
        $alternatives = $alt->fetchAll();
        foreach ($alternatives as &$item) {
            $item['id'] = (int)$item['id'];
            $item['total_copies'] = (int)$item['total_copies'];
            $item['available_copies'] = (int)$item['available_copies'];
            $item['is_available'] = true;
        }
        unset($item);
    }

    sendJson([
        'success' => true,
        'book' => $book,
        'alternatives' => $alternatives
    ]);
} catch (Throwable $e) {
    handleApiError($e);
}
