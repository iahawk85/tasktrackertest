/**
 * Task Tracker — Vanilla JS
 * Features: Add, complete, delete tasks with localStorage persistence.
 */

const STORAGE_KEY = 'tasktracker_tasks';

/** @typedef {{ id: string, text: string, completed: boolean }} Task */

/** @returns {Task[]} */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate each item has required fields
    return parsed.filter(
      (t) =>
        typeof t === 'object' &&
        t !== null &&
        typeof t.id === 'string' &&
        typeof t.text === 'string' &&
        typeof t.completed === 'boolean'
    );
  } catch {
    // Corrupted data — reset
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/** @param {Task[]} tasks */
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/** Generate a simple unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// === DOM References ===

const formEl = document.getElementById('task-form');
const inputEl = /** @type {HTMLInputElement} */ (document.getElementById('task-input'));
const addBtnEl = /** @type {HTMLButtonElement} */ (document.getElementById('add-btn'));
const listEl = document.getElementById('task-list');
const countEl = document.getElementById('task-count');
const emptyStateEl = document.getElementById('empty-state');
const validationMsgEl = document.getElementById('validation-msg');
const charCountEl = document.getElementById('char-count');
const progressTrackEl = document.getElementById('progress-track');
const progressFillEl = document.getElementById('progress-fill');

// === State ===

/** @type {Task[]} */
let tasks = [];

// === Render ===

function render() {
  // Sort: incomplete first, then by creation order
  const sorted = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return 0;
  });

  listEl.innerHTML = '';

  for (const task of sorted) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.type = 'button';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Delete "${task.text}"`);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);
    listEl.appendChild(li);
  }

  updateCount();
  updateEmptyState();
}

function updateCount() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  countEl.textContent = `${done} of ${total} tasks completed`;

  // Update progress bar
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  progressFillEl.style.width = `${pct}%`;
  progressTrackEl.setAttribute('aria-valuenow', pct);
  progressTrackEl.classList.toggle('progress-track--empty', total === 0);
}

function updateEmptyState() {
  if (tasks.length === 0) {
    emptyStateEl.classList.remove('empty-state--hidden');
  } else {
    emptyStateEl.classList.add('empty-state--hidden');
  }
}

/** Show a validation message briefly */
function showValidation(msg) {
  validationMsgEl.textContent = msg;
}

function clearValidation() {
  validationMsgEl.textContent = '';
}

// === Actions ===

function addTask(text) {
  const trimmed = text.trim();

  // Validation
  if (trimmed === '') {
    showValidation('Task cannot be empty.');
    return false;
  }
  if (trimmed.length > 200) {
    showValidation('Task must be 200 characters or fewer.');
    return false;
  }

  clearValidation();

  const task = {
    id: uid(),
    text: trimmed,
    completed: false,
  };

  tasks.push(task);
  saveTasks(tasks);
  render();
  inputEl.value = '';
  // Reset char counter
  charCountEl.textContent = 200;
  charCountEl.classList.remove('char-count--warn', 'char-count--danger');
  inputEl.focus();
  return true;
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks(tasks);
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks(tasks);
  render();
}

// === Event Handlers ===

// Form submit
formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(inputEl.value);
});

// Delegate clicks on list (checkboxes and delete buttons)
listEl.addEventListener('click', (e) => {
  const li = e.target.closest('.task-item');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains('task-checkbox')) {
    toggleTask(id);
  } else if (e.target.classList.contains('delete-btn')) {
    deleteTask(id);
  }
});

// Clear validation + update char count on input
inputEl.addEventListener('input', () => {
  clearValidation();
  const remaining = 200 - inputEl.value.length;
  charCountEl.textContent = remaining;
  charCountEl.classList.remove('char-count--warn', 'char-count--danger');
  if (remaining <= 10) {
    charCountEl.classList.add('char-count--danger');
  } else if (remaining <= 30) {
    charCountEl.classList.add('char-count--warn');
  }
});

// === Init ===

tasks = loadTasks();
render();