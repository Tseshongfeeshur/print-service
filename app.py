from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import cups
import os
import subprocess
import tempfile
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

@app.route('/api/print', methods=['POST'])
def print_files():
    try:
        # 获取 JSON 数据
        data = request.get_json()
        if not data or 'files' not in data or 'printOptions' not in data:
            return jsonify({"status": "error", "message": "缺少 files 或 printOptions 参数"}), 400

        files = data['files']
        print_options = data['printOptions']

        if not files:
            return jsonify({"status": "error", "message": "文件列表为空"}), 400

        # 创建临时目录
        temp_dir = tempfile.mkdtemp()
        processed_files = []
        discarded_files = []  # 用于记录被丢弃的文件

        # 定义支持的文件类型
        MS_OFFICE_EXTS = ('.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx')
        IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.gif', '.bmp')
        TEXT_EXT = ('.txt',)
        VALID_EXTS = MS_OFFICE_EXTS + IMAGE_EXTS + TEXT_EXT + ('.pdf',)

        # 处理每个文件
        for file_path in files:
            if not os.path.exists(file_path):
                return jsonify({"status": "error", "message": f"文件不存在: {file_path}"}), 404

            # 检查文件扩展名
            file_ext = os.path.splitext(file_path.lower())[1]
            if file_ext not in VALID_EXTS:
                discarded_files.append({"file": file_path, "reason": "不支持的文件格式"})
                continue

            # 处理 MS Office 文档
            if file_ext in MS_OFFICE_EXTS:
                # 使用 libreoffice 转换为 PDF
                temp_pdf = os.path.join(temp_dir, f"{os.path.basename(file_path)}.pdf")
                cmd = [
                    'libreoffice',
                    '--headless',
                    '--convert-to', 'pdf',
                    '--outdir', temp_dir,
                    file_path
                ]
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    return jsonify({
                        "status": "error",
                        "message": f"文件转换失败: {file_path}, 错误: {result.stderr}"
                    }), 500
                
                # 获取转换后的 PDF 文件名
                converted_file = os.path.join(temp_dir, os.path.splitext(os.path.basename(file_path))[0] + '.pdf')
                if os.path.exists(converted_file):
                    processed_files.append(converted_file)
                else:
                    return jsonify({"status": "error", "message": f"转换后的文件未找到: {file_path}"}), 500
            else:
                # PDF、图片和 txt 文件直接使用原路径
                processed_files.append(file_path)

        # 如果没有有效的文件需要打印
        if not processed_files and discarded_files:
            return jsonify({
                "status": "error",
                "message": "没有可打印的有效文件",
                "discarded_files": discarded_files
            }), 400

        # 连接打印机并打印
        conn = cups.Connection()
        printers = conn.getPrinters()
        
        # 使用默认打印机，如果没有则使用第一个可用打印机
        default_printer = next((name for name, info in printers.items() 
                              if info.get("printer-is-default", False)), 
                             next(iter(printers), None))
        
        if not default_printer:
            return jsonify({"status": "error", "message": "没有可用的打印机"}), 503

        # 准备打印选项
        options = {
            'PageSize': print_options.get('PageSize', 'A4'),
            'MediaType': print_options.get('MediaType', 'Plain'),
            'InputSlot': print_options.get('InputSlot', 'tray1'),
            'EconoMode': 'off' if print_options.get('EconoMode', False) else 'on',
            'ColorModel': print_options.get('ColorModel', 'Gray'),
            'OutputMode': print_options.get('OutputMode', 'FastRes600'),
        }

        # 打印所有文件
        job_ids = []
        for file_path in processed_files:
            job_id = conn.printFile(default_printer, file_path, os.path.basename(file_path), options)
            job_ids.append(job_id)

        # 返回结果，包括丢弃的文件信息（如果有）
        response = {
            "status": "success",
            "message": "打印任务已提交",
            "job_ids": job_ids,
            "printer": default_printer,
            "file_count": len(processed_files),
            "temp_dir": temp_dir
        }
        if discarded_files:
            response["discarded_files"] = discarded_files

        return jsonify(response)

    except cups.IPPError as e:
        return jsonify({"status": "error", "message": f"打印错误: {e}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/default-printer', methods=['GET', 'POST'])
def default_printer():
    try:
        conn = cups.Connection()
        printers = conn.getPrinters()
        
        if request.method == 'GET':
            # 获取所有可用打印机及默认打印机
            default_printer = next((name for name, info in printers.items() 
                                    if info.get("printer-is-default", False)), None)
            printer_list = list(printers.keys())

            return jsonify({
                "status": "success",
                "printers": printer_list,
                "default_printer": default_printer
            })

        elif request.method == 'POST':
            # 设置默认打印机
            data = request.get_json()
            new_default = data.get('printer')

            if new_default not in printers:
                return jsonify({"status": "error", "message": "指定的打印机不存在"}), 400

            subprocess.run(["lpoptions", "-d", new_default], check=True)
            return jsonify({"status": "success", "message": f"默认打印机已设置为 {new_default}"})

    except cups.IPPError as e:
        return jsonify({"status": "error", "message": f"CUPS 连接错误: {e}"})
    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "message": f"命令执行失败: {e}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# 让 Flask 直接托管前端
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=632, debug=False)