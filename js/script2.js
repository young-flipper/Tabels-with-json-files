const urlParams = new URLSearchParams(window.location.search);
const numberTask = urlParams.get("numberTask");

fetch('task.json')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    const taskByNumber = data.find(task => task.numberTask === numberTask);

    if (!taskByNumber) {
      window.location.href = "../html/error.html";
      return;
    }

    const idTask = taskByNumber.idTask;
    const filteredData = data.filter(task => task.idTask === idTask);

    // Загрузка сохраненных данных
    const savedData = localStorage.getItem(`taskData_${numberTask}`);
    const savedHeader = localStorage.getItem(`headerData_${numberTask}`);

    // Формирование финальных данных
    const finalData = savedData ? JSON.parse(savedData) : filteredData;
    const finalHeader = savedHeader ? JSON.parse(savedHeader) : taskByNumber;

    updateHeader(finalHeader);
    renderTable(finalData);
  })
  .catch(error => console.error('Ошибка:', error));

// Функция парсинга дат
function parseCustomDate(dateString) {
  const str = dateString.trim().toLowerCase();

  const formats = [
    // ISO (2024-02-08T13:03:42.673)
    {
      regex: /^\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}/i,
      parse: s => new Date(s)
    },
    // дд.мм.гггг чч:мм
    {
      regex: /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/,
      parse: s => {
        const [_, dd, mm, yyyy, hh, min] = s.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/);
        return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
      }
    },
    // дд.мм.гг, чч:мм
    {
      regex: /^(\d{2})\.(\d{2})\.(\d{2}), (\d{2}):(\d{2})$/,
      parse: s => {
        const [_, dd, mm, yy, hh, min] = s.match(/^(\d{2})\.(\d{2})\.(\d{2}), (\d{2}):(\d{2})$/);
        return new Date(`20${yy}-${mm}-${dd}T${hh}:${min}:00`);
      }
    }
  ];

  for (const { regex, parse } of formats) {
    if (regex.test(str)) {
      const date = parse(str);
      if (!isNaN(date.getTime())) return date;
    }
  }
  return null;
}

// Обновление шапки
function updateHeader(task) {
  document.title = `ССЗ № ${task.numberTask}`;
  document.getElementById("headerNumberTask").textContent = task.numberTask || "—";
  document.getElementById("headerWorker").textContent = task.workerName || "—";

  const formatDate = (dateStr) => {
    const date = parseCustomDate(dateStr);
    return date && !isNaN(date)
      ? date.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(',', '')
      : "—";
  };

  document.getElementById("headerDateIssue").textContent = formatDate(task.dateIssue);
  document.getElementById("headerDateAccept").textContent = formatDate(task.dateAccept);
}

// Рендер таблицы
function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody");
  tableBody.innerHTML = "";

  data.forEach(task => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${task.numberSP || ""}</td>
      <td>${task.nameSP || ""}</td>
      <td>${task.typeSizeSP || ""}</td>
      <td>${task.numberOperation || ""}</td>
      <td>${task.nameOperation || ""}</td>
      <td contenteditable="false" class="editable countIssued">${task.countIssued ?? ""}</td>
      <td contenteditable="false" class="editable countAccepted">${task.countAccepted ?? ""}</td>
      <td contenteditable="false" class="editable percentage">${task.percentage ?? ""}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Обработчики событий
document.getElementById("backToList").addEventListener("click", () => history.back());

const editButton = document.getElementById("editValuesButton");
let isEditing = false;

editButton.addEventListener("click", () => {
  const editableCells = document.querySelectorAll(".editable");
  const dateIssue = document.getElementById("headerDateIssue");
  const dateAccept = document.getElementById("headerDateAccept");

  if (!isEditing) {
    // Начало редактирования
    editableCells.forEach(cell => cell.contentEditable = "true");
    dateIssue.contentEditable = "true";
    dateAccept.contentEditable = "true";
    editButton.textContent = "Сохранить изменения";
  } else {
    // Валидация данных
    let isValid = true;

    // Проверка дат
    const issueDateText = dateIssue.textContent.trim();
    const acceptDateText = dateAccept.textContent.trim();
    const issueDate = parseCustomDate(issueDateText);
    const acceptDate = parseCustomDate(acceptDateText);

    if (!issueDate || !acceptDate) {
      alert("Некорректный формат дат!\nПример: 09.02.2024 14:30");
      isValid = false;
    } else if (issueDate > acceptDate) {
      alert("Дата принятия не может быть раньше даты выдачи!");
      isValid = false;
    }

    // Проверка количеств и процентов
    document.querySelectorAll("tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 8) return;

      const issued = cells[5].textContent.trim();
      const accepted = cells[6].textContent.trim();
      const percent = cells[7].textContent.trim();

      if (issued !== accepted ||
          isNaN(issued) ||
          isNaN(accepted) ||
          percent < 0 ||
          percent > 100) {
        isValid = false;
      }
    });

    if (!isValid) {
      alert("Ошибки в данных:\n- Количества должны совпадать\n- Процент: 0-100\n- Корректные даты");
      return;
    }

    // Завершение редактирования
    editableCells.forEach(cell => cell.contentEditable = "false");
    dateIssue.contentEditable = "false";
    dateAccept.contentEditable = "false";
    editButton.textContent = "Изменить данные";
    saveToLocalStorage();
  }
  isEditing = !isEditing;
});

// Сохранение данных
function saveToLocalStorage() {
  const updatedData = [];
  const headerData = {
    numberTask: document.getElementById("headerNumberTask").textContent.trim(),
    workerName: document.getElementById("headerWorker").textContent.trim(),
    dateIssue: document.getElementById("headerDateIssue").textContent.trim(),
    dateAccept: document.getElementById("headerDateAccept").textContent.trim()
  };

  document.querySelectorAll("#taskTable tbody tr").forEach(row => {
    const cells = row.querySelectorAll("td");
    updatedData.push({
      idTask: numberTask,
      numberSP: cells[0].textContent.trim(),
      nameSP: cells[1].textContent.trim(),
      typeSizeSP: cells[2].textContent.trim(),
      numberOperation: cells[3].textContent.trim(),
      nameOperation: cells[4].textContent.trim(),
      countIssued: cells[5].textContent.trim(),
      countAccepted: cells[6].textContent.trim(),
      percentage: cells[7].textContent.trim()
    });
  });

  localStorage.setItem(`taskData_${numberTask}`, JSON.stringify(updatedData));
  localStorage.setItem(`headerData_${numberTask}`, JSON.stringify(headerData));
}
