from flask import Flask, jsonify
from flask_cors import CORS  # 导入 CORS
import cups  # 导入 pycups 进行打印机管理

app = Flask(__name__)
CORS(app)  # 启用 CORS 支持

@app.route('/check', methods=['GET'])
def check_printer_status():
    try:
        # 连接到 CUPS
        conn = cups.Connection()
        
        # 获取所有打印机信息
        printers = conn.getPrinters()

        if not printers:
            return jsonify({"status": "not found"})

        # 解析打印机状态
        printer_list = []
        for name, info in printers.items():
            printer_list.append({
                "name": name,
                "status": info.get("printer-state-message", "Unknown"),  # 获取状态信息
                "is_default": info.get("printer-is-default", False),  # 是否为默认打印机
            })

        return jsonify({"status": "connected", "details": printer_list})

    except cups.IPPError as e:
        return jsonify({"status": "error", "message": f"CUPS 连接错误: {e}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=632, debug=True)