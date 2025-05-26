document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createForm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTask = {
      numberTask: document.getElementById('taskNumber').value,
      departTask: document.getElementById('department').value,
      masterName: document.getElementById('master').value,
      workerName: document.getElementById('worker').value,
      dateIssue: new Date().toISOString(),
      dateAccept: new Date().toISOString()
    };

    // Сохраняем только в localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.unshift(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    window.location.href = 'table.html';
  });
});
