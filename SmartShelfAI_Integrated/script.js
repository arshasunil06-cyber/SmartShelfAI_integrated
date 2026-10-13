'use strict';

// The frontend and PHP API are served from the same SmartShelf project folder.
const API = './api';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const CATEGORY_MAP = {
  programming: 'Programming', 'web-development': 'Web Development', backend: 'Backend',
  database: 'Database', 'ai-ml': 'AI & Machine Learning', cybersecurity: 'Cybersecurity',
  'data-science': 'Data Science'
};
let books = [];
let favourites = new Set(JSON.parse(localStorage.getItem('smartshelf_favourites') || '[]').map(Number));
let activeModalBook = null;

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = (value = '') => String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const bookCategory = book => String(book.category || book.subject || 'Books');
const bookLevel = book => String(book.difficulty_level || 'beginner');
const coverFor = book => book.cover_url || '';

function showMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('error-message', isError);
}

async function apiJSON(url, options = {}) {
  const response = await fetch(url, options);
  let data;
  try { data = await response.json(); }
  catch { throw new Error('The server returned an invalid response. Check PHP errors and API URL.'); }
  if (!response.ok || data.success === false) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function cardHTML(book, {recommendation = false} = {}) {
  const id = Number(book.id);
  const title = escapeHTML(book.title || 'Untitled book');
  const author = escapeHTML(book.author || 'Unknown author');
  const category = escapeHTML(bookCategory(book));
  const level = escapeHTML(bookLevel(book));
  const description = escapeHTML(book.description || 'Explore this title in the SmartShelf collection.');
  const isFav = favourites.has(id);
  const available = book.is_available ?? Number(book.available_copies || 0) > 0;
  const cover = coverFor(book);
  const image = cover
    ? `<img src="${escapeHTML(cover)}" alt="Cover of ${title}" loading="lazy" onerror="this.parentElement.innerHTML='<span aria-hidden=&quot;true&quot;>📚</span>'">`
    : `<span aria-hidden="true">📚</span>`;
  const reasons = Array.isArray(book.recommendation_reasons) && book.recommendation_reasons.length
    ? `<p class="recommendation-reasons">${book.recommendation_reasons.map(escapeHTML).join(' · ')}</p>` : '';
  return `<article class="book-card" data-book-id="${id}">
    <button class="favorite-toggle ${isFav ? 'is-favorite' : ''}" data-favorite="${id}" type="button" aria-label="${isFav ? 'Remove from' : 'Add to'} favourites" aria-pressed="${isFav}">${isFav ? '♥' : '♡'}</button>
    <button class="book-cover" data-details="${id}" type="button" aria-label="View details for ${title}">${image}</button>
    <div class="book-card-body"><span class="book-category">${category}</span><h3><button class="book-title-button" data-details="${id}" type="button">${title}</button></h3>
    <p class="book-author">by ${author}</p><p class="book-description">${description}</p>
    <div class="book-meta"><span class="level-pill">${level}</span><span class="availability ${available ? 'available' : 'unavailable'}">${available ? `${Number(book.available_copies ?? 1)} available` : 'Currently unavailable'}</span></div>
    ${reasons}<button class="details-button" data-details="${id}" type="button">Book details ↗</button></div></article>`;
}

function renderGrid(element, items, options = {}) {
  if (!element) return;
  element.innerHTML = items.length ? items.map(book => cardHTML(book, options)).join('') : '';
}

function visibleBooks() {
  const query = ($('#searchInput')?.value || '').trim().toLowerCase();
  const category = $('#categoryFilter')?.value || 'all';
  const level = $('#levelFilter')?.value || 'all';
  const sort = $('#sortFilter')?.value || 'default';
  let result = books.filter(book => {
    const text = [book.title, book.author, book.subject, book.category, book.description].join(' ').toLowerCase();
    const categoryMatch = category === 'all' || slug(book.category) === category || slug(book.subject) === category || (category === 'backend' && /php|backend|server-side/i.test(text));
    return (!query || text.includes(query)) && categoryMatch && (level === 'all' || bookLevel(book) === level);
  });
  if (sort === 'title') result.sort((a,b) => a.title.localeCompare(b.title));
  if (sort === 'author') result.sort((a,b) => a.author.localeCompare(b.author));
  return result;
}

function renderCatalogue() {
  const result = visibleBooks();
  renderGrid($('#bookContainer'), result);
  $('#resultCount').textContent = `${result.length} ${result.length === 1 ? 'book' : 'books'} found`;
  $('#emptyMessage').hidden = result.length > 0;
}

function renderFavourites() {
  const saved = books.filter(book => favourites.has(Number(book.id)));
  $('#favoriteCount').textContent = String(favourites.size);
  renderGrid($('#favoritesGrid'), saved);
  $('#favoritesEmpty').hidden = saved.length > 0;
}

function updateAllCards() {
  renderCatalogue();
  renderFavourites();
  renderGrid($('#featuredGrid'), books.filter(b => (b.is_available ?? b.available_copies > 0)).slice(0, 3));
}

async function loadBooks() {
  $('#resultCount').textContent = 'Loading books from the catalogue…';
  try {
    const data = await apiJSON(`${API}/books.php`);
    books = data.books || [];
    updateAllCards();
    const total = $('#totalBooks');
    if (total) total.textContent = String(data.count ?? books.length);
    if (!books.length) showMessage($('#resultCount'), 'No books are in the database yet. Import database/smartshelf_ai.sql in phpMyAdmin.', true);
  } catch (error) {
    books = [];
    updateAllCards();
    showMessage($('#resultCount'), `Could not load books: ${error.message}. Make sure Apache and MySQL are running and open this site through http://localhost/SmartShelfAI_Integrated/`, true);
  }
}

async function getDetails(bookId) {
  const book = books.find(b => Number(b.id) === Number(bookId));
  if (!book) return;
  activeModalBook = book;
  const backdrop = $('#bookModal');
  $('#modalContent').innerHTML = `<div class="modal-book-content"><span class="modal-book-icon">📚</span><div><p class="eyebrow">${escapeHTML(bookCategory(book))}</p><h2 id="modalTitle">${escapeHTML(book.title)}</h2><p class="book-author">by ${escapeHTML(book.author)}</p><p>${escapeHTML(book.description || 'No description available.')}</p><dl class="book-detail-list"><div><dt>Subject</dt><dd>${escapeHTML(book.subject || bookCategory(book))}</dd></div><div><dt>Difficulty</dt><dd>${escapeHTML(bookLevel(book))}</dd></div><div><dt>Availability</dt><dd>${Number(book.available_copies || 0)} of ${Number(book.total_copies || 0)} copies available</dd></div></dl><p id="availabilityMessage" class="result-message"></p><div id="alternativeBooks"></div><button type="button" class="primary-button" id="checkAvailability">Check availability</button></div></div>`;
  backdrop.hidden = false; backdrop.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open');
  $('#checkAvailability').addEventListener('click', async () => {
    const btn = $('#checkAvailability'); btn.disabled = true; btn.textContent = 'Checking…';
    try {
      const data = await apiJSON(`${API}/availability.php?book_id=${Number(book.id)}`);
      const b = data.book;
      showMessage($('#availabilityMessage'), b.is_available ? `Available now: ${b.available_copies} of ${b.total_copies} copies.` : 'This book is currently unavailable. Try one of these alternatives.');
      if (data.alternatives?.length) $('#alternativeBooks').innerHTML = `<h3>Available alternatives</h3><ul>${data.alternatives.map(a => `<li>${escapeHTML(a.title)} — ${escapeHTML(a.author)}</li>`).join('')}</ul>`;
    } catch (error) { showMessage($('#availabilityMessage'), error.message, true); }
    finally { btn.disabled = false; btn.textContent = 'Check availability'; }
  });
}

function closeModal() { $('#bookModal').hidden = true; $('#bookModal').setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); }

async function recommendBooks() {
  const button = $('#recommendButton');
  const subject = $('#recommendSubject')?.value || 'Web Development';
  const goal = $('#goal')?.value || 'learn basics';
  const level = $('#recommendLevel')?.value || 'beginner';
  button.disabled = true; button.textContent = 'Finding your books…';
  showMessage($('#resultMessage'), 'Matching your preferences with available books…');
  try {
    const data = await apiJSON(`${API}/recommend.php`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({subject, goal, level})});
    const results = data.recommendations?.length ? data.recommendations : (data.alternatives || []);
    renderGrid($('#recommendationGrid'), results, {recommendation:true});
    showMessage($('#resultMessage'), results.length ? `Found ${results.length} book${results.length === 1 ? '' : 's'} for ${subject}, to ${goal}, at ${level} level.` : 'No matching available books yet. Try a different subject or goal.');
  } catch (error) {
    renderGrid($('#recommendationGrid'), []);
    showMessage($('#resultMessage'), `Recommendations could not be loaded: ${error.message}. Check the PHP API and database setup.`, true);
  } finally { button.disabled = false; button.textContent = 'Find My Recommendations ✦'; }
}

function toggleFavourite(id) {
  id = Number(id);
  if (favourites.has(id)) favourites.delete(id); else favourites.add(id);
  localStorage.setItem('smartshelf_favourites', JSON.stringify([...favourites]));
  updateAllCards();
  // Refresh recommendations' heart states too.
  if ($('#recommendationGrid').children.length) recommendBooks();
}

function resetFilters() {
  $('#searchInput').value = ''; $('#categoryFilter').value = 'all'; $('#levelFilter').value = 'all'; $('#sortFilter').value = 'default'; renderCatalogue();
}

$('#catalogueForm')?.addEventListener('submit', e => e.preventDefault());
$('#recommendForm')?.addEventListener('submit', e => { e.preventDefault(); recommendBooks(); });
$('#recommendButton')?.addEventListener('click', recommendBooks);
['searchInput','categoryFilter','levelFilter','sortFilter'].forEach(id => $(`#${id}`)?.addEventListener(id === 'searchInput' ? 'input' : 'change', renderCatalogue));
$('#clearSearch')?.addEventListener('click', () => { $('#searchInput').value = ''; renderCatalogue(); $('#searchInput').focus(); });
$('#resetFilters')?.addEventListener('click', resetFilters);
$('#emptyReset')?.addEventListener('click', resetFilters);
$('#modalClose')?.addEventListener('click', closeModal);
$('#bookModal')?.addEventListener('click', e => { if (e.target === $('#bookModal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#bookModal').hidden) closeModal(); });
document.addEventListener('click', e => {
  const fav = e.target.closest('[data-favorite]');
  if (fav) { toggleFavourite(fav.dataset.favorite); return; }
  const details = e.target.closest('[data-details]');
  if (details) getDetails(details.dataset.details);
  const categoryCard = e.target.closest('[data-category]');
  if (categoryCard) {
    const category = categoryCard.dataset.category;
    $('#categoryFilter').value = [...$('#categoryFilter').options].some(o => o.value === category) ? category : 'all';
    $('#searchInput').value = '';
    if ($('#categoryFilter').value === 'all') $('#searchInput').value = CATEGORY_MAP[category] || category;
    renderCatalogue(); location.hash = '#catalogue';
  }
  if (e.target.closest('#surpriseButton')) {
    if (books.length) { const available = books.filter(b => (b.is_available ?? b.available_copies > 0)); if (available.length) getDetails(available[Math.floor(Math.random()*available.length)].id); }
  }
});

loadBooks();
