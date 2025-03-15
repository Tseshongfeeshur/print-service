(function() {
    serverIp = localStorage.getItem('serverIp');
    // 获取 DOM 元素
    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.getElementById('file-input');
    // 点击按钮触发文件选择
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });
    // 文件选择后自动上传
    fileInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length === 0) {
            return;
        }
        // 创建 FormData 对象
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        // 更新状态显示
        const resultStatu = document.getElementById('result-statu');
        const resultTable = document.getElementById('result-table');
        const resultName = document.getElementById('result-name');
        const resultFiles = document.getElementById('result-files');
        const resultNumber = document.getElementById('result-number');
        resultStatu.textContent = '正在上传…';
        try {
            // 发送 POST 请求到 /upload 接口
            const response = await fetch(`http://${serverIp}:632/upload`, {
                method: 'POST',
                body: formData
            });
            // 解析响应
            const result = await response.json();
            if (result.status === 'success') {
                resultStatu.style.display = 'none';
                resultTable.style.display = 'block';
                // 显示上传成功的文件信息
                resultName.textContent = result.subfolder;
                var fileNames = '';
                result.files.forEach(file => {
                    fileNames += `${file.filename}<br>`;
                });
                resultFiles.innerHTML = fileNames
                resultNumber.textContent = result.number;
            } else {
                const errorSnackbar = sober.Snackbar.builder({
                    text: `上传失败。😢`,
                    type: 'error'
                });
                errorSnackbar.show();
                resultTable.style.display = 'none';
                resultStatu.style.display = 'block';
                resultStatu.innerText = result.message;
            }
        } catch (error) {
            const errorSnackbar = sober.Snackbar.builder({
                text: `上传出错。😢`,
                type: 'error'
            });
            errorSnackbar.show();
            resultTable.style.display = 'none';
            resultStatu.style.display = 'block';
            resultStatu.innerText = error.message;
        }
        // 重置文件输入
        fileInput.value = '';
    });
})();

// 待添加子文件夹读取/上传后自动设置文件夹
// 子文件夹也叫任务