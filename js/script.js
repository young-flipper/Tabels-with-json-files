// Загружаем данные из JSON-файла
fetch('listTask.json') // Отправляем запрос на загрузку файла listTask.json
  .then(response => {
    if (!response.ok) { // Проверяем, успешен ли ответ
      // Если файл не найден, перенаправляем на страницу ошибки
      if (response.status === 404) { // Если статус ответа 404 (файл не найден)
        window.location.href = "../html/error.html"; // Перенаправляем пользователя на страницу ошибки
      }
      throw new Error(`HTTP error! status: ${response.status}`); // Выбрасываем ошибку для других статусов
    }
    return response.json(); // Преобразуем ответ в JSON-объект
  })
  .then(data => {
    console.log('Данные успешно загружены:', data); // Логируем загруженные данные
    const tableData = data; // Сохраняем данные в переменную
    setupPagination(tableData); // Настраиваем пагинацию для данных
    setupFilters(tableData); // Настраиваем фильтры для данных
  })
  .catch(error => console.error('Ошибка загрузки JSON:', error)); // Обрабатываем ошибки загрузки

// Функция для отображения данных в таблице
function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody"); // Находим тело таблицы по id
  if (!tableBody) { // Если таблица не найдена
    console.error('Таблица с id="taskTable" не найдена в HTML. Проверьте разметку.'); // Выводим ошибку
    return; // Прекращаем выполнение функции
  }
  tableBody.innerHTML = ""; // Очищаем содержимое таблицы перед добавлением новых данных

  data.forEach(task => { // Перебираем массив данных
    const row = document.createElement("tr"); // Создаем строку таблицы
    row.innerHTML = `
      <td class="number">${task.numberTask || ""}</td> <!-- Номер задания -->
      <td class="number">${task.departTask || ""}</td> <!-- Отдел -->
      <td>${task.masterName || ""}</td> <!-- Имя мастера -->
      <td>${task.workerName || ""}</td> <!-- Имя работника -->
      <td class="number">${task.dateIssue ? new Date(task.dateIssue).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : ""}</td> <!-- Дата выдачи -->
      <td class="number">${task.dateAccept ? new Date(task.dateAccept).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : ""}</td> <!-- Дата принятия -->
    `;

    // Добавляем обработчик клика на строку
    row.addEventListener("click", () => {
      // Переход на table2.html с передачей номера задания через параметры URL
      window.location.href = `table2.html?numberTask=${task.numberTask}`;
    });

    tableBody.appendChild(row); // Добавляем строку в таблицу
  });

  console.log('Таблица успешно отрендерена.'); // Логируем успешное завершение рендера
}

// Функция для настройки фильтров
function setupFilters(data) {
  const globalSearch = document.getElementById("globalSearch"); // Находим поле глобального поиска
  const columnFilters = document.querySelectorAll(".column-filter"); // Находим фильтры для столбцов

  if (!globalSearch) { // Если поле глобального поиска не найдено
    console.error('Поле глобального поиска с id="globalSearch" не найдено. Проверьте разметку.'); // Выводим ошибку
    return; // Прекращаем выполнение функции
  }

  // Глобальный поиск
  globalSearch.addEventListener("input", () => { // Отслеживаем ввод в поле глобального поиска
    const searchValue = globalSearch.value.toLowerCase(); // Приводим введенное значение к нижнему регистру
    const filteredData = data.filter(task => { // Фильтруем данные
      return Object.entries(task).some(([key, value]) => { // Проверяем каждое поле объекта
        if (key === "dateIssue" || key === "dateAccept") { // Если поле (ключ) — это "dateIssue" или "dateAccept"
          // Преобразуем дату в локализованный формат
          const formattedDate = value
            ? new Date(value).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')
            : "";
          return formattedDate.includes(searchValue); // Проверяем, содержит ли дата введенное значение
        }
        return String(value || "").toLowerCase().includes(searchValue); // Проверяем остальные поля
      });
    });
    setupPagination(filteredData); // Обновляем пагинацию для отфильтрованных данных
  });

  // Фильтрация по столбцам
  columnFilters.forEach(filter => { // Для каждого фильтра столбца
    filter.addEventListener("input", () => { // Отслеживаем ввод
      const filters = Array.from(columnFilters).reduce((acc, input) => { // Собираем значения всех фильтров
        if (input.value) { // Если значение фильтра не пустое
          acc[input.dataset.column] = input.value.toLowerCase(); // Сохраняем значение фильтра в объекте
        }
        return acc; // Возвращаем объект фильтров
      }, {});

      const filteredData = data.filter(task => { // Фильтруем данные
        return Object.keys(filters).every(column => { // Проверяем, соответствует ли каждая запись всем фильтрам
          const value = task[column]; // Получаем значение текущего столбца
          if (column === "dateIssue" || column === "dateAccept") { // Если столбец — это дата
            // Преобразуем дату в строку для сравнения
            const formattedDate = value
              ? new Date(value).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')
              : "";
            return formattedDate.includes(filters[column]); // Проверяем, содержит ли дата введенное значение
          }
          return String(value || "").toLowerCase().includes(filters[column]); // Проверяем остальные поля
        });
      });

      setupPagination(filteredData); // Обновляем пагинацию для отфильтрованных данных
    });
  });
}

// Функция для настройки пагинации
function setupPagination(data) {
  const rowsPerPage = 20; // Устанавливаем количество строк на странице
  const totalPages = Math.ceil(data.length / rowsPerPage); // Вычисляем общее количество страниц
  const paginationContainer = document.getElementById("pagination"); // Находим контейнер для пагинации

  if (!paginationContainer) { // Если контейнер для пагинации не найден
    console.error('Контейнер для пагинации с id="pagination" не найден. Проверьте разметку.'); // Выводим ошибку
    return; // Прекращаем выполнение функции
  }

  paginationContainer.innerHTML = ""; // Очищаем содержимое контейнера пагинации

  function renderPage(page) { // Функция для рендеринга страницы
    const start = (page - 1) * rowsPerPage; // Вычисляем индекс начала
    const end = start + rowsPerPage; // Вычисляем индекс конца
    renderTable(data.slice(start, end)); // Рендерим таблицу с данными текущей страницы
  }

  function createButton(label, page, isArrow = false) { // Функция для создания кнопки пагинации
    const button = document.createElement("button"); // Создаем кнопку
    button.textContent = label; // Устанавливаем текст кнопки
    button.classList.add("pagination-btn"); // Добавляем класс для стилей
    if (isArrow) button.classList.add("arrow-btn"); // Если это стрелка, добавляем соответствующий класс
    button.addEventListener("click", () => { // Добавляем обработчик клика
      renderPage(page); // Рендерим страницу при клике
      updatePagination(page); // Обновляем пагинацию
    });
    return button; // Возвращаем созданную кнопку
  }

  function updatePagination(currentPage) { // Функция для обновления отображения пагинации
    paginationContainer.innerHTML = ""; // Очищаем содержимое контейнера пагинации

    if (currentPage > 1) { // Если текущая страница больше первой
      paginationContainer.appendChild(createButton("«", currentPage - 1, true)); // Добавляем кнопку "Назад"
    }

    const firstButton = createButton("1", 1); // Создаем кнопку для первой страницы
    if (currentPage === 1) firstButton.classList.add("active"); // Если это первая страница, добавляем активный класс
    paginationContainer.appendChild(firstButton); // Добавляем кнопку первой страницы

    if (currentPage > 3) { // Если текущая страница больше третьей
      const dots = document.createElement("span"); // Создаем элемент для многоточия
      dots.textContent = "..."; // Устанавливаем текст многоточия
      dots.classList.add("dots"); // Добавляем класс для стилей
      paginationContainer.appendChild(dots); // Добавляем многоточие в контейнер
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) { // Создаем кнопки для соседних страниц
      const button = createButton(i, i); // Создаем кнопку для текущей страницы
      if (i === currentPage) button.classList.add("active"); // Если это текущая страница, добавляем активный класс
      paginationContainer.appendChild(button); // Добавляем кнопку в контейнер
    }

    if (currentPage < totalPages - 2) { // Если текущая страница меньше, чем за две страницы до последней
      const dots = document.createElement("span"); // Создаем элемент для многоточия
      dots.textContent = "..."; // Устанавливаем текст многоточия
      dots.classList.add("dots"); // Добавляем класс для стилей
      paginationContainer.appendChild(dots); // Добавляем многоточие в контейнер
    }

    const lastButton = createButton(totalPages, totalPages); // Создаем кнопку для последней страницы
    if (currentPage === totalPages) lastButton.classList.add("active"); // Если это последняя страница, добавляем активный класс
    paginationContainer.appendChild(lastButton); // Добавляем кнопку последней страницы

    if (currentPage < totalPages) { // Если текущая страница меньше последней
      paginationContainer.appendChild(createButton("»", currentPage + 1, true)); // Добавляем кнопку "Вперед"
    }

    localStorage.setItem("currentPage", currentPage); // Сохраняем текущую страницу в localStorage
  }

  const currentPage = parseInt(localStorage.getItem("currentPage")) || 1; // Получаем текущую страницу из localStorage или устанавливаем 1
  updatePagination(currentPage); // Обновляем отображение пагинации
  renderPage(currentPage); // Рендерим текущую страницу
}
