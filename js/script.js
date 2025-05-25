// Загружаем данные из JSON-файла
let globalData = [];
let filteredData = [];
let initialPage = 1;

fetch('listTask.json')
  .then(response => {
    if (!response.ok) {
      if (response.status === 404) {
        window.location.href = "../html/error.html";
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Данные успешно загружены:', data);
    globalData = data;
    filteredData = [...data];
    setupPagination(filteredData);
    setupFilters();
  })
  .catch(error => console.error('Ошибка загрузки JSON:', error));

// Функция для отображения данных в таблице
function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody");
  if (!tableBody) {
    console.error('Таблица с id="taskTable" не найдена в HTML. Проверьте разметку.');
    return;
  }
  tableBody.innerHTML = "";

  data.forEach(task => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="number">${task.numberTask || ""}</td>
      <td class="number">${task.departTask || ""}</td>
      <td>${task.masterName || ""}</td>
      <td>${formatWorkerName(task.workerName || "")}</td>
      <td class="number">${task.dateIssue ? new Date(task.dateIssue).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : ""}</td>
      <td class="number">${task.dateAccept ? new Date(task.dateAccept).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : ""}</td>
    `;

    row.addEventListener("click", () => {
      window.location.href = `table2.html?numberTask=${task.numberTask}`;
    });

    tableBody.appendChild(row);
  });

  console.log('Таблица успешно отрендерена.');
}

// Функция для форматирования имени работника
function formatWorkerName(workerName) {
  const parts = workerName.split(" ");
  if (parts.length === 3) {
    return `${parts[0]} ${parts[1]}<br>${parts[2]}`;
  }
  return workerName;
}

// Функция для настройки фильтров
function setupFilters() {
  const globalSearch = document.getElementById("globalSearch");
  const columnFilters = document.querySelectorAll(".column-filter");
  let filtersActive = false;

  const applyFilters = () => {
    const searchValue = globalSearch.value.toLowerCase();
    const filters = Array.from(columnFilters).reduce((acc, input) => {
      if (input.value) {
        acc[input.dataset.column] = input.value.toLowerCase();
      }
      return acc;
    }, {});

    // Сохраняем начальную страницу при первом изменении фильтра
    if (!filtersActive && (searchValue || Object.keys(filters).length > 0)) {
      initialPage = parseInt(localStorage.getItem("currentPage")) || 1;
      filtersActive = true;
    }

    filteredData = globalData.filter(task => {
      // Глобальный поиск
      const globalMatch = searchValue === '' || Object.entries(task).some(([key, value]) => {
        if (key === "dateIssue" || key === "dateAccept") {
          const formattedDate = value
            ? new Date(value).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')
            : "";
          return formattedDate.includes(searchValue);
        }
        return String(value || "").toLowerCase().includes(searchValue);
      });

      // Фильтрация по столбцам
      const columnMatch = Object.keys(filters).every(column => {
        const value = task[column];
        if (column === "dateIssue" || column === "dateAccept") {
          const formattedDate = value
            ? new Date(value).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')
            : "";
          return formattedDate.includes(filters[column]);
        }
        return String(value || "").toLowerCase().includes(filters[column]);
      });

      return globalMatch && columnMatch;
    });

    // Восстановление начальной страницы при сбросе фильтров
    if (!searchValue && Object.keys(filters).length === 0 && filtersActive) {
      setupPagination(filteredData, initialPage);
      filtersActive = false;
    } else {
      setupPagination(filteredData);
    }
  };

  globalSearch.addEventListener("input", applyFilters);
  columnFilters.forEach(filter => filter.addEventListener("input", applyFilters));
}

// Функция для настройки пагинации
function setupPagination(data, forcePage = null) {
  const rowsPerPage = 20;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginationContainer = document.getElementById("pagination");

  if (!paginationContainer) {
    console.error('Контейнер для пагинации с id="pagination" не найден. Проверьте разметку.');
    return;
  }

  paginationContainer.innerHTML = "";

  function renderPage(page) {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    renderTable(data.slice(start, end));
  }

  function createButton(label, page, isArrow = false) {
    const button = document.createElement("button");
    button.textContent = label;
    button.classList.add("pagination-btn");
    if (isArrow) button.classList.add("arrow-btn");
    button.addEventListener("click", () => {
      renderPage(page);
      updatePagination(page);
    });
    return button;
  }

  function updatePagination(currentPage) {
    paginationContainer.innerHTML = "";

    if (totalPages > 1) {
      if (currentPage > 1) {
        paginationContainer.appendChild(createButton("«", currentPage - 1, true));
      }
    }

    if (totalPages === 1) {
      const singleButton = createButton("1", 1);
      singleButton.classList.add("active");
      paginationContainer.appendChild(singleButton);
    } else {
      const firstButton = createButton("1", 1);
      if (currentPage === 1) firstButton.classList.add("active");
      paginationContainer.appendChild(firstButton);
    }

    if (totalPages > 1) {
      if (currentPage > 3) {
        const dots = document.createElement("span");
        dots.textContent = "...";
        dots.classList.add("dots");
        paginationContainer.appendChild(dots);
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        const button = createButton(i, i);
        if (i === currentPage) button.classList.add("active");
        paginationContainer.appendChild(button);
      }

      if (currentPage < totalPages - 2) {
        const dots = document.createElement("span");
        dots.textContent = "...";
        dots.classList.add("dots");
        paginationContainer.appendChild(dots);
      }

      const lastButton = createButton(totalPages, totalPages);
      if (currentPage === totalPages) lastButton.classList.add("active");
      paginationContainer.appendChild(lastButton);

      if (currentPage < totalPages) {
        paginationContainer.appendChild(createButton("»", currentPage + 1, true));
      }
    }

    localStorage.setItem("currentPage", currentPage);
  }

  const currentPage = forcePage !== null
    ? Math.min(forcePage, totalPages)
    : Math.min(parseInt(localStorage.getItem("currentPage")) || 1, totalPages);

  updatePagination(currentPage);
  renderPage(currentPage);
}
