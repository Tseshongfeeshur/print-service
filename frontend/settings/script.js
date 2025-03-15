(function() {
    const ipInputElement = document.getElementById('ip-input');
    ipInputElement.value = localStorage.getItem('serverIp');
    ipInputElement.addEventListener('blur', function() {
        ip = ipInputElement.value;
        fetch(`http://${ip}:632/check`, { method: 'GET', mode: 'no-cors' })
            .then(response => {
                // 如果请求成功，端口连通
                localStorage.setItem('serverIp', ip);
                const successSnackbar = sober.Snackbar.builder({
                    text: '目标地址连通，已保存。😋',
                    type: 'success'
                });
                successSnackbar.show();
            })
            .catch(error => {
                // 如果请求失败，端口不通
                ipInputElement.value = '';
                const errorSnackbar = sober.Snackbar.builder({
                    text: '目标地址无法连通。😢',
                    type: 'error'
                });
                errorSnackbar.show();
            });
    });
})();