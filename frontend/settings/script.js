(function() {
    // 获取所有可用打印机及默认打印机
    const printersElement = document.getElementById('default-printer')
    function getDefaultPrinter() {
        fetch('/api/default-printer')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const printers = data.printers;
                    printers.forEach(printerName => {
                        const printerElement = document.createElement('s-picker-item');
                        printerElement.value = printerName;
                        printerElement.textContent = printerName;
                        if (printerName == data.default_printer) {
                            printerElement.selected = true;
                        }
                        printersElement.appendChild(printerElement);
                    });
                } else {
                    const errorSnackbar = sober.Snackbar.builder({
                        text: `获取默认打印机失败。😢（${data.message}）`,
                        type: 'error'
                    });
                    errorSnackbar.show();
                }
            })
            .catch(error => {
                const errorSnackbar = sober.Snackbar.builder({
                    text: `请求错误。😢（${error}）`,
                    type: 'error'
                });
                errorSnackbar.show();
            });
    }
    
    // 设置默认打印机
    function setDefaultPrinter(event) {
        const printerName = event.target.value;
        fetch('/api/default-printer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ printer: printerName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const successSnackbar = sober.Snackbar.builder({
                    text: '设置成功。😋'
                });
                successSnackbar.show();
            } else {
                const errorSnackbar = sober.Snackbar.builder({
                    text: `设置失败。😢（${data.message}）`,
                    type: 'error'
                });
                errorSnackbar.show();
            }
        })
        .catch(error => {
                const errorSnackbar = sober.Snackbar.builder({
                    text: `请求错误。😢（${error}）`,
                    type: 'error'
                });
                errorSnackbar.show();
        });
    }
    getDefaultPrinter(); // 获取打印机信息
    printersElement.addEventListener('change', setDefaultPrinter);
    // setDefaultPrinter('你的打印机名称'); // 设置默认打印机（使用实际的打印机名称）
});