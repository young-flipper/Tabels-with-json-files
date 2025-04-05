// Загружаем данные из JSON-файла
fetch('listTask.json') // Убедитесь, что путь к файлу указан правильно
  .then(response => {
    if (!response.ok) { // Проверяем, успешно ли выполнен запрос
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json(); // Преобразуем ответ в JSON
  })
  .then(data => {
    console.log('Данные успешно загружены:', data); // Отладка: выводим загруженные данные
    const tableData = data; // Сохраняем данные из JSON в переменную
    renderTable(tableData); // Отображаем данные в таблице
    setupFilters(tableData); // Настраиваем фильтры для таблицы
  })
  .catch(error => console.error('Ошибка загрузки JSON:', error)); // Обрабатываем ошибки загрузки JSON

// Функция для отображения данных в таблице
function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody"); // Находим тело таблицы
  if (!tableBody) {
    console.error('Таблица с id="taskTable" не найдена в HTML. Проверьте разметку.');
    return;
  }
  tableBody.innerHTML = ""; // Очищаем таблицу перед добавлением новых данных
  data.forEach(task => { // Перебираем каждый объект задачи из данных
    const row = `
      <tr>
        <td>${task.numberTask}</td> <!-- Отображаем номер задачи -->
        <td>${task.departTask}</td> <!-- Отображаем отдел -->
        <td>${task.masterName}</td> <!-- Отображаем имя мастера -->
        <td>${task.workerName}</td> <!-- Отображаем имя работника -->
        <td>${new Date(task.dateIssue).toLocaleString()}</td> <!-- Отображаем дату выдачи задачи -->
        <td>${task.dateAccept ? new Date(task.dateAccept).toLocaleString() : "—"}</td> <!-- Отображаем дату принятия задачи или "—", если её нет -->
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", row); // Добавляем строку в таблицу
  });
  console.log('Таблица успешно отрендерена.'); // Отладка: подтверждаем успешное отображение данных
}

// Функция для настройки фильтров
function setupFilters(data) {
  const globalSearch = document.getElementById("globalSearch"); // Находим поле глобального поиска
  const columnFilters = document.querySelectorAll(".column-filter"); // Находим все фильтры для отдельных столбцов

  if (!globalSearch) {
    console.error('Поле глобального поиска с id="globalSearch" не найдено. Проверьте разметку.');
    return;
  }

  // Фильтрация по всем полям
  globalSearch.addEventListener("input", () => { // Добавляем обработчик события ввода для глобального поиска
    const searchValue = globalSearch.value; // Получаем текущее значение, введенное пользователем в поле глобального поиска
    const filteredData = data.filter(task => { // Фильтруем данные
      return Object.values(task).some(value => // Проверяем, содержит ли хотя бы одно поле введённое значение
        String(value).toLowerCase().includes(searchValue)
      );
    });
    renderTable(filteredData); // Отображаем отфильтрованные данные
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
