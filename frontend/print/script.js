(function() {
    const tab = document.getElementById('tab');
    tab.addEventListener('change', () => {
        const subTabs = document.querySelectorAll('s-tab-item');
        subTabs.forEach(function(subTab) {
            const targetTabElement = document.getElementById(subTab.value);
            if (subTab.selected) {
                targetTabElement.style.display = 'block';
            } else {
                targetTabElement.style.display = 'none';
            }
        });
    });
    
    // 设置上传
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
        const resultTable = document.getElementById('result-card');
        const resultName = document.getElementById('result-name');
        const resultFiles = document.getElementById('result-files');
        const resultNumber = document.getElementById('result-number');
        const uploadSnackbar = sober.Snackbar.builder({
            text: '正在上传…🧐',
            duration: 1000
        });
        uploadSnackbar.show();
        
        try {
            // 发送 POST 请求到 /upload 接口
            const response = await fetch(`/api/upload`, {
                method: 'POST',
                body: formData
            });
            
            // 解析响应
            const result = await response.json();
            if (result.status === 'success') {
                resultName.textContent = result.subfolder;
                let fileNames = '';
                result.files.forEach(file => {
                    fileNames += `${file.filename}<br>`;
                });
                resultFiles.innerHTML = fileNames;
                resultNumber.textContent = result.number;
                getTasks();
                const taskName = document.getElementById('task-name');
                taskName.value = result.subfolder;
                // 直接调用 getFiles，并传入 result.subfolder
                getFiles(null, result.subfolder);
                resultTable.style.display = 'block';
                const successSnackbar = sober.Snackbar.builder({
                    text: '上传成功。😋'
                });
                successSnackbar.show();
            } else {
                const errorSnackbar = sober.Snackbar.builder({
                    text: `上传失败。😢（${result.message}）`,
                    type: 'error'
                });
                errorSnackbar.show();
                resultTable.style.display = 'none';
            }
        } catch (error) {
            const errorSnackbar = sober.Snackbar.builder({
                text: `上传出错。😢（${error.message}）`,
                type: 'error'
            });
            errorSnackbar.show();
            resultTable.style.display = 'none';
        }
        
        // 重置文件输入
        fileInput.value = '';
    });
    
    async function getTasks() {
        const taskName = document.getElementById('task-name');
        taskName.innerHTML = '';
        try {
            const response = await fetch(`/api/subfolders`);
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
    
    // 修改 getFiles，支持传入 subfolder 参数
    async function getFiles(event, subfolder) {
        const folder = subfolder || event?.target?.value;
        console.log('当前文件夹：', folder); // 此处应能正常获取到值
        
        const ul = document.getElementById('file-checkbox-container');
        const response = await fetch(`/api/subfiles?subfolder=${folder}`);
        const data = await response.json();
        if (data.status === "success") {
            ul.innerHTML = '';
            if (data.files.length != 0) {
                data.files.forEach((file) => {
                    const li = document.createElement('s-checkbox');
                    li.textContent = file;
                    li.checked = true;
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
    }
    
    const taskName = document.getElementById('task-name');
    taskName.addEventListener('change', (event) => {
        // 页面交互时调用 getFiles，使用默认的事件对象来获取值
        getFiles(event);
    });

    // 遍历配置项，生成 `<s-picker>` 结构
    const printOptionPickers = document.querySelectorAll('.print-option-pickers');
    printOptionPickers.forEach(picker => {
        const pickerValue = localStorage.getItem(picker.id);
        if (pickerValue) {
            picker.value = pickerValue;
        }
        picker.addEventListener('change', (event) => {
            localStorage.setItem(event.target.id, event.target.value);
        });
    });
})();