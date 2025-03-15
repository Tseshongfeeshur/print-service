(function() {
    function checkPrinter() {
        const ip = localStorage.getItem('serverIp');
        const connectedStatuIcon = document.getElementById('connected-statu');
        const errorStatuIcon = document.getElementById('error-statu');
        fetch(`http://${ip}:632/check`)
            // 解析为 JSON
            .then(response => response.json())
            .then(data => {
                if (data.status === 'connected') {
                    const successSnackbar = sober.Snackbar.builder({
                        text: '打印机已就绪。😋'
                    });
                    errorStatuIcon.style.display = 'none';
                    connectedStatuIcon.style.display = 'inline-block';
                    successSnackbar.show();
                } else if (data.status === 'not found') {
                    const errorSnackbar = sober.Snackbar.builder({
                        text: '找不到打印机。😢',
                        type: 'error'
                    });
                    errorStatuIcon.style.display = 'inline-block';
                    connectedStatuIcon.style.display = 'none';
                    errorSnackbar.show();
                } else if (data.status === 'error') {
                    const errorSnackbar = sober.Snackbar.builder({
                        text: `发生错误。😢（${data.message}）`,
                        type: 'error'
                    });
                    errorStatuIcon.style.display = 'inline-block';
                    connectedStatuIcon.style.display = 'none';
                    errorSnackbar.show();
                }
            })
            .catch(error => {
                const errorSnackbar = sober.Snackbar.builder({
                    text: `检查失败。😢（${error.message}）`,
                    type: 'error'
                });
                console.log(error);
                errorStatuIcon.style.display = 'inline-block';
                connectedStatuIcon.style.display = 'none';
                errorSnackbar.show();
            });
    }
    checkPrinter();
    const iconButton = document.getElementById('head-icon-button');
    iconButton.addEventListener('click', checkPrinter);
    const actionButton = document.getElementById('button-action');
})();