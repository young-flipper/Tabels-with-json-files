const urlParams = new URLSearchParams(window.location.search);
const numberTask = urlParams.get("numberTask");
let originalIssuedMap = new Map();

// Определяем столбцы, которые нужно объединять (Номер СП, Наименование, Типоразмер)
const MERGE_COLUMNS = [0, 1, 2];

// Форматирование даты и времени в строку
function formatDateTime(date) {
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Обрезание секунд и миллисекунд у даты
function truncateToMinutes(date) {
  const newDate = new Date(date);
  newDate.setSeconds(0, 0);
  return newDate;
}

// Сохранение данных заголовка в localStorage
function saveHeaderToLocalStorage() {
  const headerData = {
    numberTask: document.getElementById("headerNumberTask").textContent.trim(),
    workerName: document.getElementById("headerWorker").textContent.trim(),
    dateIssue: document.getElementById("headerDateIssue").textContent.trim(),
    dateAccept: document.getElementById("headerDateAccept").textContent.trim()
  };
  localStorage.setItem(`headerData_${numberTask}`, JSON.stringify(headerData));
}

// Обработчик кнопки "Выдать задание"
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

  // Проверка, что дата выдачи не позже даты принятия
  if (acceptDate && newDate > truncateToMinutes(acceptDate)) {
    alert("Дата выдачи не может быть позже даты принятия");
    return;
  }

  dateIssue.textContent = formatDateTime(newDate);
  dateIssue.dataset.original = "true";
  saveHeaderToLocalStorage();
  updateButtonStates();
});

// Обработчик кнопки "Принять задание"
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

// Обновление состояния кнопок и ячеек таблицы
function updateButtonStates() {
  const issueBtn = document.getElementById("issueTaskBtn");
  const acceptBtn = document.getElementById("acceptTaskBtn");
  const dateIssue = document.getElementById("headerDateIssue");
  const dateAccept = document.getElementById("headerDateAccept");

  const hasIssueDate = dateIssue.textContent !== "—";
  const hasAcceptDate = dateAccept.textContent !== "—";

  // Блокировка кнопок выдачи/принятия если обе даты уже установлены
  issueBtn.disabled = hasIssueDate && hasAcceptDate;
  acceptBtn.disabled = hasIssueDate && hasAcceptDate;

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

  const countIssuedCells = document.querySelectorAll(".countIssued");
  const countAcceptedCells = document.querySelectorAll(".countAccepted");
  const percentageCells = document.querySelectorAll(".percentage");

  // Определение состояния блокировки ячеек
  const isCountsLocked = !hasIssueDate || hasAcceptDate || !isEditing;
  const isPercentageLocked = !hasIssueDate || !isEditing;

  // Управление ячейками "Кол-во выдано"
  countIssuedCells.forEach(cell => {
    const isNewRow = cell.closest('tr').hasAttribute('data-is-new');
    cell.contentEditable = (isCountsLocked && !isNewRow) ? "false" : "true";
    if (isCountsLocked && !isNewRow) {
      cell.classList.add("disabled-cell");
    } else {
      cell.classList.remove("disabled-cell");
    }
  });

  countAcceptedCells.forEach(cell => {
    const isNewRow = cell.closest('tr').hasAttribute('data-is-new');
    cell.contentEditable = (isCountsLocked && !isNewRow) ? "false" : "true";
    if (isCountsLocked && !isNewRow) {
      cell.classList.add("disabled-cell");
    } else {
      cell.classList.remove("disabled-cell");
    }
  });

  percentageCells.forEach(cell => {
    const isNewRow = cell.closest('tr').hasAttribute('data-is-new');
    cell.contentEditable = (isPercentageLocked && !isNewRow) ? "false" : "true";
    if (isPercentageLocked && !isNewRow) {
      cell.classList.add("disabled-cell");
    } else {
      cell.classList.remove("disabled-cell");
    }
  });

  // Управление кнопкой "Изменить данные"
  const editButton = document.getElementById("editValuesButton");
  if (!hasIssueDate) {
    editButton.disabled = true;
    editButton.classList.add("disabled-btn");
  } else {
    editButton.disabled = false;
    editButton.classList.remove("disabled-btn");
  }

  // Управление кнопкой "Добавить запись"
  const addRowBtn = document.getElementById("addRowBtn");
  if (addRowBtn) {
    // Кнопка активна только в режиме редактирования (isEditing === true)
    addRowBtn.disabled = !isEditing;

    if (addRowBtn.disabled) {
      addRowBtn.classList.add("disabled-btn");
    } else {
      addRowBtn.classList.remove("disabled-btn");
    }
  }
}

// Функция для объединения ячеек в столбце
function mergeCellsInColumn(tableBody, colIndex) {
  const rows = tableBody.querySelectorAll('tr');
  if (rows.length === 0) return;

  let startRow = 0;
  let currentValue = rows[0].cells[colIndex].textContent.trim();
  let spanCount = 1;

  for (let i = 1; i < rows.length; i++) {
    const cellValue = rows[i].cells[colIndex].textContent.trim();

    if (cellValue === currentValue) {
      spanCount++;
      // Скрываем текущую ячейку
      rows[i].cells[colIndex].style.display = 'none';
    } else {
      // Объединяем предыдущие ячейки
      if (spanCount > 1) {
        rows[startRow].cells[colIndex].rowSpan = spanCount;
      }
      // Начинаем новый диапазон
      startRow = i;
      currentValue = cellValue;
      spanCount = 1;
    }
  }

  // Объединяем оставшиеся ячейки в конце
  if (spanCount > 1) {
    rows[startRow].cells[colIndex].rowSpan = spanCount;
  }
}

// Функция для добавления обработчиков расхождений
function addDiscrepancyHandlers(tableBody) {
  const rows = tableBody.querySelectorAll('tr');

  rows.forEach(row => {
    const issuedCell = row.querySelector('.countIssued');
    const acceptedCell = row.querySelector('.countAccepted');
    const discrepancyCell = row.querySelector('.discrepancy');

    if (issuedCell && acceptedCell && discrepancyCell) {
      const updateDiscrepancy = () => {
        const issued = parseInt(issuedCell.textContent) || 0;
        const accepted = parseInt(acceptedCell.textContent) || 0;
        discrepancyCell.textContent = issued - accepted;
      };

      issuedCell.addEventListener('input', updateDiscrepancy);
      acceptedCell.addEventListener('input', updateDiscrepancy);
    }
  });
}

// Загрузка данных задания
fetch('../html/task.json')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    let taskByNumber;
    let sourceData;

    // Поиск задания по номеру в основном JSON
    taskByNumber = data.find(task => task.numberTask === numberTask);

    if (taskByNumber) {
      // Если задание найдено в основном JSON
      const idTask = taskByNumber.idTask;
      sourceData = data.filter(task => task.idTask === idTask);

      // Заполнение originalIssuedMap исходными значениями
      sourceData.forEach(task => {
        const uniqueKey = `${task.numberSP}-${task.numberOperation}`;
        originalIssuedMap.set(uniqueKey, parseInt(task.countIssued) || 0);
      });
    } else {
      // Если задание не найдено, проверяем localStorage
      const localTasks = JSON.parse(localStorage.getItem('tasks')) || [];
      taskByNumber = localTasks.find(task => task.numberTask === numberTask);

      if (taskByNumber) {
        // Если задание найдено в localStorage
        sourceData = taskByNumber.items || [];

        // Для новых заданий заполняем originalIssuedMap нулями
        sourceData.forEach(task => {
          const uniqueKey = `${task.numberSP}-${task.numberOperation}`;
          originalIssuedMap.set(uniqueKey, 0);
        });
      } else {
        // Если задание не найдено нигде - перенаправляем на страницу ошибки
        window.location.href = "../html/error.html";
        return;
      }
    }

    // Загрузка сохраненных данных из localStorage
    const savedData = localStorage.getItem(`taskData_${numberTask}`);
    const finalData = savedData ? JSON.parse(savedData) : sourceData;
    const savedHeader = localStorage.getItem(`headerData_${numberTask}`);
    const finalHeader = savedHeader ? JSON.parse(savedHeader) : taskByNumber;

    // Обновление интерфейса
    updateHeader(finalHeader);
    renderTable(finalData);
    updateButtonStates();
    addAddRowButton();
  })
  .catch(error => console.error('Ошибка:', error));

// Парсинг даты из различных форматов
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

  // Попытка распарсить дату разными способами
  for (const { regex, parse } of formats) {
    if (regex.test(str)) {
      const date = parse(str);
      if (!isNaN(date.getTime())) return date;
    }
  }
  return null;
}

// Обновление заголовка задания
function updateHeader(task) {
  document.title = `ССЗ № ${task.numberTask}`;
  document.getElementById("headerNumberTask").textContent = task.numberTask || "—";
  document.getElementById("headerWorker").textContent = task.workerName || "—";

  // Форматирование даты для отображения
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

// Объявляем функции для валидации ввода
function validateNumberInput(inputCell) {
  inputCell.textContent = inputCell.textContent.replace(/[^\d]/g, '');
  if (inputCell.textContent.trim() === '') {
    inputCell.textContent = '0';
  }
}

function validatePercentageInput(inputCell) {
  inputCell.textContent = inputCell.textContent.replace(/[^\d]/g, '');
  if (inputCell.textContent.trim() === '') {
    inputCell.textContent = '0';
  }
  const value = parseInt(inputCell.textContent) || 0;
  if (value > 100) {
    inputCell.textContent = '100';
  }
}

// Отрисовка таблицы с данными задания
function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody");
  tableBody.innerHTML = "";

  // Создаем массив строк перед добавлением в DOM
  const rows = [];

  data.forEach((task, index) => {
    const uniqueKey = `${task.numberSP}-${task.numberOperation}`;
    const originalIssued = originalIssuedMap.get(uniqueKey) || 0;

    const countIssued = parseInt(task.countIssued) || 0;
    const countAccepted = parseInt(task.countAccepted) || 0;
    const discrepancy = countIssued - countAccepted;

    // Создание строки таблицы
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="number numberSP">${task.numberSP || ""}</td>
      <td>${task.nameSP || ""}</td>
      <td>${task.typeSizeSP || ""}</td>
      <td class="number">${task.numberOperation || ""}</td>
      <td>${task.nameOperation || ""}</td>
      <td class="number countIssued"
          contenteditable="true"
          data-original="${originalIssued}"
          oninput="validateNumberInput(this)"
      >${task.countIssued ?? ""}</td>
      <td class="number countAccepted"
          contenteditable="true"
          oninput="validateNumberInput(this)"
      >${task.countAccepted ?? ""}</td>
      <td class="number discrepancy">${discrepancy}</td>
      <td class="number percentage"
          contenteditable="true"
          oninput="validatePercentageInput(this)"
      >${task.percentage ?? ""}</td>
    `;
    rows.push(row);
  });

  // Добавляем строки в таблицу
  rows.forEach(row => tableBody.appendChild(row));

  // Объединяем ячейки в указанных столбцах
  MERGE_COLUMNS.forEach(colIndex => {
    mergeCellsInColumn(tableBody, colIndex);
  });

  // Добавляем обработчики событий для расчета расхождений
  addDiscrepancyHandlers(tableBody);
}

// Валидация числового ввода
function validateNumberInput(inputCell) {
  // Оставляем только цифры
  inputCell.textContent = inputCell.textContent.replace(/[^\d]/g, '');

  // Если значение пустое, устанавливаем 0
  if (inputCell.textContent.trim() === '') {
    inputCell.textContent = '0';
  }
}

// Валидация ввода процента (0-100)
function validatePercentageInput(inputCell) {
  // Оставляем только цифры
  inputCell.textContent = inputCell.textContent.replace(/[^\d]/g, '');

  // Если значение пустое, устанавливаем 0
  if (inputCell.textContent.trim() === '') {
    inputCell.textContent = '0';
  }

  // Ограничиваем максимальное значение 100
  const value = parseInt(inputCell.textContent) || 0;
  if (value > 100) {
    inputCell.textContent = '100';
  }
}

// Валидация значения "Кол-во выдано"
function validateIssuedValue(inputCell, maxValue) {
  // Для новых строк (с data-is-new) разрешаем любое значение
  if (inputCell.hasAttribute('data-is-new')) return;

  const currentValue = parseInt(inputCell.textContent) || 0;
  if (currentValue > maxValue) {
    inputCell.textContent = maxValue;
    alert(`Максимальное допустимое значение: ${maxValue}`);
  }
}

// Добавление кнопки "Добавить запись"
function addAddRowButton() {
  const buttonContainer = document.getElementById('buttonContainer');
  if (!buttonContainer) return;

  // Проверка, не добавлена ли кнопка уже
  if (document.getElementById('addRowBtn')) return;

  // Проверяем, является ли задание пользовательским (из localStorage)
  const localTasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const isUserTask = localTasks.some(task => task.numberTask === numberTask);

  // Добавляем кнопку только для пользовательских заданий
  if (isUserTask) {
    const addRowBtn = document.createElement('button');
    addRowBtn.textContent = 'Добавить запись';
    addRowBtn.id = 'addRowBtn';
    addRowBtn.classList.add('inverted-btn');
    addRowBtn.style.marginLeft = '10px';

    // Обработчик клика по кнопке добавления строки
    addRowBtn.addEventListener('click', () => {
      if (!isEditing) {
        alert('Сначала войдите в режим редактирования');
        return;
      }

      const tableBody = document.querySelector('#taskTable tbody');
      const newRow = document.createElement('tr');

      // Создание новой строки с пометкой data-is-new
      newRow.setAttribute('data-is-new', 'true');
      newRow.innerHTML = `
        <td class="number numberSP" contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td class="number" contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td class="number countIssued" contenteditable="true">0</td>
        <td class="number countAccepted" contenteditable="true">0</td>
        <td class="number discrepancy">0</td>
        <td class="number percentage" contenteditable="true">0</td>
      `;
      tableBody.appendChild(newRow);

      // Добавление обработчиков ввода для ограничения значений
      const numberSPCell = newRow.querySelector('.numberSP');
      const numberOperationCell = newRow.querySelector('td:nth-child(4)');
      const countIssuedCell = newRow.querySelector('.countIssued');
      const countAcceptedCell = newRow.querySelector('.countAccepted');
      const percentageCell = newRow.querySelector('.percentage');

      // Ограничение для Номера СП (только цифры, один / и один пробел, после пробела только 4 цифры)
      numberSPCell.addEventListener('input', function() {
        // Сохраняем позицию курсора
        const cursorPosition = window.getSelection().getRangeAt(0).startOffset;

        let value = this.textContent;

        // Удаляем все символы, кроме цифр, / и пробелов
        value = value.replace(/[^\d/ ]/g, '');

        // Ограничиваем количество слэшей (максимум 1)
        const slashCount = (value.match(/\//g) || []).length;
        if (slashCount > 1) {
          // Оставляем только первый слэш
          const parts = value.split('/');
          value = parts[0] + '/' + parts.slice(1).join('').replace(/\//g, '');
        }

        // Разделяем на части до и после слэша
        let [beforeSlash, afterSlash] = value.split('/');

        // Обрабатываем часть до слэша (максимум 4 цифры)
        if (beforeSlash) {
          beforeSlash = beforeSlash.replace(/\D/g, '').substring(0, 4);
        }

        // Обрабатываем часть после слэша
        if (afterSlash) {
          // Удаляем все пробелы для последующей обработки
          afterSlash = afterSlash.replace(/\s/g, '');

          // Форматируем часть после слэша: 3 цифры + пробел + 4 цифры
          if (afterSlash.length > 0) {
            const firstPart = afterSlash.substring(0, 3);
            let formattedAfterSlash = firstPart;

            // Если введено 3 цифры, добавляем пробел
            if (firstPart.length === 3) {
              formattedAfterSlash += ' ';

              // Добавляем оставшиеся цифры (максимум 4)
              const secondPart = afterSlash.substring(3, 7);
              formattedAfterSlash += secondPart;
            }

            afterSlash = formattedAfterSlash;
          }
        }

        // Собираем итоговое значение
        this.textContent = afterSlash !== undefined
          ? `${beforeSlash}/${afterSlash}`
          : beforeSlash;

        // Восстанавливаем позицию курсора
        if (window.getSelection().rangeCount > 0) {
          const range = window.getSelection().getRangeAt(0);
          range.setStart(this.childNodes[0], Math.min(cursorPosition, this.textContent.length));
          range.collapse(true);
        }
      });

      // Обработчик keydown для пробела
      numberSPCell.addEventListener('keydown', function(e) {
        if (e.key === ' ') {
          const selection = window.getSelection();
          if (selection.rangeCount === 0) return;

          const range = selection.getRangeAt(0);
          const cursorPosition = range.startOffset;
          let value = this.textContent;

          // Проверяем, можно ли вставить пробел (должен быть слэш и цифры после него)
          if (value.includes('/')) {
            const afterSlash = value.split('/')[1] || '';
            if (afterSlash.trim().length > 0 && !afterSlash.includes(' ')) {
              e.preventDefault();

              // Вставляем пробел в текущую позицию курсора
              const newValue = value.substring(0, cursorPosition) + ' ' + value.substring(cursorPosition);
              this.textContent = newValue;

              // Перемещаем курсор после пробела
              range.setStart(this.childNodes[0], cursorPosition + 1);
              range.collapse(true);
            }
          }
        }
      });

      // Ограничение для Номера операции (только цифры)
      numberOperationCell.addEventListener('input', function() {
        this.textContent = this.textContent.replace(/[^\d]/g, '');
      });

      // Ограничение для Кол-во выдано (только цифры)
      countIssuedCell.addEventListener('input', function() {
        this.textContent = this.textContent.replace(/[^\d]/g, '');
      });

      // Ограничение для Кол-во принято (только цифры)
      countAcceptedCell.addEventListener('input', function() {
        this.textContent = this.textContent.replace(/[^\d]/g, '');
      });

      // Ограничение для Процента выполнения (только цифры 0-100)
      percentageCell.addEventListener('input', function() {
        let value = this.textContent.replace(/[^\d]/g, '');
        if (value) {
          const num = parseInt(value);
          if (num > 100) {
            value = '100';
          }
        }
        this.textContent = value;
      });

      // Добавление обработчиков для расчета расхождений
      const issuedCell = newRow.querySelector('.countIssued');
      const acceptedCell = newRow.querySelector('.countAccepted');
      const discrepancyCell = newRow.querySelector('.discrepancy');

      const updateDiscrepancy = () => {
        const issued = parseInt(issuedCell.textContent) || 0;
        const accepted = parseInt(acceptedCell.textContent) || 0;
        discrepancyCell.textContent = issued - accepted;
      };

      issuedCell.addEventListener('input', updateDiscrepancy);
      acceptedCell.addEventListener('input', updateDiscrepancy);

      // Установка фокуса на первую ячейку
      newRow.querySelector('td').focus();
    });

    buttonContainer.appendChild(addRowBtn);
  }
}

// Обработчик кнопки "Вернуться к списку"
document.getElementById("backToList").addEventListener("click", () => history.back());

// Логика кнопки "Изменить данные"
const editButton = document.getElementById("editValuesButton");
let isEditing = false;

editButton.addEventListener("click", () => {
  const dateIssue = document.getElementById("headerDateIssue");
  const dateAccept = document.getElementById("headerDateAccept");
  const hasIssueDate = dateIssue.textContent !== "—";
  const hasAcceptDate = dateAccept.textContent !== "—";

  // Проверка наличия даты выдачи
  if (!hasIssueDate) {
    alert("Сначала установите дату выдачи задания");
    return;
  }

  if (!isEditing) {
    // Вход в режим редактирования
    editButton.textContent = "Сохранить изменения";
  } else {
    // Выход из режима редактирования (сохранение)
    let isValid = true;
    const errors = [];

    // Проверка обязательности даты выдачи
    if (dateIssue.dataset.original === "true" && !dateIssue.textContent.trim()) {
      errors.push("• Дата выдачи обязательна");
    }

    // Проверка данных в таблице (игнорируем скрытые строки)
    document.querySelectorAll("tr:not([style*='display: none'])").forEach((row, rowIndex) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 9) return;

      const numberSP = cells[0].textContent.trim();
      const numberOperation = cells[3].textContent.trim();
      const uniqueKey = `${numberSP}-${numberOperation}`;

      // Для новых строк устанавливаем введенное значение как исходное
      const issuedCell = cells[5];
      if (row.hasAttribute('data-is-new')) {
        // Проверяем, заполнены ли обязательные поля
        if (!numberSP || !numberOperation) {
          errors.push(`• Строка ${rowIndex + 1}: Обязательные поля не заполнены`);
          isValid = false;
          return;
        }

        const currentIssued = parseInt(issuedCell.textContent.trim()) || 0;
        originalIssuedMap.set(uniqueKey, currentIssued);
        issuedCell.setAttribute('data-original', currentIssued);
        row.removeAttribute('data-is-new');
      }

      const originalIssued = originalIssuedMap.get(uniqueKey) || 0;

      // Проверка количества выданных
      if (!cells[5].classList.contains("disabled-cell")) {
        const currentIssued = parseInt(cells[5].textContent.trim()) || 0;
        if (cells[5].hasAttribute('data-original') && currentIssued > originalIssued) {
          errors.push(`• Строка ${rowIndex + 1}: Выданное (${currentIssued}) > Исходного (${originalIssued})`);
          isValid = false;
        }
      }

      // Проверка количества принятых
      if (!cells[6].classList.contains("disabled-cell")) {
        const currentIssued = parseInt(cells[5].textContent.trim()) || 0;
        const currentAccepted = parseInt(cells[6].textContent.trim()) || 0;
        if (currentAccepted > currentIssued) {
          errors.push(`• Строка ${rowIndex + 1}: Принятое (${currentAccepted}) > Выданного (${currentIssued})`);
          isValid = false;
        }
      }

      // Проверка процента выполнения
      const percent = parseInt(cells[8].textContent.trim()) || 0;
      if (percent < 0 || percent > 100 || isNaN(percent)) {
        errors.push(`• Строка ${rowIndex + 1}: Процент (${percent}%) вне диапазона`);
        isValid = false;
      }
    });

    // Вывод ошибок, если они есть
    const uniqueErrors = [...new Set(errors)];
    if (uniqueErrors.length > 0) {
      alert("Обнаружены ошибки:\n" + uniqueErrors.join("\n"));
      return;
    }

    // Выход из режима редактирования
    editButton.textContent = "Изменить данные";
    saveToLocalStorage();

    // Перерисовываем таблицу для обновления объединенных ячеек
    const savedData = localStorage.getItem(`taskData_${numberTask}`);
    if (savedData) {
      renderTable(JSON.parse(savedData));
    }
  }

  isEditing = !isEditing;
  updateButtonStates(); // Обновляем состояние всех элементов
});

// Сохранение данных в localStorage
function saveToLocalStorage() {
  const updatedData = [];
  const headerData = {
    numberTask: document.getElementById("headerNumberTask").textContent.trim(),
    workerName: document.getElementById("headerWorker").textContent.trim(),
    dateIssue: document.getElementById("headerDateIssue").textContent.trim(),
    dateAccept: document.getElementById("headerDateAccept").textContent.trim()
  };

  // Сбор данных из таблицы (игнорируем скрытые строки)
  const rows = document.querySelectorAll("#taskTable tbody tr:not([style*='display: none'])");
  let hasEmptyCells = false;
  let emptyRowsCount = 0;

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length < 9) return;

    // Проверяем, является ли строка новой (не полностью заполненной)
    const isEmptyRow = Array.from(cells).slice(0, 5).some(cell => !cell.textContent.trim());

    if (isEmptyRow) {
      emptyRowsCount++;
      // Если строка не полностью заполнена, но содержит какие-то данные - это ошибка
      const hasSomeData = Array.from(cells).some(cell => cell.textContent.trim());
      if (hasSomeData) {
        hasEmptyCells = true;
      }
      return; // Пропускаем не полностью заполненные строки
    }

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

  // Если есть частично заполненные строки - показываем ошибку
  if (hasEmptyCells) {
    alert("Ошибка: Некоторые новые записи заполнены не полностью. Пожалуйста, заполните все обязательные поля (Номер СП, Наименование, Типоразмер, Номер операции, Наименование операции) или удалите пустые строки.");
    return;
  }

  // Если все новые строки пустые - просто их игнорируем
  if (emptyRowsCount > 0 && emptyRowsCount === document.querySelectorAll("tr[data-is-new]").length) {
    // Это просто новые пустые строки - их можно игнорировать
  }

  // Сохранение данных таблицы
  localStorage.setItem(`taskData_${numberTask}`, JSON.stringify(updatedData));

  // Обновление основной информации о задании
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const taskIndex = tasks.findIndex(task => task.numberTask === numberTask);

  if (taskIndex !== -1) {
    tasks[taskIndex].items = updatedData;
    tasks[taskIndex].dateIssue = headerData.dateIssue;
    tasks[taskIndex].dateAccept = headerData.dateAccept;
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Сохранение данных заголовка
  localStorage.setItem(`headerData_${numberTask}`, JSON.stringify(headerData));
  updateButtonStates();
}
