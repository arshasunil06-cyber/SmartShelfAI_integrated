CREATE DATABASE IF NOT EXISTS smartshelf_ai
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartshelf_ai;

CREATE TABLE IF NOT EXISTS students (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS books (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    subject VARCHAR(80) NOT NULL,
    description TEXT,
    difficulty_level ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
    learning_goals VARCHAR(255) NOT NULL DEFAULT '',
    total_copies INT UNSIGNED NOT NULL DEFAULT 1,
    available_copies INT UNSIGNED NOT NULL DEFAULT 1,
    cover_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_books_subject (subject),
    INDEX idx_books_category (category),
    INDEX idx_books_level (difficulty_level),
    CONSTRAINT chk_available_copies CHECK (available_copies <= total_copies)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_books (
    student_id INT UNSIGNED NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, book_id),
    CONSTRAINT fk_saved_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS borrow_records (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    borrowed_at DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_at DATE DEFAULT NULL,
    status ENUM('borrowed','returned','overdue') NOT NULL DEFAULT 'borrowed',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_borrow_student (student_id),
    INDEX idx_borrow_book_status (book_id, status),
    CONSTRAINT fk_borrow_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO books
(title, author, category, subject, description, difficulty_level, learning_goals, total_copies, available_copies, cover_url)
VALUES
('HTML and CSS: Design and Build Websites', 'Jon Duckett', 'Web Development', 'Web Development',
 'A visual introduction to building web pages with HTML and CSS.', 'beginner', 'learn basics,build projects', 5, 4, NULL),
('JavaScript: The Definitive Guide', 'David Flanagan', 'Programming', 'Web Development',
 'A reference for JavaScript language features and browser programming.', 'advanced', 'build projects,prepare exams', 3, 2, NULL),
('PHP and MySQL Web Development', 'Luke Welling and Laura Thomson', 'Web Development', 'Web Development',
 'Learn server-side web development with PHP and MySQL.', 'intermediate', 'learn basics,build projects', 4, 3, NULL),
('Learning SQL', 'Alan Beaulieu', 'Database', 'Database Management',
 'An introduction to relational databases and SQL queries.', 'beginner', 'learn basics,prepare exams', 4, 4, NULL),
('Database System Concepts', 'Abraham Silberschatz, Henry Korth, S. Sudarshan', 'Database', 'Database Management',
 'A broad introduction to database concepts and design.', 'advanced', 'deepen knowledge,prepare exams', 2, 0, NULL),
('Python Crash Course', 'Eric Matthes', 'Programming', 'Programming',
 'Hands-on programming projects for learning Python.', 'beginner', 'learn basics,build projects', 5, 5, NULL),
('Clean Code', 'Robert C. Martin', 'Software Engineering', 'Software Engineering',
 'Principles and examples for writing maintainable code.', 'advanced', 'deepen knowledge,build projects', 2, 1, NULL),
('Computer Networking: A Top-Down Approach', 'James Kurose and Keith Ross', 'Networking', 'Computer Networks',
 'An introduction to networking concepts and protocols.', 'intermediate', 'learn basics,prepare exams', 3, 3, NULL),
('Introduction to Algorithms', 'Thomas H. Cormen et al.', 'Computer Science', 'Algorithms',
 'A comprehensive textbook on algorithm design and analysis.', 'advanced', 'deepen knowledge,prepare exams', 2, 1, NULL),
('Eloquent JavaScript', 'Marijn Haverbeke', 'Programming', 'Web Development',
 'A hands-on guide to JavaScript programming and browser development.', 'intermediate', 'learn basics,build projects', 3, 0, NULL);
