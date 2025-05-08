let isEditingEnabled = false;

// Проверяем, определена ли переменная numberTask
if (typeof numberTask === 'undefined' || !numberTask) {
  console.error('numberTask не определен.');
  window.location.href = "/error"; // Перенаправляем на страницу ошибки
}

// Загружаем данные из сервера
fetch('/tasks')
  .then(response => response.json())
  .then(data => {
    // Добавляем индекс как уникальный идентификатор
    const tasksWithIndex = data.map((task, index) => ({
      ...task,
      uniqueIndex: index
    }));

    const taskByNumber = tasksWithIndex.find(task => task.numberTask === numberTask);

    if (!taskByNumber) {
      console.error('Данные для указанного номера задания не найдены.');
      window.location.href = "/error"; // Перенаправляем на страницу ошибки
      return;
    }

    const idTask = taskByNumber.idTask;

    // Фильтруем данные по idTask
    const filteredData = tasksWithIndex.filter(task => task.idTask === idTask);

    if (filteredData.length > 0) {
      updateHeader(filteredData[0]);
      renderTable(filteredData);
    } else {
      console.error('Данные для указанного idTask не найдены.');
      window.location.href = "/error"; // Перенаправляем на страницу ошибки
    }
  })
  .catch(error => console.error('Ошибка загрузки JSON:', error));

// Обновление шапки страницы
function updateHeader(task) {
  document.title = `ССЗ № ${task.numberTask}`;
  document.getElementById("headerNumberTask").textContent = task.numberTask || "—";
  document.getElementById("headerWorker").textContent = task.workerName || "—";
  document.getElementById("headerDateIssue").textContent = task.dateIssue
    ? new Date(task.dateIssue).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')
    : "—";
  document.getElementById("headerDateAccept").textContent = task.dateAccept
    ? new Date(task.dateAccept).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')
    : "—";
}

// Функция для определения уникального идентификатора
function determineUniqueIdentifier(data) {
  const columns = ["numberSP", "nameSP", "typeSizeSP", "numberOperation", "nameOperation"];
  for (const column of columns) {
    const uniqueValues = new Set(data.map(task => task[column]));
    if (uniqueValues.size === data.length) {
      return column; // Возвращаем первый столбец, где значения уникальны
    }
  }
  return null; // Если уникальный столбец не найден
}

// Отображение данных в таблице с объединением ячеек
function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody");
  tableBody.innerHTML = "";

  let previousNumberSP = null;
  let previousNameSP = null;
  let rowspanCount = 0;
  let rowsToMerge = [];

  data.forEach((task, index) => {
    const isSameSP = task.numberSP === previousNumberSP && task.nameSP === previousNameSP;

    const row = document.createElement("tr");
    row.dataset.uniqueIndex = task.uniqueIndex; // Добавляем уникальный индекс как атрибут строки

    if (!isSameSP) {
      // Если номер СП и наименование изменились, создаём новые ячейки
      const numberSPCell = document.createElement("td");
      numberSPCell.textContent = task.numberSP || "";
      numberSPCell.rowSpan = 1; // Устанавливаем начальный rowspan
      numberSPCell.style.verticalAlign = "middle"; // Центрирование текста по вертикали
      numberSPCell.classList.add("number"); // Добавляем класс number
      row.appendChild(numberSPCell);

      const nameSPCell = document.createElement("td");
      nameSPCell.textContent = task.nameSP || "";
      nameSPCell.rowSpan = 1; // Устанавливаем начальный rowspan
      nameSPCell.style.verticalAlign = "middle"; // Центрирование текста по вертикали
      row.appendChild(nameSPCell);

      // Сохраняем текущие значения для сравнения
      previousNumberSP = task.numberSP;
      previousNameSP = task.nameSP;
      rowspanCount = 1;
      rowsToMerge = [numberSPCell, nameSPCell];
    } else {
      // Если номер СП и наименование совпадают, увеличиваем rowspan
      rowspanCount++;
      rowsToMerge.forEach(cell => {
        cell.rowSpan = rowspanCount; // Обновляем rowspan для всех объединяемых ячеек
      });
    }

    // Добавляем остальные ячейки строки
    const typeSizeSPCell = document.createElement("td");
    typeSizeSPCell.textContent = task.typeSizeSP || "";
    row.appendChild(typeSizeSPCell);

    const numberOperationCell = document.createElement("td");
    numberOperationCell.textContent = task.numberOperation || "";
    numberOperationCell.classList.add("number"); // Добавляем класс number
    row.appendChild(numberOperationCell);

    const nameOperationCell = document.createElement("td");
    nameOperationCell.textContent = task.nameOperation || "";
    row.appendChild(nameOperationCell);

    const countIssuedCell = document.createElement("td");
    countIssuedCell.textContent = task.countIssued || "";
    countIssuedCell.classList.add("number", "editable"); // Добавляем классы number и editable
    row.appendChild(countIssuedCell);

    const countAcceptedCell = document.createElement("td");
    countAcceptedCell.textContent = task.countAccepted || "";
    countAcceptedCell.classList.add("number", "editable"); // Добавляем классы number и editable
    row.appendChild(countAcceptedCell);

    const percentageCell = document.createElement("td");
    percentageCell.textContent = `${task.percentage || ""}%`;
    percentageCell.classList.add("number", "editable"); // Добавляем классы number и editable
    row.appendChild(percentageCell);

    // Добавляем строку в таблицу
    tableBody.appendChild(row);
  });

  console.log('Таблица успешно отрендерена.');
}

// Включение режима редактирования
document.getElementById("editValuesButton").addEventListener("click", () => {
  isEditingEnabled = true;

  const editableCells = document.querySelectorAll(".editable");
  editableCells.forEach(cell => {
    cell.contentEditable = "true";
    cell.style.backgroundColor = "#f9f9f9";
  });

  document.getElementById("editValuesButton").style.display = "none";
  document.getElementById("saveChangesButton").style.display = "inline-block";
});

// Сохранение изменений
document.getElementById("saveChangesButton").addEventListener("click", () => {
  const rows = document.querySelectorAll("#taskTable tbody tr");
  const updatedTasks = [];
  const changedRows = new Set(); // Храним индексы изменённых строк

  // Определяем уникальный идентификатор
  const uniqueIdentifierColumn = determineUniqueIdentifier(data);
  if (!uniqueIdentifierColumn) {
    alert("Не удалось определить уникальный идентификатор.");
    return;
  }

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const uniqueIdentifier = cells[Array.from(cells).findIndex(cell => cell.dataset.column === uniqueIdentifierColumn)]?.textContent.trim();

    // Собираем данные из таблицы
    const task = {
      uniqueIdentifier: uniqueIdentifier, // Уникальный идентификатор
      countIssued: parseInt(cells[5]?.textContent.trim(), 10) || 0, // Кол-во выдано
      countAccepted: parseInt(cells[6]?.textContent.trim(), 10) || 0, // Кол-во принято
      percentage: parseInt(cells[7]?.textContent.replace('%', '').trim(), 10) || 0, // Процент выполнения
    };

    // Проверяем, изменились ли значения
    const originalTask = data.find(t => t[uniqueIdentifierColumn] === uniqueIdentifier);
    if (
      originalTask &&
      (originalTask.countIssued !== task.countIssued ||
        originalTask.countAccepted !== task.countAccepted ||
        originalTask.percentage !== task.percentage)
    ) {
      updatedTasks.push(task);
      changedRows.add(uniqueIdentifier); // Добавляем идентификатор изменённой строки
    }
  });

  if (updatedTasks.length === 0) {
    alert("Нет изменений для сохранения.");
    return;
  }

  // Отправляем обновленные данные на сервер
  fetch('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updatedTasks, uniqueIdentifierColumn }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Ошибка при сохранении данных на сервере");
      }
      return response.json();
    })
    .then(data => {
      console.log("Изменения сохранены:", data);

      // Обновляем только изменённые строки
      rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const uniqueIdentifier = cells[Array.from(cells).findIndex(cell => cell.dataset.column === uniqueIdentifierColumn)]?.textContent.trim();
        if (changedRows.has(uniqueIdentifier)) {
          const updatedTask = updatedTasks.find(t => t.uniqueIdentifier === uniqueIdentifier);
          if (updatedTask) {
            cells[5].textContent = updatedTask.countIssued;
            cells[6].textContent = updatedTask.countAccepted;
            cells[7].textContent = `${updatedTask.percentage}%`;
          }
        }
      });

      // Отключаем режим редактирования
      const editableCells = document.querySelectorAll(".editable");
      editableCells.forEach(cell => {
        cell.contentEditable = "false";
        cell.style.backgroundColor = "";
      });

      document.getElementById("editValuesButton").style.display = "inline-block";
      document.getElementById("saveChangesButton").style.display = "none";
    })
    .catch(error => console.error("Ошибка сохранения:", error));
});

// Кнопка "Вернуться к списку"
document.getElementById("backToList").addEventListener("click", () => {
  history.back();
});
