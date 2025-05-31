const urlParams = new URLSearchParams(window.location.search);
const numberTask = urlParams.get("numberTask");
let originalIssuedMap = new Map();

function formatDateTime(date) {
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function truncateToMinutes(date) {
  const newDate = new Date(date);
  newDate.setSeconds(0, 0);
  return newDate;
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
  const newDate = truncateToMinutes(new Date());
  const dateIssue = document.getElementById("headerDateIssue");
  const dateAccept = document.getElementById("headerDateAccept");
  const acceptDate = parseCustomDate(dateAccept.textContent);
  const issueDate = parseCustomDate(dateIssue.textContent);

  // Если дата принятия уже установлена, а даты выдачи нет - используем дату принятия
  if (acceptDate && !issueDate) {
    dateIssue.textContent = formatDateTime(truncateToMinutes(acceptDate));
    dateIssue.dataset.original = "true";
    saveHeaderToLocalStorage();
    updateButtonStates();
    return;
  }

  // Старая проверка - если дата принятия есть и она раньше новой даты выдачи
  if (acceptDate && newDate > truncateToMinutes(acceptDate)) {
    alert("Дата выдачи не может быть позже даты принятия");
    return;
  }

  dateIssue.textContent = formatDateTime(newDate);
  dateIssue.dataset.original = "true";
  saveHeaderToLocalStorage();
  updateButtonStates();
});

document.getElementById("acceptTaskBtn").addEventListener("click", () => {
  const newDate = truncateToMinutes(new Date());
  const dateIssue = document.getElementById("headerDateIssue");
  const dateAcceptElement = document.getElementById("headerDateAccept");
  const issueDate = parseCustomDate(dateIssue.textContent);

  if (!issueDate) {
    alert("Сначала установите дату выдачи");
    return;
  }

  const issueDateTruncated = truncateToMinutes(issueDate);
  const newDateTruncated = truncateToMinutes(newDate);

  if (newDateTruncated < issueDateTruncated) {
    alert("Дата принятия не может быть раньше даты выдачи");
    return;
  }

  dateAcceptElement.textContent = formatDateTime(newDate);
  dateAcceptElement.dataset.original = "true";
  saveHeaderToLocalStorage();
  updateButtonStates();
});

function updateButtonStates() {
  const issueBtn = document.getElementById("issueTaskBtn");
  const acceptBtn = document.getElementById("acceptTaskBtn");
  const dateIssue = document.getElementById("headerDateIssue");
  const dateAccept = document.getElementById("headerDateAccept");

  // Проверяем наличие дат
  const hasIssueDate = dateIssue.textContent !== "—";
  const hasAcceptDate = dateAccept.textContent !== "—";

  // Блокируем кнопки выдачи/принятия если обе даты уже установлены
  issueBtn.disabled = hasIssueDate && hasAcceptDate;
  acceptBtn.disabled = hasIssueDate && hasAcceptDate;

  // Управляем стилями для кнопок выдачи/принятия
  if (issueBtn.disabled) {
    issueBtn.classList.add("disabled-btn");
  } else {
    issueBtn.classList.remove("disabled-btn");
  }

  if (acceptBtn.disabled) {
    acceptBtn.classList.add("disabled-btn");
  } else {
    acceptBtn.classList.remove("disabled-btn");
  }

  // Получаем все редактируемые ячейки таблицы
  const countIssuedCells = document.querySelectorAll(".countIssued");
  const countAcceptedCells = document.querySelectorAll(".countAccepted");
  const percentageCells = document.querySelectorAll(".percentage");

  /*
   Новое условие блокировки:
   - Если НЕТ даты выдачи (!hasIssueDate) - блокируем ВСЕ ячейки (выданные, принятые, процент)
   - Если ЕСТЬ дата принятия (hasAcceptDate) - блокируем ТОЛЬКО "Кол-во выдано" и "Кол-во принято"
   - Процент выполнения блокируется ТОЛЬКО при отсутствии даты выдачи
  */
  const isCountsLocked = !hasIssueDate || hasAcceptDate;
  const isPercentageLocked = !hasIssueDate;

  // Управляем ячейками "Кол-во выдано"
  countIssuedCells.forEach(cell => {
    cell.contentEditable = isCountsLocked ? "false" : "true";
    if (isCountsLocked) {
      cell.classList.add("disabled-cell");
    } else {
      cell.classList.remove("disabled-cell");
    }
  });

  // Управляем ячейками "Кол-во принято"
  countAcceptedCells.forEach(cell => {
    cell.contentEditable = isCountsLocked ? "false" : "true";
    if (isCountsLocked) {
      cell.classList.add("disabled-cell");
    } else {
      cell.classList.remove("disabled-cell");
    }
  });

  // Управляем ячейками "Процент выполнения" (блокируются ТОЛЬКО при отсутствии даты выдачи)
  percentageCells.forEach(cell => {
    cell.contentEditable = isPercentageLocked ? "false" : "true";
    if (isPercentageLocked) {
      cell.classList.add("disabled-cell");
    } else {
      cell.classList.remove("disabled-cell");
    }
  });

  /*
   Блокировка кнопки "Изменить данные":
   - Неактивна, если нет даты выдачи
   - Активна, если есть дата выдачи (независимо от даты принятия)
  */
  const editButton = document.getElementById("editValuesButton");
  if (!hasIssueDate) {
    editButton.disabled = true;
    editButton.classList.add("disabled-btn");
  } else {
    editButton.disabled = false;
    editButton.classList.remove("disabled-btn");
  }

  /*
   Дополнительная логика:
   - Если есть дата принятия, ячейки количества остаются заблокированными,
     но процент можно редактировать (isPercentageLocked проверяет только hasIssueDate)
   - При отсутствии даты выдачи всё заблокировано (включая процент и кнопку редактирования)
  */
}

fetch('../html/task.json')
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
    updateButtonStates();
  })
  .catch(error => console.error('Ошибка:', error));

function parseCustomDate(dateString) {
  const str = dateString.trim().toLowerCase();
  const formats = [
    {
      regex: /^\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}/i,
      parse: s => truncateToMinutes(new Date(s))
    },
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

    const countIssued = parseInt(task.countIssued) || 0;
    const countAccepted = parseInt(task.countAccepted) || 0;
    const discrepancy = countIssued - countAccepted;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="number numberSP">${task.numberSP || ""}</td>
      <td>${task.nameSP || ""}</td>
      <td>${task.typeSizeSP || ""}</td>
      <td class="number">${task.numberOperation || ""}</td>
      <td>${task.nameOperation || ""}</td>
      <td
        contenteditable="true"
        class="editable countIssued"
        data-original="${originalIssued}"
        oninput="validateIssuedValue(this, ${originalIssued})"
      >${task.countIssued ?? ""}</td>
      <td contenteditable="true" class="editable countAccepted number">${task.countAccepted ?? ""}</td>
      <td class="discrepancy number">${discrepancy}</td>
      <td contenteditable="true" class="editable percentage number">${task.percentage ?? ""}</td>
    `;
    tableBody.appendChild(row);

    const issuedCell = row.querySelector('.countIssued');
    const acceptedCell = row.querySelector('.countAccepted');
    const discrepancyCell = row.querySelector('.discrepancy');

    const updateDiscrepancy = () => {
      const issued = parseInt(issuedCell.textContent) || 0;
      const accepted = parseInt(acceptedCell.textContent) || 0;
      discrepancyCell.textContent = issued - accepted;
    };

    issuedCell.addEventListener('input', updateDiscrepancy);
    acceptedCell.addEventListener('input', updateDiscrepancy);
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
  const dateIssue = document.getElementById("headerDateIssue");
  const dateAccept = document.getElementById("headerDateAccept");
  const hasIssueDate = dateIssue.textContent !== "—";
  const hasAcceptDate = dateAccept.textContent !== "—";

  // ===== НОВАЯ ПРОВЕРКА =====
  // Запрещаем редактирование если нет даты выдачи
  if (!hasIssueDate) {
    alert("Сначала установите дату выдачи задания");
    return;
  }

  const editableCells = document.querySelectorAll(".editable");

  if (!isEditing) {
    // ===== ВХОД В РЕЖИМ РЕДАКТИРОВАНИЯ =====
    editableCells.forEach(cell => {
      // Разрешаем редактирование только тех ячеек, которые не заблокированы
      // (учитываем блокировку по дате принятия через класс disabled-cell)
      if (!cell.classList.contains("disabled-cell")) {
        cell.contentEditable = "true";
      }
    });
    editButton.textContent = "Сохранить изменения";
  } else {
    // ===== ВЫХОД ИЗ РЕЖИМА РЕДАКТИРОВАНИЯ (СОХРАНЕНИЕ) =====
    let isValid = true;
    const errors = [];

    // ===== СТАРАЯ ПРОВЕРКА =====
    // Проверка обязательности даты выдачи (если она была установлена)
    if (dateIssue.dataset.original === "true" && !dateIssue.textContent.trim()) {
      errors.push("• Дата выдачи обязательна");
    }

    // ===== ПРОВЕРКА ЗНАЧЕНИЙ В ТАБЛИЦЕ =====
    document.querySelectorAll("tr").forEach((row, rowIndex) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 9) return;

      const numberSP = cells[0].textContent.trim();
      const numberOperation = cells[3].textContent.trim();
      const uniqueKey = `${numberSP}-${numberOperation}`;
      const originalIssued = originalIssuedMap.get(uniqueKey) || 0;

      // ===== ПРОВЕРКА КОЛИЧЕСТВА ВЫДАННЫХ =====
      // Проверяем только если ячейка не заблокирована
      if (!cells[5].classList.contains("disabled-cell")) {
        const currentIssued = parseInt(cells[5].textContent.trim()) || 0;
        if (currentIssued > originalIssued) {
          errors.push(`• Строка ${rowIndex + 1}: Выданное (${currentIssued}) > Исходного (${originalIssued})`);
          isValid = false;
        }
      }

      // ===== ПРОВЕРКА КОЛИЧЕСТВА ПРИНЯТЫХ =====
      // Проверяем только если ячейка не заблокирована
      if (!cells[6].classList.contains("disabled-cell")) {
        const currentIssued = parseInt(cells[5].textContent.trim()) || 0;
        const currentAccepted = parseInt(cells[6].textContent.trim()) || 0;
        if (currentAccepted > currentIssued) {
          errors.push(`• Строка ${rowIndex + 1}: Принятое (${currentAccepted}) > Выданного (${currentIssued})`);
          isValid = false;
        }
      }

      // ===== ПРОВЕРКА ПРОЦЕНТА ВЫПОЛНЕНИЯ =====
      // Проверяем всегда, так как процент можно редактировать даже при наличии даты принятия
      const percent = parseInt(cells[8].textContent.trim()) || 0;
      if (percent < 0 || percent > 100 || isNaN(percent)) {
        errors.push(`• Строка ${rowIndex + 1}: Процент (${percent}%) вне диапазона`);
        isValid = false;
      }
    });

    // ===== ОБРАБОТКА ОШИБОК =====
    const uniqueErrors = [...new Set(errors)];
    if (uniqueErrors.length > 0) {
      alert("Обнаружены ошибки:\n" + uniqueErrors.join("\n"));
      return;
    }

    // ===== ВЫХОД ИЗ РЕЖИМА РЕДАКТИРОВАНИЯ =====
    editableCells.forEach(cell => {
      if (!cell.classList.contains("disabled-cell")) {
        cell.contentEditable = "false";
      }
    });
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
      percentage: cells[8].textContent.trim()
    });
  });

  localStorage.setItem(`taskData_${numberTask}`, JSON.stringify(updatedData));
  localStorage.setItem(`headerData_${numberTask}`, JSON.stringify(headerData));
  updateButtonStates();
}
