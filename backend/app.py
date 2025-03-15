from flask import Flask, jsonify, request
from flask_cors import CORS
import cups
import os
from datetime import datetime
import random

app = Flask(__name__)
CORS(app)

# 设置基础上传目录
BASE_UPLOAD_FOLDER = '/tmp/printer-service'

@app.route('/check', methods=['GET'])
def check_printer_status():
    try:
        # 连接到 CUPS
        conn = cups.Connection()
        
        # 获取所有打印机信息
        printers = conn.getPrinters()

        # 过滤掉状态为 "stopped" (5) 的打印机
        active_printers = [
            {
                "name": name,
                "status": info.get("printer-state-message", "Unknown"),
                "is_default": info.get("printer-is-default", False)
            }
            for name, info in printers.items()
            if info.get("printer-state") in [3, 4]  # 仅保留空闲(3) 和打印中(4) 的设备
        ]

        if not active_printers:
            return jsonify({"status": "not found"})  # 没有可用的打印机

        return jsonify({"status": "connected", "details": active_printers})

    except cups.IPPError as e:
        return jsonify({"status": "error", "message": f"CUPS 连接错误: {e}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        # 检查是否有文件在请求中
        if 'files' not in request.files:
            return jsonify({"status": "error", "message": "没有文件部分"}), 400
        
        files = request.files.getlist('files')  # 获取多个文件
        
        if not files or files[0].filename == '':
            return jsonify({"status": "error", "messageshop": "没有选择文件"}), 400

        # 生成子目录名：当前时间 + 4位随机数
        current_time = datetime.now().strftime("%Y-%m-%d-%H-%M")
        random_num = str(random.randint(1000, 9999))
        subfolder_name = f"{current_time}--{random_num}"
        upload_folder = os.path.join(BASE_UPLOAD_FOLDER, subfolder_name)

        # 创建子目录（如果不存在）
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        uploaded_files = []
        for file in files:
            if file and file.filename:
                # 使用原文件名
                filename = file.filename
                file_path = os.path.join(upload_folder, filename)
                
                # 保存文件
                file.save(file_path)
                
                uploaded_files.append({
                    "filename": filename,
                    "path": file_path
                })

        return jsonify({
            "status": "success",
            "subfolder": subfolder_name,
            "number": len(uploaded_files),
            "files": uploaded_files
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=632, debug=True)