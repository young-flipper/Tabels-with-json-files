let globalData = [];
let filteredData = [];
let initialPage = 1;

async function loadData() {
  try {
    // 1. Загрузка данных из listTask.json
    const response = await fetch('../html/listTask.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const jsonData = await response.json();

    // 2. Загрузка локальных данных
    const localData = JSON.parse(localStorage.getItem('tasks')) || [];

    // 3. Объединение данных (новые задания сверху)
    globalData = [...localData, ...jsonData];
    filteredData = [...globalData];

    // 4. Инициализация интерфейса
    setupPagination(filteredData);
    setupFilters();

  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    if (error.message.includes('404')) {
      window.location.href = "../html/error.html";
    }
  }
}

function renderTable(data) {
  const tableBody = document.querySelector("#taskTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  // Получаем список пользовательских заданий
  const localTasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const userTaskNumbers = localTasks.map(task => task.numberTask);

  data.forEach(task => {
    const isUserTask = userTaskNumbers.includes(task.numberTask);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="number">${task.numberTask || ""}</td>
      <td class="number">${task.departTask || ""}</td>
      <td>${task.masterName || ""}</td>
      <td>${formatWorkerName(task.workerName || "")}</td>
      <td class="number">${task.dateIssue ? new Date(task.dateIssue).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : ""}</td>
      <td class="number">${task.dateAccept ? new Date(task.dateAccept).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : ""}</td>
    `;

    // Добавляем data-атрибут для идентификации пользовательских заданий
    if (isUserTask) {
      row.dataset.userTask = "true";
    }

    row.addEventListener("click", () => {
      window.location.href = `table2.html?numberTask=${task.numberTask}`;
    });

    tableBody.appendChild(row);
  });
}

function formatWorkerName(workerName) {
  const parts = workerName.split(" ");
  return parts.length === 3
    ? `${parts[0]} ${parts[1]}<br>${parts[2]}`
    : workerName;
}

function setupFilters() {
  const globalSearch = document.getElementById("globalSearch");
  const columnFilters = document.querySelectorAll(".column-filter");

  const applyFilters = () => {
    const searchValue = globalSearch.value.toLowerCase();
    const filters = Array.from(columnFilters).reduce((acc, input) => {
      if (input.value) acc[input.dataset.column] = input.value.toLowerCase();
      return acc;
    }, {});

    filteredData = globalData.filter(task => {
      // Проверка только по видимым полям таблицы
      const visibleFields = [
        String(task.numberTask || ""),
        String(task.departTask || ""),
        String(task.masterName || ""),
        String(task.workerName || ""),
        task.dateIssue ? new Date(task.dateIssue).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : "",
        task.dateAccept ? new Date(task.dateAccept).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : ""
      ].map(field => field.toLowerCase());

      // Глобальный поиск только по видимым полям
      const globalMatch = searchValue === '' ||
                         visibleFields.some(field => field.includes(searchValue));

      // Проверка фильтров по колонкам
      const columnMatch = Object.keys(filters).every(column => {
        const value = task[column];
        if (!value) return false;

        if (column.includes("date")) {
          const formattedDate = new Date(value).toLocaleString('ru-RU', {
            dateStyle: 'short',
            timeStyle: 'short'
          }).replace(',', '').toLowerCase();
          return formattedDate.includes(filters[column]);
        }
        return String(value).toLowerCase().includes(filters[column]);
      });

      return globalMatch && columnMatch;
    });

    // Очищаем таблицу если нет совпадений
    if (filteredData.length === 0) {
      document.querySelector("#taskTable tbody").innerHTML = "";
    }

    setupPagination(filteredData);
  };

  globalSearch.addEventListener("input", applyFilters);
  columnFilters.forEach(filter => filter.addEventListener("input", applyFilters));
}

function setupPagination(data, forcePage = null) {
  const rowsPerPage = 20;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginationContainer = document.getElementById("pagination");

  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";

  if (data.length === 0) {
    return;
  }

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

// Инициализация
window.onload = () => {
  loadData();
};
