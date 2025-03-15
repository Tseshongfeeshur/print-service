from flask import Flask, jsonify
from flask_cors import CORS  # 导入 CORS
import subprocess

app = Flask(__name__)
CORS(app)  # 启用 CORS 支持
printer_name = "HP-LaserJet-Pro-MFP-M126a"

@app.route('/check', methods=['GET'])
def check_printer_status():
    try:
        # 执行 lpstat -p 获取打印机状态
        result = subprocess.run(["lpstat", "-p"], capture_output=True, text=True)
        output = result.stdout.strip()

        # 解析输出，检查打印机状态
        if printer_name in output:
            status_lines = output.split("\n")
            return jsonify({"status": "connected", "details": output})
        else:
            return jsonify({"status": "not found"})
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=632, debug=True)