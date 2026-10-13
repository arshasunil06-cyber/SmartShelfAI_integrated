<?php
declare(strict_types=1);
require_once __DIR__ . '/_common.php';

/*
 * Transparent rule-based recommendation scoring:
 * +5 exact subject match
 * +3 book is tagged for the selected learning goal
 * +2 exact skill-level match
 * +1 adjacent skill level (beginner/intermediate or intermediate/advanced)
 * Unavailable books are not returned as primary recommendations.
 */
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJson(['success' => false, 'message' => 'Use POST with a JSON body.'], 405);
    }

    $input = getJsonInput();
    $subject = cleanString($input['subject'] ?? '', 80);
    $goal = cleanString($input['goal'] ?? '', 40);
    $level = strtolower(cleanString($input['level'] ?? '', 20));

    $validLevels = ['beginner', 'intermediate', 'advanced'];
    if ($subject === '' || $goal === '' || !in_array($level, $validLevels, true)) {
        sendJson([
            'success' => false,
            'message' => 'Please provide subject, goal, and a valid level (beginner, intermediate, advanced).'
        ], 422);
    }

    $pdo = getPDO();
    $stmt = $pdo->query(
        'SELECT id, title, author, category, subject, description, difficulty_level,
                learning_goals, total_copies, available_copies, cover_url
         FROM books'
    );
    $allBooks = $stmt->fetchAll();

    $ranked = [];
    foreach ($allBooks as $book) {
        $bookLevel = strtolower((string)$book['difficulty_level']);
        $goals = array_values(array_filter(array_map(
            static fn($item) => strtolower(trim($item)),
            explode(',', (string)($book['learning_goals'] ?? ''))
        )));
        $score = 0;
        $reasons = [];

        if (strcasecmp((string)$book['subject'], $subject) === 0) {
            $score += 5;
            $reasons[] = 'Matches your selected subject';
        }
        if (in_array(strtolower($goal), $goals, true)) {
            $score += 3;
            $reasons[] = 'Supports your learning goal';
        }
        if ($bookLevel === $level) {
            $score += 2;
            $reasons[] = 'Matches your skill level';
        } elseif (
            ($level === 'beginner' && $bookLevel === 'intermediate') ||
            ($level === 'intermediate' && in_array($bookLevel, ['beginner', 'advanced'], true)) ||
            ($level === 'advanced' && $bookLevel === 'intermediate')
        ) {
            $score += 1;
            $reasons[] = 'Provides a nearby difficulty level';
        }

        if ($score > 0 && (int)$book['available_copies'] > 0) {
            $book['id'] = (int)$book['id'];
            $book['total_copies'] = (int)$book['total_copies'];
            $book['available_copies'] = (int)$book['available_copies'];
            $book['is_available'] = true;
            $book['learning_goals'] = $goals;
            $book['recommendation_score'] = $score;
            $book['recommendation_reasons'] = $reasons;
            $ranked[] = $book;
        }
    }

    usort($ranked, static function(array $a, array $b): int {
        return ($b['recommendation_score'] <=> $a['recommendation_score'])
            ?: strcasecmp($a['title'], $b['title']);
    });

    $recommendations = array_slice($ranked, 0, 8);

    // If no available match exists, provide available alternatives in the same subject/category.
    $alternatives = [];
    if (count($recommendations) === 0) {
        foreach ($allBooks as $book) {
            if ((int)$book['available_copies'] > 0 &&
                (strcasecmp((string)$book['subject'], $subject) === 0 ||
                 strcasecmp((string)$book['category'], $subject) === 0)) {
                $book['id'] = (int)$book['id'];
                $book['total_copies'] = (int)$book['total_copies'];
                $book['available_copies'] = (int)$book['available_copies'];
                $book['is_available'] = true;
                $book['learning_goals'] = array_values(array_filter(array_map('trim', explode(',', (string)$book['learning_goals']))));
                $book['recommendation_reasons'] = ['Available alternative related to your subject'];
                $alternatives[] = $book;
            }
        }
        $alternatives = array_slice($alternatives, 0, 5);
    }

    sendJson([
        'success' => true,
        'preferences' => ['subject' => $subject, 'goal' => $goal, 'level' => $level],
        'count' => count($recommendations),
        'recommendations' => $recommendations,
        'alternatives' => $alternatives,
        'algorithm' => 'Rule-based matching; this prototype does not call an external AI service.'
    ]);
} catch (Throwable $e) {
    handleApiError($e);
}
