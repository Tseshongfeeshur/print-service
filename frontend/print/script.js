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
        const uploadingSnackbar = sober.Snackbar.builder({
            text: '正在上传…🧐'
        });
        uploadingSnackbar.show();
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
                getTasks();
                const taskName = document.getElementById('task-name');
                taskName.value = result.subfolder;
                const successSnackbar = sober.Snackbar.builder({
                    text: '上传成功。😋'
                });
                successSnackbar.show();
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
    async function getTasks() {
        const taskName = document.getElementById('task-name');
        taskName.innerHTML = '';
        try {
            const response = await fetch(`http://${serverIp}:632/subfolders`);
            const data = await response.json();
            // 检查响应状态并提取子文件夹列表
            if (data.status === "success" && data.subfolders) {
                data.subfolders.forEach(subfolder => {
                    // 对每个子文件夹名称进行处理
                    const newTask = document.createElement('s-picker-item');
                    newTask.value = subfolder;
                    newTask.textContent = subfolder;
                    taskName.appendChild(newTask);
                });
            } else {
                taskName.innerHTML = '';
            }
        } catch (error) {
            const errorSnackbar = sober.Snackbar.builder({
                text: `发生错误。😢（${error.message}）`,
                type: 'error'
            });
            errorSnackbar.show();
            taskName.innerHTML = '';
        }
    }
    // 页面加载即获取最近任务列表
    getTasks();
    const taskName = document.getElementById('task-name');
    taskName.addEventListener('change', ()=> {
        const ul = document.getElementById('file-checkbox-container');
        const response = await fetch(`http://${serverIp}:632/subfiles?subfolder=${taskName.value}`);
        const data = await response.json();
        if (data.status === "success") {
            ul.innerHTML = '';
            if (data.files.length != 0) {
                data.files.forEach((file) => {
                    const li = document.createElement('s-checkbox');
                    li.textContent = file;
                    ul.appendChild(li);
                });
            }
        } else {
            ul.innerHTML = '';
            const errorSnackbar = sober.Snackbar.builder({
                text: `出现错误。😢（${data.message}）`,
                type: 'error'
            });
            errorSnackbar.show();
        }
    });
})();

// 待添加子文件夹读取/上传后自动设置文件夹
// 子文件夹也叫任务