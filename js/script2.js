const urlParams = new URLSearchParams(window.location.search);
const numberTask = urlParams.get("numberTask");
let originalIssuedMap = new Map();

function formatDateTime(date) {
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function saveHeaderToLocalStorage() {
  const headerData = {
    numberTask: document.getElementById("headerNumberTask").textContent.trim(),
    workerName: document.getElementById("headerWorker").textContent.trim(),
    dateIssue: document.getElementById("headerDateIssue").textContent.trim(),
    dateAccept: document.getElementById("headerDateAccept").textContent.trim()
  };
  localStorage.setItem(`headerData_${numberTask}`, JSON.stringify(headerData));
}

document.getElementById("issueTaskBtn").addEventListener("click", () => {
  const dateIssue = document.getElementById("headerDateIssue");
  dateIssue.textContent = formatDateTime(new Date());
  dateIssue.dataset.original = "true";
  saveHeaderToLocalStorage();
});

document.getElementById("acceptTaskBtn").addEventListener("click", () => {
  const dateAccept = document.getElementById("headerDateAccept");
  dateAccept.textContent = formatDateTime(new Date());
  dateAccept.dataset.original = "true";
  saveHeaderToLocalStorage();
});

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
    const sourceData = data.filter(task => task.idTask === idTask);

    sourceData.forEach(task => {
      const uniqueKey = `${task.numberSP}-${task.numberOperation}`;
      originalIssuedMap.set(uniqueKey, parseInt(task.countIssued) || 0);
    });

    const savedData = localStorage.getItem(`taskData_${numberTask}`);
    const finalData = savedData ? JSON.parse(savedData) : sourceData;
    const savedHeader = localStorage.getItem(`headerData_${numberTask}`);
    const finalHeader = savedHeader ? JSON.parse(savedHeader) : taskByNumber;

    updateHeader(finalHeader);
    renderTable(finalData);
  })
  .catch(error => console.error('Ошибка:', error));

function parseCustomDate(dateString) {
  const str = dateString.trim().toLowerCase();
  const formats = [
    { regex: /^\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}/i, parse: s => new Date(s) },
    {
      regex: /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/,
      parse: s => new Date(s.replace(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/, "$3-$2-$1T$4:$5:00"))
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

function updateHeader(task) {
  document.title = `ССЗ № ${task.numberTask}`;
  document.getElementById("headerNumberTask").textContent = task.numberTask || "—";
  document.getElementById("headerWorker").textContent = task.workerName || "—";

  const formatDate = (dateStr) => {
    const date = parseCustomDate(dateStr);
    return date && !isNaN(date) ? formatDateTime(date) : "—";
  };

  const headerDateIssue = document.getElementById("headerDateIssue");
  const headerDateAccept = document.getElementById("headerDateAccept");
  headerDateIssue.textContent = formatDate(task.dateIssue);
  headerDateAccept.textContent = formatDate(task.dateAccept);
  headerDateIssue.dataset.original = task.dateIssue ? "true" : "false";
  headerDateAccept.dataset.original = task.dateAccept ? "true" : "false";
}

function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody");
  tableBody.innerHTML = "";

  data.forEach((task, index) => {
    const uniqueKey = `${task.numberSP}-${task.numberOperation}`;
    const originalIssued = originalIssuedMap.get(uniqueKey) || 0;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${task.numberSP || ""}</td>
      <td>${task.nameSP || ""}</td>
      <td>${task.typeSizeSP || ""}</td>
      <td>${task.numberOperation || ""}</td>
      <td>${task.nameOperation || ""}</td>
      <td
        contenteditable="true"
        class="editable countIssued"
        data-original="${originalIssued}"
        oninput="validateIssuedValue(this, ${originalIssued})"
      >${task.countIssued ?? ""}</td>
      <td contenteditable="true" class="editable countAccepted">${task.countAccepted ?? ""}</td>
      <td contenteditable="true" class="editable percentage">${task.percentage ?? ""}</td>
    `;
    tableBody.appendChild(row);
  });
}

function validateIssuedValue(inputCell, maxValue) {
  const currentValue = parseInt(inputCell.textContent) || 0;
  if (currentValue > maxValue) {
    inputCell.textContent = maxValue;
    alert(`Максимальное допустимое значение: ${maxValue}`);
  }
}

document.getElementById("backToList").addEventListener("click", () => history.back());

const editButton = document.getElementById("editValuesButton");
let isEditing = false;

editButton.addEventListener("click", () => {
  const editableCells = document.querySelectorAll(".editable");
  const dateIssue = document.getElementById("headerDateIssue");
  const dateAccept = document.getElementById("headerDateAccept");

  if (!isEditing) {
    editableCells.forEach(cell => cell.contentEditable = "true");
    editButton.textContent = "Сохранить изменения";
  } else {
    let isValid = true;
    const errors = [];

    if (dateIssue.dataset.original === "true" && !dateIssue.textContent.trim()) {
      errors.push("• Дата выдачи обязательна");
    }

    document.querySelectorAll("tr").forEach((row, rowIndex) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 8) return;

      const numberSP = cells[0].textContent.trim();
      const numberOperation = cells[3].textContent.trim();
      const uniqueKey = `${numberSP}-${numberOperation}`;
      const originalIssued = originalIssuedMap.get(uniqueKey) || 0;

      const currentIssued = parseInt(cells[5].textContent.trim()) || 0;
      const currentAccepted = parseInt(cells[6].textContent.trim()) || 0;
      const percent = parseInt(cells[7].textContent.trim()) || 0;

      if (currentIssued > originalIssued) {
        errors.push(`• Строка ${rowIndex}: Выданное (${currentIssued}) > Исходного (${originalIssued})`);
        isValid = false;
      }

      if (currentAccepted > currentIssued) {
        errors.push(`• Строка ${rowIndex}: Принятое (${currentAccepted}) > Выданного (${currentIssued})`);
        isValid = false;
      }

      if (percent < 0 || percent > 100 || isNaN(percent)) {
        errors.push(`• Строка ${rowIndex}: Процент (${percent}%) вне диапазона`);
        isValid = false;
      }
    });

    const uniqueErrors = [...new Set(errors)];
    if (uniqueErrors.length > 0) {
      alert("Обнаружены ошибки:\n" + uniqueErrors.join("\n"));
      return;
    }

    editableCells.forEach(cell => cell.contentEditable = "false");
    editButton.textContent = "Изменить данные";
    saveToLocalStorage();
  }
  isEditing = !isEditing;
});

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
    const numberSP = cells[0].textContent.trim();
    const numberOperation = cells[3].textContent.trim();

    updatedData.push({
      idTask: numberTask,
      numberSP: numberSP,
      nameSP: cells[1].textContent.trim(),
      typeSizeSP: cells[2].textContent.trim(),
      numberOperation: numberOperation,
      nameOperation: cells[4].textContent.trim(),
      countIssued: cells[5].textContent.trim(),
      countAccepted: cells[6].textContent.trim(),
      percentage: cells[7].textContent.trim()
    });
  });

  localStorage.setItem(`taskData_${numberTask}`, JSON.stringify(updatedData));
  localStorage.setItem(`headerData_${numberTask}`, JSON.stringify(headerData));
}
