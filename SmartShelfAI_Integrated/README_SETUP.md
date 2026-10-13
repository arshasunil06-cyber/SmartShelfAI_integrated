# SmartShelf — Integrated Student 1 Frontend + Student 2 PHP/MySQL Backend

This version keeps Student 1's SmartShelf page structure and connects the catalogue, filters, favourites, book details/availability, and recommendation form to Student 2's PHP API. The website must be opened through Apache/PHP, not by double-clicking `index.html`.

## Requirements
- XAMPP (Apache, MySQL/MariaDB, PHP 8.1+ recommended)
- PHP PDO MySQL extension enabled
- A modern browser

## 1. Install the project
1. Extract/copy the `SmartShelfAI_Integrated` folder into `C:\xampp\htdocs\`.
2. Start **Apache** and **MySQL** in the XAMPP Control Panel.
3. Open `http://localhost/phpmyadmin`.
4. Choose **Import**, select `SmartShelfAI_Integrated/database/smartshelf_ai.sql`, then click **Go**.
   - If importing the file by selecting it from the project folder is awkward, use phpMyAdmin's Import tab and browse to the SQL file.
5. Open `config/database.php` and confirm the database username/password. Default XAMPP commonly uses `root` with a blank password.

## 2. Open the connected website
Visit:

`http://localhost/SmartShelfAI_Integrated/`

Do not open `index.html` directly as a `file:///` URL: the browser needs Apache/PHP to run the API.

## 3. What is connected
- **Catalogue/search:** calls `GET api/books.php`; title, author, subject and description are searchable in the browser; category and level filters work against database records.
- **Recommendations:** sends the selected subject, learning goal, and level to `POST api/recommend.php` and renders returned recommendations on the page.
- **Availability:** book details call `GET api/availability.php?book_id=...`; unavailable books can show alternatives.
- **Favourites:** saved locally in the browser via `localStorage` (this is not account-based database saving).
- **Featured books and book cards:** rendered from the API/database rather than the old hard-coded frontend sample array.

## 4. Test the API separately if the page cannot load data
- `http://localhost/SmartShelfAI_Integrated/api/books.php`
- `http://localhost/SmartShelfAI_Integrated/api/books.php?q=javascript`
- `http://localhost/SmartShelfAI_Integrated/api/availability.php?book_id=5`

The recommendations endpoint requires a POST request. The website's recommendation form sends it automatically.

## Troubleshooting
- **404:** check that the folder name under `htdocs` is exactly `SmartShelfAI_Integrated`.
- **Database connection error:** check that MySQL is running and the credentials in `config/database.php` match your local setup.
- **No books:** import `database/smartshelf_ai.sql` and check the books table in phpMyAdmin.
- **PHP error/invalid JSON:** inspect the Apache/PHP error log and verify PDO MySQL is enabled.
- **Category with no results:** the sample SQL database currently contains only a small set of example categories/subjects. Add matching rows to the `books` table to populate other frontend categories.

## Scope
Recommendations use the backend's transparent rule-based scoring; this is a prototype, not an external AI model. Favourites remain in the current browser. Login, registration, database-backed favourites, and borrowing are not implemented.
