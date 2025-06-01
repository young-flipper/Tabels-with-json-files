document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createForm');
  const taskNumberInput = document.getElementById('taskNumber');
  const departmentInput = document.getElementById('department');
  const masterInput = document.getElementById('master');
  const workerInput = document.getElementById('worker');

  // Маска для номера задания (с возможностью полного удаления)
  taskNumberInput.addEventListener('input', function(e) {
    // Если поле пустое, разрешаем это
    if (e.target.value === '') {
      return;
    }

    // Сохраняем позицию курсора
    const cursorPosition = e.target.selectionStart;

    // Обрабатываем ввод
    let value = e.target.value;
    let newValue = '';
    let hasChanges = false;

    // Если пользователь удаляет символы (Backspace или Delete)
    if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
      // Разрешаем удаление любых символов
      e.target.value = value;
      return;
    }

    // При обычном вводе применяем форматирование
    value = value.replace(/[^\d/]/g, '');
    let parts = value.split('/');

    // Обработка части до /
    let part1 = parts[0].replace(/\D/g, '');

    // Автоматически добавляем / после 4 цифр, если его нет
    if (part1.length >= 4 && !value.includes('/')) {
      part1 = part1.substring(0, 4);
      value = part1 + '/' + (parts[1] || '');
      parts = value.split('/');
    } else {
      part1 = part1.substring(0, 4);
    }

    let formatted = part1;

    // Обработка части после /
    if (parts.length > 1) {
      let part2 = parts[1].replace(/\D/g, '').substring(0, 3);
      formatted += `/${part2}`;

      // Обработка части после -
      if (part2.length === 3) {
        let part3 = parts[1].substring(3).replace(/\D/g, '').substring(0, 2);
        formatted += `-${part3}`;

        // Обработка финальной части (6 цифр)
        if (part3.length === 2) {
          let part4 = parts[1].substring(5).replace(/\D/g, '').substring(0, 6);
          formatted += ` ${part4}`;
        }
      }
    }

    e.target.value = formatted;

    // Восстанавливаем позицию курсора
    if (cursorPosition === value.length && hasChanges) {
      e.target.setSelectionRange(cursorPosition, cursorPosition);
    }
  });

  // Добавляем обработчик keydown для отслеживания Backspace
  taskNumberInput.addEventListener('keydown', function(e) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // Разрешаем стандартное поведение удаления
      return true;
    }
  });

  // Ограничение для цеха (только 3 цифры)
  departmentInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/[^\d]/g, '').substring(0, 3);
  });

  // Строгая маска для мастера (XXX-Фамилия-ИИ)
  masterInput.addEventListener('input', function(e) {
    let value = e.target.value;
    let formatted = '';
    let parts = value.split('-');

    // Часть 1: ровно 3 цифры
    if (parts[0]) {
      parts[0] = parts[0].replace(/\D/g, '').substring(0, 3);
      formatted = parts[0];
    }

    // Добавляем первый дефис только если есть 3 цифры
    if (formatted.length === 3 && parts.length > 1) {
      formatted += '-';

      // Часть 2: фамилия (только кириллица, первая заглавная)
      if (parts[1]) {
        parts[1] = parts[1].replace(/[^А-Яа-яЁё]/g, '');
        if (parts[1]) {
          parts[1] = parts[1][0].toUpperCase() + parts[1].slice(1).toLowerCase();
          formatted += parts[1];
        }

        // Добавляем второй дефис только если есть фамилия
        if (parts[1] && parts.length > 2) {
          formatted += '-';

          // Часть 3: инициалы (ровно 2 заглавные буквы)
          if (parts[2]) {
            parts[2] = parts[2].replace(/[^А-Яа-яЁё]/g, '').substring(0, 2).toUpperCase();
            formatted += parts[2];
          }
        }
      }
    }

    e.target.value = formatted.substring(0, 27);
    validateMasterField();
  });

  // Валидация поля мастера при потере фокуса
  masterInput.addEventListener('blur', function() {
    validateMasterField();
  });

  function validateMasterField() {
    const isValid = /^\d{3}-[А-ЯЁ][а-яё]+-[А-ЯЁ]{2}$/.test(masterInput.value);
    masterInput.style.borderColor = isValid ? '' : '#ff4444';
    return isValid;
  }

  // Обработчик для поля работника - только 3 слова (ФИО)
  workerInput.addEventListener('input', function(e) {
    // Разрешаем кириллические буквы и пробелы
    let value = e.target.value.replace(/[^А-Яа-яЁё\s]/g, '');

    // Удаляем лишние пробелы (более одного подряд)
    value = value.replace(/\s{2,}/g, ' ');

    // Делаем первую букву каждого слова заглавной
    value = value.replace(/(^|\s)([А-Яа-яЁё])/g, function(match, p1, p2) {
        return p1 + p2.toUpperCase();
    });

    // Ограничиваем количество слов до 3 и обрезаем пробелы в конце
    const words = value.trim().split(/\s+/);
    if (words.length > 3) {
        value = words.slice(0, 3).join(' ');
    } else {
        // Удаляем пробел, если он в конце и уже есть 3 слова
        if (words.length === 3 && value.endsWith(' ')) {
            value = value.trim();
        }
    }

    e.target.value = value;
  });

  // Отправка формы
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Дополнительная валидация поля мастера
    if (!validateMasterField()) {
      masterInput.focus();
      return;
    }

    // Валидация всех полей
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Создание объекта задачи
    const newTask = {
      numberTask: taskNumberInput.value,
      departTask: departmentInput.value,
      masterName: masterInput.value,
      workerName: workerInput.value,
      dateIssue: new Date().toISOString(),
      dateAccept: new Date().toISOString()
    };

    // Сохранение в localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.unshift(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    window.location.href = 'table.html';
  });
});
