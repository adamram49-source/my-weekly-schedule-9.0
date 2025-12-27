const calendarContainer = document.getElementById('calendar-container');
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');
let currentDate = new Date();

let tasks = JSON.parse(localStorage.getItem('tasks') || '{}');

function renderWeek() {
  calendarContainer.innerHTML = '';
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - startOfWeek.getDay());
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    const dayName = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][day.getDay()];
    dayDiv.innerHTML = `<h3>${dayName} - ${day.toLocaleDateString()}</h3>`;

    const dayKey = day.toDateString();
    tasks[dayKey] = tasks[dayKey] || [];
    tasks[dayKey].forEach(t => {
      const taskEl = createTaskElement(t, dayKey);
      dayDiv.appendChild(taskEl);
    });

    const addBtn = document.createElement('button');
    addBtn.textContent = 'הוסף משימה';
    addBtn.onclick = () => addTask(dayKey);
    dayDiv.appendChild(addBtn);

    calendarContainer.appendChild(dayDiv);
  }
}

function createTaskElement(task, dayKey) {
  const template = document.getElementById('task-template');
  const el = template.content.cloneNode(true);
  const div = el.querySelector('.task');
  const textSpan = el.querySelector('.task-text');
  const timeInput = el.querySelector('.task-time');
  const notifyCheckbox = el.querySelector('.task-notify');
  const editBtn = el.querySelector('.edit-task');
  const deleteBtn = el.querySelector('.delete-task');

  textSpan.textContent = task.text;
  timeInput.value = task.time;
  notifyCheckbox.checked = task.notify;

  function updateStatus() {
    const now = new Date();
    const [h, m] = task.time.split(':').map(Number);
    const taskDate = new Date(dayKey);
    taskDate.setHours(h, m, 0, 0);
    if (now >= taskDate && !task.done) div.style.backgroundColor = '#ADD8E6';
    if (task.done) div.style.backgroundColor = '#90EE90';
  }
  updateStatus();
  setInterval(updateStatus, 1000);

  editBtn.onclick = () => {
    const newText = prompt('ערוך את המשימה:', task.text);
    if (newText !== null) task.text = newText;
    const newTime = prompt('ערוך את השעה (HH:MM):', task.time);
    if (newTime !== null) task.time = newTime;
    task.notify = confirm('להפעיל התראה?');
    saveTasks();
    renderWeek();
  };

  deleteBtn.onclick = () => {
    tasks[dayKey] = tasks[dayKey].filter(t => t !== task);
    saveTasks();
    renderWeek();
  };

  if (task.notify) {
    setInterval(() => {
      const now = new Date();
      const [h, m] = task.time.split(':').map(Number);
      const taskDate = new Date(dayKey);
      taskDate.setHours(h, m, 0, 0);
      if (now.getTime() >= taskDate.getTime() && !task.done) {
        OneSignal.push(() => {
          OneSignal.sendSelfNotification(
            "לוח משימות", task.text, null, null, {}
          );
        });
        task.done = true;
        saveTasks();
      }
    }, 1000);
  }

  return div;
}

function addTask(dayKey) {
  const text = prompt('כתוב את המשימה:');
  if (!text) return;
  let time = prompt('כתוב את השעה (HH:MM):', '12:00');
  if (!time) time = '12:00';
  const notify = confirm('להפעיל התראה למשימה זו?');
  const task = { text, time, notify, done: false };
  tasks[dayKey].push(task);
  saveTasks();
  renderWeek();
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

prevWeekBtn.onclick = () => { currentDate.setDate(currentDate.getDate() - 7); renderWeek(); };
nextWeekBtn.onclick = () => { currentDate.setDate(currentDate.getDate() + 7); renderWeek(); };

renderWeek();
