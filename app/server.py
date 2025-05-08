from flask import Flask, request, jsonify, render_template, send_from_directory
import json
import os

# Создаем приложение Flask
app = Flask(
    __name__,
    static_folder='static',  # Папка для статических файлов
    template_folder='templates'  # Папка для HTML-шаблонов
)

# Путь к файлам JSON
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Текущая директория
DATA_FOLDER = os.path.join(BASE_DIR, 'data')  # Папка с данными
TASK_FILE = os.path.join(DATA_FOLDER, 'task.json')  # Путь к task.json
LIST_TASK_FILE = os.path.join(DATA_FOLDER, 'listTask.json')  # Путь к listTask.json

# Маршрут для отображения HTML-файла table.html
@app.route('/')
def index():
    return render_template('table.html')

# Маршрут для отображения HTML-файла table2.html
@app.route('/table2')
def table2():
    number_task = request.args.get('numberTask')  # Получаем параметр numberTask из URL
    return render_template('table2.html', numberTask=number_task)

# Маршрут для получения данных из task.json
@app.route('/tasks', methods=['GET'])
def get_tasks():
    try:
        with open(TASK_FILE, 'r', encoding='utf-8') as file:
            tasks = json.load(file)
        return jsonify(tasks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Маршрут для сохранения изменений в task.json
@app.route('/tasks', methods=['POST'])
def save_tasks():
    try:
        # Получаем данные из запроса
        request_data = request.get_json()
        updated_tasks = request_data.get("updatedTasks", [])
        unique_identifier_column = request_data.get("uniqueIdentifierColumn")

        if not unique_identifier_column:
            return jsonify({'error': 'Уникальный идентификатор не указан'}), 400

        # Загружаем текущие данные из task.json
        with open(TASK_FILE, 'r', encoding='utf-8') as file:
            current_tasks = json.load(file)

        # Обновляем данные
        for updated_task in updated_tasks:
            unique_identifier = updated_task.get("uniqueIdentifier")
            for task in current_tasks:
                if task[unique_identifier_column] == unique_identifier:
                    # Принудительно обновляем все три значения
                    task["countIssued"] = updated_task.get("countIssued", task["countIssued"])
                    task["countAccepted"] = updated_task.get("countAccepted", task["countAccepted"])
                    task["percentage"] = updated_task.get("percentage", task["percentage"])

        # Сохраняем обновленные данные в файл task.json
        with open(TASK_FILE, 'w', encoding='utf-8') as file:
            json.dump(current_tasks, file, ensure_ascii=False, indent=4)

        return jsonify({'message': 'Данные успешно сохранены'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Маршрут для получения данных из listTask.json
@app.route('/data/listTask.json', methods=['GET'])
def get_list_tasks():
    try:
        with open(LIST_TASK_FILE, 'r', encoding='utf-8') as file:
            list_tasks = json.load(file)
        return jsonify(list_tasks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Маршрут для отображения страницы ошибки
@app.route('/error')
def error_page():
    return render_template('error.html')

# Маршрут для статических файлов (CSS, JS, изображения)
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# Запуск сервера
if __name__ == '__main__':
    app.run(debug=True, port=5000)
