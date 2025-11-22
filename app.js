// ----------------- TAB HANDLING -----------------
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

// LocalStorage helpers
function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadFromStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}
// { id, subject, title, due, priority }
let assignments = loadFromStorage('assignments', []);
// ------------ ASSIGNMENT TRACKER ------------
const assignmentForm = document.getElementById('assignment-form');
const assignmentTableBody = document.querySelector('#assignment-table tbody');

function renderAssignments() {
  assignmentTableBody.innerHTML = '';

  // sort by due date
  const sorted = [...assignments].sort(
    (a, b) => new Date(a.dueRaw || a.due) - new Date(b.dueRaw || b.due)
  );

  sorted.forEach(assign => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${assign.subject}</td>
      <td>${assign.title}</td>
      <td>${assign.due}</td>
      <td>${assign.priority}</td>
      <td><button data-id="${assign.id}" class="delete-assign">✕</button></td>
    `;
    assignmentTableBody.appendChild(tr);
  });

  updateDashboardNextAssignment();
}

assignmentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const subject = document.getElementById('assign-subject').value.trim();
  const title = document.getElementById('assign-title').value.trim();
  const due = document.getElementById('assign-due').value;
  const priority = document.getElementById('assign-priority').value;

  if (!subject || !title || !due) {
    alert('Please fill in all required fields including the due date.');
    return;
  }

  // Format the date for better display
  const dueDate = new Date(due);
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  assignments.push({
    id: Date.now(),
    subject,
    title,
    due: formattedDate, // Store formatted date for display
    dueRaw: due, // Store raw date for sorting
    priority
  });

  saveToStorage('assignments', assignments);
  assignmentForm.reset();
  renderAssignments();
});

assignmentTableBody.addEventListener('click', (e) => {
  if (e.target.matches('.delete-assign')) {
    const id = Number(e.target.dataset.id);
    assignments = assignments.filter(a => a.id !== id);
    saveToStorage('assignments', assignments);
    renderAssignments();
  }
});
function updateDashboardNextAssignment() {
  const el = document.getElementById('next-assignment');
  if (!assignments.length) {
    el.textContent = 'No assignments yet.';
    return;
  }
  const sorted = [...assignments].sort(
    (a, b) => new Date(a.due) - new Date(b.due)
  );
  const next = sorted[0];
  el.textContent = `${next.title} (${next.subject}) – due ${next.due}`;
}
// ------------ GPA CALCULATOR ------------
const gradeMap = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0
};
const gpaBody = document.getElementById('gpa-body');
const addGpaRowBtn = document.getElementById('add-gpa-row');
const calcGpaBtn = document.getElementById('calculate-gpa');
const gpaResultEl = document.getElementById('gpa-result');

function addGpaRow(course = '', credits = '', grade = 'O') {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" value="${course}" class="g-course" placeholder="Course name" /></td>
    <td><input type="number" min="0" value="${credits}" class="g-credits" /></td>
    <td>
      <select class="g-grade">
        ${Object.keys(gradeMap).map(g =>
          `<option value="${g}" ${g === grade ? 'selected' : ''}>${g}</option>`
        ).join('')}
      </select>
    </td>
    <td><button class="delete-gpa-row">✕</button></td>
  `;
  gpaBody.appendChild(tr);
}

addGpaRowBtn.addEventListener('click', () => addGpaRow());

gpaBody.addEventListener('click', (e) => {
  if (e.target.matches('.delete-gpa-row')) {
    e.target.closest('tr').remove();
  }
});

calcGpaBtn.addEventListener('click', () => {
  const rows = gpaBody.querySelectorAll('tr');
  let totalCredits = 0;
  let weightedSum = 0;

  rows.forEach(row => {
    const credits = Number(row.querySelector('.g-credits').value);
    const grade = row.querySelector('.g-grade').value;
    if (!credits || !(grade in gradeMap)) return;
    totalCredits += credits;
    weightedSum += credits * gradeMap[grade];
  });

  if (!totalCredits) {
    gpaResultEl.textContent = '-';
    return;
  }

  const gpa = weightedSum / totalCredits;
  const rounded = gpa.toFixed(2);
  gpaResultEl.textContent = rounded;

  // update dashboard
  document.getElementById('current-gpa').textContent = rounded;
});
// ------------ POMODORO TIMER ------------
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-timer');
const pauseBtn = document.getElementById('pause-timer');
const resetBtn = document.getElementById('reset-timer');
const timerModeEl = document.getElementById('timer-mode');

let timerSeconds = 25 * 60;
let timerInterval = null;

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

startBtn.addEventListener('click', () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timerSeconds--;
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerSeconds = 25 * 60;
      alert('Focus session complete! Take a short break.');
    }
    updateTimerDisplay();
  }, 1000);
});

pauseBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 25 * 60;
  timerModeEl.textContent = 'Focus';
  updateTimerDisplay();
});

updateTimerDisplay();
// ------------ MOTIVATION BOARD ------------
let motivations = loadFromStorage('motivations', []);

const motivationForm = document.getElementById('motivation-form');
const motivationInput = document.getElementById('motivation-text');
const motivationList = document.getElementById('motivation-list');

function renderMotivations() {
  motivationList.innerHTML = '';
  motivations.forEach(m => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${m.text}</span>
      <button data-id="${m.id}" class="delete-motivation">✕</button>
    `;
    motivationList.appendChild(li);
  });
  updateDashboardMotivation();
}

motivationForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = motivationInput.value.trim();
  if (!text) return;
  motivations.push({ id: Date.now(), text });
  saveToStorage('motivations', motivations);
  motivationForm.reset();
  renderMotivations();
});

motivationList.addEventListener('click', (e) => {
  if (e.target.matches('.delete-motivation')) {
    const id = Number(e.target.dataset.id);
    motivations = motivations.filter(m => m.id !== id);
    saveToStorage('motivations', motivations);
    renderMotivations();
  }
});

function updateDashboardMotivation() {
  const el = document.getElementById('daily-quote');
  if (!motivations.length) {
    el.textContent = 'Add some motivational notes!';
    return;
  }
  const random = motivations[Math.floor(Math.random() * motivations.length)];
  el.textContent = random.text;
}
// ------------ RESOURCE ORGANISER ------------
let resources = loadFromStorage('resources', []);

const resourceForm = document.getElementById('resource-form');
const resTitle = document.getElementById('resource-title');
const resUrl = document.getElementById('resource-url');
const resTag = document.getElementById('resource-tag');
const resSearch = document.getElementById('resource-search');
const resList = document.getElementById('resource-list');

function renderResources(filter = '') {
  resList.innerHTML = '';
  const q = filter.toLowerCase();

  resources
    .filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.tag && r.tag.toLowerCase().includes(q))
    )
    .forEach(r => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.title}</a>
          ${r.tag ? `<small> [${r.tag}]</small>` : ''}
        </div>
        <button data-id="${r.id}" class="delete-resource">✕</button>
      `;
      resList.appendChild(li);
    });
}

resourceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = resTitle.value.trim();
  const url = resUrl.value.trim();
  const tag = resTag.value.trim();
  if (!title || !url) return;
  resources.push({ id: Date.now(), title, url, tag });
  saveToStorage('resources', resources);
  resourceForm.reset();
  renderResources(resSearch.value);
});

resList.addEventListener('click', (e) => {
  if (e.target.matches('.delete-resource')) {
    const id = Number(e.target.dataset.id);
    resources = resources.filter(r => r.id !== id);
    saveToStorage('resources', resources);
    renderResources(resSearch.value);
  }
});

resSearch.addEventListener('input', () => {
  renderResources(resSearch.value);
});
// -------- INITIAL RENDER --------
renderAssignments();
renderMotivations();
renderResources();
updateDashboardNextAssignment();
updateDashboardMotivation();
// GPA is calculated when user presses the button

