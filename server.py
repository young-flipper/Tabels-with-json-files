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
DATA_FOLDER = os.path.join(os.path.dirname(__file__), 'data')
TASK_FILE = os.path.join(DATA_FOLDER, 'task.json')
LIST_TASK_FILE = os.path.join(DATA_FOLDER, 'listTask.json')

# Маршрут для отображения HTML-файла table.html
@app.route('/')
def index():
    return render_template('table.html')

# Маршрут для получения данных из task.json
@app.route('/tasks', methods=['GET'])
def get_tasks():
    try:
        with open(TASK_FILE, 'r', encoding='utf-8') as file:
            tasks = json.load(file)
        return jsonify(tasks)
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
