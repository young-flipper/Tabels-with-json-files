// Получаем номер задания из параметров URL
const urlParams = new URLSearchParams(window.location.search); // Создаем объект для работы с параметрами URL
const numberTask = urlParams.get("numberTask"); // Извлекаем значение параметра "numberTask"

// Загружаем данные из JSON-файла
fetch('task.json') // Отправляем запрос на загрузку файла task.json
  .then(response => {
    if (!response.ok) { // Проверяем, успешен ли ответ
      throw new Error(`HTTP error! status: ${response.status}`); // Выбрасываем ошибку, если ответ не успешен
    }
    return response.json(); // Преобразуем ответ в JSON-объект
  })
  .then(data => {
    console.log('Данные успешно загружены:', data); // Логируем загруженные данные

    // Фильтруем данные по номеру задания
    const filteredData = data.filter(task => task.numberTask === numberTask); // Оставляем только те задачи, у которых номер совпадает с переданным

    if (filteredData.length > 0) { // Если найдены данные
      updateHeader(filteredData[0]); // Обновляем шапку страницы (используем первую запись)
      renderTable(filteredData); // Отображаем данные в таблице
    } else {
      console.error('Данные для указанного номера задания не найдены.'); // Логируем ошибку, если данные не найдены
    }
  })
  .catch(error => console.error('Ошибка загрузки JSON:', error)); // Обрабатываем ошибки загрузки

// Функция для обновления шапки страницы
function updateHeader(task) {
  document.getElementById("headerNumberTask").textContent = task.numberTask || "—"; // Обновляем номер задания
  document.getElementById("headerWorker").textContent = task.workerName || "—"; // Обновляем имя работника

  // Обновляем дату выдачи
  document.getElementById("headerDateIssue").textContent = task.dateIssue
    ? new Date(task.dateIssue).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') // Если дата существует, форматируем её
    : "—"; // Если даты нет, отображаем "—"

  // Обновляем дату принятия
  document.getElementById("headerDateAccept").textContent = task.dateAccept
    ? new Date(task.dateAccept).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') // Если дата существует, форматируем её
    : "—"; // Если даты нет, отображаем "—"
}

// Функция для отображения данных в таблице
function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody"); // Находим тело таблицы по id
  if (!tableBody) { // Если таблица не найдена
    console.error('Таблица с id="taskTable" не найдена в HTML. Проверьте разметку.'); // Выводим ошибку
    return; // Прекращаем выполнение функции
  }
  tableBody.innerHTML = ""; // Очищаем содержимое таблицы перед добавлением новых данных

  data.forEach(task => { // Перебираем массив данных
    const row = `
      <tr>
        <td class="number">${task.numberSP || ""}</td> <!-- Номер СП -->
        <td>${task.nameSP || ""}</td> <!-- Название спецификации -->
        <td>${task.typeSizeSP || ""}</td> <!-- Типоразмер -->
        <td class="number">${task.numberOperation || ""}</td> <!-- Номер операции -->
        <td>${task.nameOperation || ""}</td> <!-- Название операции -->
        <td class="number">${task.countIssued || ""}</td> <!-- Количество выданных единиц -->
        <td class="number">${task.countAccepted || ""}</td> <!-- Количество принятых единиц -->
        <td class="number">${task.percentage || ""}%</td> <!-- Процент выполнения -->
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", row); // Добавляем строку в конец таблицы
  });

  console.log('Таблица успешно отрендерена.'); // Логируем успешное завершение рендера
}
