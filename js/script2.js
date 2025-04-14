// Получаем номер задания из параметров URL
const urlParams = new URLSearchParams(window.location.search); // Создаем объект URLSearchParams для работы с параметрами URL
const numberTask = urlParams.get("numberTask"); // Извлекаем значение параметра "numberTask"

// Загружаем данные из JSON-файла
fetch('task.json') // Выполняем запрос к файлу task.json
  .then(response => {
    if (!response.ok) { // Проверяем, успешен ли ответ
      throw new Error(`HTTP error! status: ${response.status}`); // Если нет, выбрасываем ошибку с кодом статуса
    }
    return response.json(); // Преобразуем ответ в JSON
  })
  .then(data => { // Обрабатываем полученные данные
    console.log('Данные успешно загружены:', data); // Выводим данные в консоль

    // Фильтруем данные по номеру задания
    const filteredData = data.filter(task => task.numberTask === numberTask); // Фильтруем задачи по номеру

    if (filteredData.length > 0) { // Если найдены подходящие задачи
      updateHeader(filteredData[0]); // Обновляем шапку страницы с данными первой задачи
      renderTable(filteredData); // Отображаем данные в таблице
    } else {
      console.error('Данные для указанного номера задания не найдены.'); // Если ничего не найдено, выводим ошибку
    }
  })
  .catch(error => console.error('Ошибка загрузки JSON:', error)); // Обрабатываем ошибки при загрузке

// Функция для обновления шапки страницы
function updateHeader(task) {
  document.title = `№ ${task.numberTask}`; // Устанавливаем заголовок страницы
  document.getElementById("headerNumberTask").textContent = task.numberTask || "—"; // Обновляем номер задания
  document.getElementById("headerWorker").textContent = task.workerName || "—"; // Обновляем имя работника
  document.getElementById("headerDateIssue").textContent = task.dateIssue
    ? new Date(task.dateIssue).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') // Форматируем дату выдачи
    : "—"; // Если даты нет, выводим "—"
  document.getElementById("headerDateAccept").textContent = task.dateAccept
    ? new Date(task.dateAccept).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') // Форматируем дату принятия
    : "—"; // Если даты нет, выводим "—"
}

// Функция для отображения данных в таблице
function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody"); // Находим тело таблицы по селектору
  if (!tableBody) { // Проверяем, существует ли элемент
    console.error('Таблица с id="taskTable" не найдена в HTML. Проверьте разметку.'); // Если нет, выводим ошибку
    return; // Выходим из функции
  }
  tableBody.innerHTML = ""; // Очищаем содержимое таблицы

  data.forEach(task => { // Для каждой задачи в отфильтрованных данных
    const row = `
      <tr>
        <td class="number">${task.numberSP || ""}</td> <!-- Номер СП -->
        <td>${task.nameSP || ""}</td> <!-- Наименование СП -->
        <td>${task.typeSizeSP || ""}</td> <!-- Типоразмер -->
        <td class="number">${task.numberOperation || ""}</td><!-- Номер операции -->
        <td>${task.nameOperation || ""}</td> <!-- Наименование операции -->
        <td class="number">${task.countIssued || ""}</td> <!-- Количество выданных единиц -->
        <td class="number">${task.countAccepted || ""}</td> <!-- Количество принятых единиц -->
        <td class="number">${task.percentage || ""}%</td> <!-- Процент выполнения -->
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", row); // Добавляем строку в таблицу
  });

  console.log('Таблица успешно отрендерена.'); // Выводим сообщение об успешном рендеринге таблицы
}

// Обработка кнопки возврата
document.getElementById("backToList").addEventListener("click", () => { // Добавляем обработчик события на кнопку возврата
  // Используем встроенный механизм перехода назад
  history.back(); // Возвращаемся на предыдущую страницу в истории
});
