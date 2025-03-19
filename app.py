from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import cups
import os
from datetime import datetime
import random

app = Flask(__name__, static_folder='frontend', static_url_path='/')
CORS(app)

BASE_UPLOAD_FOLDER = '/tmp/printer-service'

@app.route('/api/check', methods=['GET'])
def check_printer_status():
    try:
        conn = cups.Connection()
        printers = conn.getPrinters()
        active_printers = [
            {
                "name": name,
                "status": info.get("printer-state-message", "Unknown"),
                "is_default": info.get("printer-is-default", False)
            }
            for name, info in printers.items()
            if info.get("printer-state") in [3, 4]
        ]
        if not active_printers:
            return jsonify({"status": "not found"})
        return jsonify({"status": "connected", "details": active_printers})
    except cups.IPPError as e:
        return jsonify({"status": "error", "message": f"CUPS 连接错误: {e}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/upload', methods=['POST'])
def upload_files():
    try:
        if 'files' not in request.files:
            return jsonify({"status": "error", "message": "没有文件部分"}), 400
        files = request.files.getlist('files')
        if not files or files[0].filename == '':
            return jsonify({"status": "error", "message": "没有选择文件"}), 400

        current_time = datetime.now().strftime("%Y-%m-%d-%H-%M")
        random_num = str(random.randint(1000, 9999))
        subfolder_name = f"{current_time}--{random_num}"
        upload_folder = os.path.join(BASE_UPLOAD_FOLDER, subfolder_name)

        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        uploaded_files = []
        for file in files:
            if file and file.filename:
                filename = file.filename
                file_path = os.path.join(upload_folder, filename)
                file.save(file_path)
                uploaded_files.append({"filename": filename, "path": file_path})

        return jsonify({
            "status": "success",
            "subfolder": subfolder_name,
            "number": len(uploaded_files),
            "files": uploaded_files
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/subfolders', methods=['GET'])
def get_subfolders():
    try:
        if not os.path.exists(BASE_UPLOAD_FOLDER):
            return jsonify({"status": "success", "subfolders": [], "message": "Base folder does not exist"})

        subfolders = [f for f in os.listdir(BASE_UPLOAD_FOLDER) if os.path.isdir(os.path.join(BASE_UPLOAD_FOLDER, f))]
        subfolders.sort()
        return jsonify({"status": "success", "subfolders": subfolders, "count": len(subfolders)})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/subfiles', methods=['GET'])
def get_subfiles():
    try:
        subfolder = request.args.get('subfolder')
        if not subfolder:
            return jsonify({"status": "error", "message": "缺少 subfolder 参数"}), 400

        folder_path = os.path.join(BASE_UPLOAD_FOLDER, subfolder)
        if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
            return jsonify({"status": "error", "message": "子文件夹不存在"}), 404

        files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
        return jsonify({"status": "success", "subfolder": subfolder, "files": files, "count": len(files)})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# 让 Flask 直接托管前端
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=632, debug=False)