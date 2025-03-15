(function() {
    serverIp = localStorage.getItem('serverIp');
    // 获取 DOM 元素
    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.getElementById('file-input');
    const statusDiv = document.getElementById('status');
    // 点击按钮触发文件选择
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 文件选择后自动上传
    fileInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length === 0) {
            statusDiv.textContent = '未选择文件';
            return;
        }
        // 创建 FormData 对象
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        // 更新状态显示
        statusDiv.textContent = '正在上传...';
        try {
            // 发送 POST 请求到 /upload 接口
            const response = await fetch(`http://${serverIp}:632/upload`, {
                method: 'POST',
                body: formData
            });
            // 解析响应
            console.log(response)
            const result = await response.json();
            if (result.status === 'success') {
                // 显示上传成功的文件信息
                let message = `${result.message}\n`;
                result.files.forEach(file => {
                    message += `原文件名: ${file.original_filename} -> 新文件名: ${file.new_filename}\n`;
                });
                statusDiv.textContent = message;
            } else {
                statusDiv.textContent = `上传失败: ${result.message}`;
            }
        } catch (error) {
            statusDiv.textContent = `上传出错: ${error.message}`;
        }
        // 重置文件输入
        fileInput.value = '';
    });
})();