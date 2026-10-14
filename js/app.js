'use strict';

// Одинаковый ключ позволяет трём страницам использовать общие данные.
const TASK_KEY = 'studyflow.tasks.v1';
const PROFILE_KEY = 'studyflow.profile.v1';
const subjects = ['Веб-разработка', 'Дизайн', 'Математика', 'Английский язык', 'Другое'];
const priorities = { high: 'Высокий', normal: 'Обычный', low: 'Низкий' };
const priorityOrder = { high: 0, normal: 1, low: 2 };

// Локальная календарная дата без сдвига часового пояса через toISOString().
function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && value === `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function createExamples() {
  return [
    { id: 'demo-1', title: 'Сверстать главную страницу проекта', subject: 'Веб-разработка', date: localDate(), priority: 'high', done: false },
    { id: 'demo-2', title: 'Подготовить макет мобильной версии', subject: 'Дизайн', date: localDate(1), priority: 'normal', done: false },
    { id: 'demo-3', title: 'Решить задачи по производным', subject: 'Математика', date: localDate(3), priority: 'normal', done: false },
    { id: 'demo-4', title: 'Повторить слова к тесту', subject: 'Английский язык', date: localDate(-1), priority: 'low', done: false },
    { id: 'demo-5', title: 'Выбрать идею учебного проекта', subject: 'Веб-разработка', date: localDate(-2), priority: 'normal', done: true },
    { id: 'demo-6', title: 'Составить структуру страниц', subject: 'Дизайн', date: localDate(-1), priority: 'normal', done: true }
  ];
}

function isTask(task) {
  return task && typeof task.id === 'string' && typeof task.title === 'string'
    && task.title.trim().length >= 3 && task.title.length <= 80
    && subjects.includes(task.subject) && validDate(task.date)
    && Object.hasOwn(priorities, task.priority) && typeof task.done === 'boolean';
}

let storageUnavailable = false;
function readStorage(key, fallback, validate) {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    const parsed = JSON.parse(saved);
    if (validate(parsed)) return parsed;
    notify('Сохранённые данные повреждены. Загружены примеры.');
  } catch (error) {
    storageUnavailable = true;
    notify('Хранилище недоступно. Изменения сохранятся только до перезагрузки.');
  }
  return fallback;
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    storageUnavailable = true;
    return false;
  }
}

let notificationTimeout;
function notify(message) {
  const notification = document.querySelector('#notification');
  if (!notification) return;
  clearTimeout(notificationTimeout);
  notification.textContent = message;
  notificationTimeout = setTimeout(() => { notification.textContent = ''; }, 6000);
}

const tasks = readStorage(TASK_KEY, createExamples(), value => Array.isArray(value)
  && value.every(isTask) && new Set(value.map(task => task.id)).size === value.length);
let profile = readStorage(PROFILE_KEY, { name: 'Студент', email: '', group: '' }, value =>
  value && typeof value.name === 'string' && value.name.trim().length >= 2 && value.name.length <= 40
  && typeof value.email === 'string' && value.email.length <= 100
  && typeof value.group === 'string' && value.group.length <= 30);
// Сохраняем примеры один раз: пустой массив после удаления остаётся пустым.
writeStorage(TASK_KEY, tasks);

function isOverdue(task) { return !task.done && task.date < localDate(); }
function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}
function renderStats() {
  const done = tasks.filter(task => task.done).length;
  const values = { total: tasks.length, active: tasks.length - done, done, overdue: tasks.filter(isOverdue).length };
  document.querySelectorAll('[data-stat]').forEach(node => { node.textContent = values[node.dataset.stat]; });
  const progress = document.querySelector('#study-progress');
  if (progress) {
    const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    progress.value = percent;
    progress.textContent = `${percent}%`;
    document.querySelector('#progress-value').textContent = `${percent}%`;
    document.querySelector('#progress-caption').textContent = `Выполнено ${done} из ${tasks.length} задач`;
  }
}

function renderProfile() {
  document.querySelectorAll('[data-user-name]').forEach(node => { node.textContent = profile.name.split(' ')[0]; });
  document.querySelectorAll('[data-full-name]').forEach(node => { node.textContent = profile.name; });
  document.querySelectorAll('[data-group]').forEach(node => { node.textContent = profile.group || 'Группа не указана'; });
  document.querySelectorAll('[data-initials]').forEach(node => {
    node.textContent = profile.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  });
}

// Пользовательские строки вставляются через textContent: они не становятся HTML.
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function taskCard(task, showActions) {
  const card = element('article', `task-card${task.done ? ' is-done' : ''}`);
  const checkbox = element('input', 'task-check');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.id = `check-${task.id}`;
  checkbox.setAttribute('aria-label', `${task.done ? 'Вернуть в работу' : 'Отметить выполненной'}: ${task.title}`);
  checkbox.addEventListener('change', () => {
    task.done = checkbox.checked;
    persistTasks(task.done ? 'Задача выполнена. Отличная работа!' : 'Задача снова в работе.');
  });
  const content = element('div', 'task-content');
  const title = element('label', 'task-title', task.title);
  title.htmlFor = checkbox.id;
  const meta = element('div', 'task-meta');
  const date = element('time', isOverdue(task) ? 'overdue-date' : '', `${isOverdue(task) ? 'Просрочено · ' : ''}${formatDate(task.date)}`);
  date.dateTime = task.date;
  meta.append(element('span', 'subject-badge', task.subject), date, element('span', task.priority === 'high' ? 'priority-high' : '', `${priorities[task.priority]} приоритет`));
  content.append(title, meta);
  card.append(checkbox, content);
  if (showActions) {
    const actions = element('div', 'task-actions');
    const edit = element('button', 'icon-button', '✎');
    edit.type = 'button';
    edit.setAttribute('aria-label', `Изменить: ${task.title}`);
    edit.addEventListener('click', () => openTaskDialog(task));
    const remove = element('button', 'icon-button', '×');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Удалить: ${task.title}`);
    remove.addEventListener('click', () => openDeleteDialog(task));
    actions.append(edit, remove);
    card.append(actions);
  }
  return card;
}

let statusFilter = 'all';
function renderTasks() {
  const target = document.querySelector('#task-list');
  if (!target) return;
  const query = document.querySelector('#search').value.trim().toLocaleLowerCase('ru-RU');
  const subject = document.querySelector('#subject-filter').value;
  const sort = document.querySelector('#sort').value;
  const visible = tasks.filter(task =>
    `${task.title} ${task.subject}`.toLocaleLowerCase('ru-RU').includes(query)
    && (subject === 'all' || task.subject === subject)
    && (statusFilter === 'all' || (statusFilter === 'active' && !task.done)
      || (statusFilter === 'done' && task.done) || (statusFilter === 'overdue' && isOverdue(task))));
  visible.sort((a, b) => {
    if (sort === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority] || a.date.localeCompare(b.date);
    if (sort === 'title') return a.title.localeCompare(b.title, 'ru');
    return a.date.localeCompare(b.date);
  });
  target.replaceChildren(...visible.map(task => taskCard(task, true)));
  document.querySelector('#results-count').textContent = `Показано ${visible.length} из ${tasks.length} задач`;
  if (!visible.length) {
    const empty = element('div', 'empty-state');
    empty.append(element('strong', '', tasks.length ? 'Ничего не найдено' : 'Твой план начинается здесь'), element('p', '', tasks.length ? 'Измени поиск или фильтры.' : 'Нажми «Новая задача», чтобы добавить первое задание.'));
    target.append(empty);
  }
}

function renderUpcoming() {
  const target = document.querySelector('#upcoming-list');
  if (!target) return;
  const upcoming = tasks.filter(task => !task.done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  target.replaceChildren(...upcoming.map(task => taskCard(task, false)));
  if (!upcoming.length) target.append(element('p', 'empty-state', 'Все задачи выполнены. Можно выдохнуть!'));
}

function persistTasks(message) {
  const saved = writeStorage(TASK_KEY, tasks);
  renderStats();
  renderTasks();
  renderUpcoming();
  notify(saved ? message : 'Изменение принято, но не сохранено: хранилище недоступно.');
}

const menuButton = document.querySelector('.menu-button');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  document.querySelector('#navigation').classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    menuButton.setAttribute('aria-expanded', 'false');
    document.querySelector('#navigation').classList.remove('is-open');
    menuButton.focus();
  }
});

const taskDialog = document.querySelector('#task-dialog');
let editingId = null;
let deleteId = null;
function clearErrors(form, output) {
  output.textContent = '';
  form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
}
function fieldError(field, output, message) {
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', output.id);
  output.textContent = message;
  field.focus();
}
function openTaskDialog(task = null) {
  const form = document.querySelector('#task-form');
  form.reset();
  clearErrors(form, document.querySelector('#task-error'));
  editingId = task ? task.id : null;
  document.querySelector('#dialog-title').textContent = task ? 'Изменить задачу' : 'Новая задача';
  form.elements.title.value = task ? task.title : '';
  form.elements.subject.value = task ? task.subject : subjects[0];
  form.elements.date.value = task ? task.date : localDate(1);
  form.elements.priority.value = task ? task.priority : 'normal';
  taskDialog.showModal();
  form.elements.title.focus();
}
function openDeleteDialog(task) {
  deleteId = task.id;
  document.querySelector('#delete-description').textContent = `«${task.title}» будет удалена. Отменить удаление нельзя.`;
  document.querySelector('#delete-dialog').showModal();
  document.querySelector('#cancel-delete').focus();
}

if (taskDialog) {
  document.querySelector('#add-task').addEventListener('click', () => openTaskDialog());
  document.querySelector('#close-dialog').addEventListener('click', () => taskDialog.close());
  ['search', 'subject-filter', 'sort'].forEach(id => {
    document.getElementById(id).addEventListener(id === 'search' ? 'input' : 'change', renderTasks);
  });
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      statusFilter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(node => node.setAttribute('aria-pressed', String(node === button)));
      renderTasks();
    });
  });
  document.querySelector('#task-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const error = document.querySelector('#task-error');
    clearErrors(form, error);
    const title = form.elements.title.value.trim();
    const date = form.elements.date.value;
    if (title.length < 3 || title.length > 80) return fieldError(form.elements.title, error, 'Название должно содержать от 3 до 80 символов.');
    if (!validDate(date)) return fieldError(form.elements.date, error, 'Укажи корректный срок выполнения.');
    const values = { title, date, subject: form.elements.subject.value, priority: form.elements.priority.value };
    const previous = tasks.find(task => task.id === editingId);
    if (previous) Object.assign(previous, values);
    else tasks.push({ ...values, id: globalThis.crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random().toString(36).slice(2)}`, done: false });
    taskDialog.close();
    persistTasks(previous ? 'Задача обновлена.' : 'Новая задача добавлена.');
    document.querySelector('#add-task').focus();
  });
  document.querySelector('#cancel-delete').addEventListener('click', () => document.querySelector('#delete-dialog').close());
  document.querySelector('#confirm-delete').addEventListener('click', () => {
    const index = tasks.findIndex(task => task.id === deleteId);
    if (index !== -1) tasks.splice(index, 1);
    document.querySelector('#delete-dialog').close();
    persistTasks('Задача удалена.');
    document.querySelector('#add-task').focus();
  });
}

const profileForm = document.querySelector('#profile-form');
if (profileForm) {
  profileForm.elements.name.value = profile.name;
  profileForm.elements.email.value = profile.email;
  profileForm.elements.group.value = profile.group;
  profileForm.addEventListener('submit', event => {
    event.preventDefault();
    const error = document.querySelector('#profile-error');
    clearErrors(profileForm, error);
    const name = profileForm.elements.name.value.trim();
    const email = profileForm.elements.email.value.trim();
    const group = profileForm.elements.group.value.trim();
    if (name.length < 2 || name.length > 40) return fieldError(profileForm.elements.name, error, 'Имя должно содержать от 2 до 40 символов.');
    profileForm.elements.email.value = email;
    if (!email || !profileForm.elements.email.validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fieldError(profileForm.elements.email, error, 'Укажи корректный email, например student@example.com.');
    if (group.length > 30) return fieldError(profileForm.elements.group, error, 'Название группы не должно превышать 30 символов.');
    profile = { name, email, group };
    const saved = writeStorage(PROFILE_KEY, profile);
    renderProfile();
    notify(saved ? 'Профиль сохранён.' : 'Профиль изменён, но не сохранён: хранилище недоступно.');
  });
}

const today = document.querySelector('#today');
if (today) today.textContent = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
renderProfile();
renderStats();
renderTasks();
renderUpcoming();
if (storageUnavailable) notify('Хранилище недоступно. Изменения сохранятся только до перезагрузки.');
