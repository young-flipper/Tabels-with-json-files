// Загружаем данные из JSON-файла
fetch('task.json') // Отправляем запрос на загрузку JSON-файла
  .then(response => {
    if (!response.ok) { // Проверяем, успешен ли ответ
      throw new Error(`HTTP error! status: ${response.status}`); // Если нет, выбрасываем ошибку
    }
    return response.json(); // Преобразуем ответ в JSON-объект
  })
  .then(data => {
    console.log('Данные успешно загружены:', data); // Логируем загруженные данные
    const tableData = data; // Сохраняем данные в переменную
    renderTable(tableData); // Отображаем данные в таблице
    setupFilters(tableData); // Настраиваем фильтры для таблицы
  })
  .catch(error => console.error('Ошибка загрузки JSON:', error)); // Обрабатываем ошибки загрузки

// Функция для отображения данных в таблице
function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody"); // Находим <tbody> таблицы с id="taskTable"
  if (!tableBody) { // Если таблица не найдена
    console.error('Таблица с id="taskTable" не найдена в HTML. Проверьте разметку.'); // Выводим ошибку
    return; // Прекращаем выполнение функции
  }
  tableBody.innerHTML = ""; // Очищаем содержимое таблицы перед добавлением новых данных
  data.forEach(task => { // Перебираем массив данных
    const row = `
      <tr>
        <td>${task.numberTask}</td> <!-- Номер задачи -->
        <td>${task.workerName}</td> <!-- Имя работника -->
        <td>${new Date(task.dateIssue).toLocaleString()}</td> <!-- Дата выдачи задачи -->
        <td>${task.dateAccept ? new Date(task.dateAccept).toLocaleString() : "—"}</td> <!-- Дата принятия задачи (если есть) -->
        <td>${task.numberSP}</td> <!-- Номер СП -->
        <td>${task.designSP}</td> <!-- Дизайн СП -->
        <td>${task.nameSP}</td> <!-- Название СП -->
        <td>${task.typeSizeSP}</td> <!-- Тип/размер СП -->
        <td>${task.numberOperation}</td> <!-- Номер операции -->
        <td>${task.nameOperation}</td> <!-- Название операции -->
        <td>${task.countIssued}</td> <!-- Количество выдано -->
        <td>${task.countAccepted}</td> <!-- Количество принято -->
        <td>${task.percentage}%</td> <!-- Процент выполнения -->
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", row); // Добавляем строку в таблицу
  });
}

// Функция для настройки фильтров
function setupFilters(data) {
  const globalSearch = document.getElementById("globalSearch"); // Находим поле глобального поиска
  const columnFilters = document.querySelectorAll(".column-filter"); // Находим все фильтры для отдельных столбцов

  if (!globalSearch) { // Если поле глобального поиска не найдено
    console.error('Поле глобального поиска с id="globalSearch" не найдено. Проверьте разметку.'); // Выводим ошибку
    return; // Прекращаем выполнение функции
  }

  // Фильтрация по всем полям (глобальный поиск)
  globalSearch.addEventListener("input", () => { // Добавляем обработчик события "input" для глобального поиска
    const searchValue = globalSearch.value; // Получаем текущее значение, введенное пользователем в поле глобального поиска
    const filteredData = data.filter(task => { // Фильтруем данные
      return Object.values(task).some(value => // Проверяем, содержится ли введенное значение в любом из полей объекта
        String(value).toLowerCase().includes(searchValue) // Приводим значение к строке и проверяем на вхождение
      );
    });
    renderTable(filteredData); // Отображаем отфильтрованные данные в таблице
  });

  // Фильтрация по отдельным столбцам
  columnFilters.forEach(filter => { // Перебираем все фильтры столбцов
    filter.addEventListener("input", () => { // Добавляем обработчик события "input" для каждого фильтра
      const filters = Array.from(columnFilters).reduce((acc, input) => { // Собираем значения всех фильтров
        if (input.value) { // Если в фильтре есть значение
          acc[input.dataset.column] = input.value; // Сохраняем значение фильтра без изменения регистра
        }
        return acc; // Возвращаем объект с фильтрами
      }, {});

      const filteredData = data.filter(task => { // Фильтруем данные
        return Object.keys(filters).every(column => { // Проверяем, соответствует ли каждая колонка фильтру
          return String(task[column]).includes(filters[column]); // Проверяем вхождение подстроки с учетом регистра
        });
      });

      renderTable(filteredData); // Отображаем отфильтрованные данные в таблице
    });
  });
}
