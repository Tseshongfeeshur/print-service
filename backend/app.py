from flask import Flask, jsonify
from flask_cors import CORS
import cups

app = Flask(__name__)
CORS(app)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=632, debug=True)