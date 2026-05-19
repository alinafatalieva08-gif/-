from flask import Flask, render_template, send_from_directory, jsonify
import json
import os

app = Flask(__name__,
    template_folder='templates',
    static_folder='static'
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data/<path:filename>')
def data(filename):
    # Безопасный путь к файлу
    data_dir = os.path.join(app.root_path, 'data')
    return send_from_directory(data_dir, filename)

@app.route('/api/cars')
def api_cars():
    cars_file = os.path.join(app.root_path, 'data', 'cars.json')
    with open(cars_file, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f))

if __name__ == '__main__':
    app.run(debug=True, port=8000)