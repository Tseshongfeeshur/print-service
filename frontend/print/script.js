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
                    li.className = 'file-names';
                    li.textContent = file;
                    li.id = file;
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
    // 定义要提交的数据

    // 提交打印请求的函数
    async function submitPrintRequest() {
        let printData = {
            printOptions: {
                PageSize: document.getElementById('PageSize')?.value || "A4",
                MediaType: document.getElementById('MediaType')?.value || "Plain",
                InputSlot: document.getElementById('InputSlot')?.value || "tray1",
                EconoMode: document.getElementById('EconoMode')?.value === "true" || false,
                ColorModel: document.getElementById('ColorModel')?.value || "Gray",
                OutputMode: document.getElementById('OutputMode')?.value || "FastRes600"
            }
        };

        const folder = document.getElementById('task-name')?.value || "";
        const filesCheckboxes = document.querySelectorAll('.file-names');

        filesCheckboxes.forEach(file => {
            if (file.checked) {
                printData.files.push(`/tmp/printer-service/${folder}/${file.id}`);
            }
        });
        try {
            const response = await fetch('http://localhost:632/api/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(printData) // 将对象转换为 JSON 字符串
            });

            // 检查响应是否成功
            if (!response.ok) {
                throw new Error(`HTTP 错误: ${response.status}`);
            }

            // 解析响应数据
            const result = await response.json();
            console.log('打印请求结果:', result);

            // 处理响应
            if (result.status === 'success') {
                console.log(`成功提交 ${result.file_count} 个文件的打印任务`);
                console.log('打印机:', result.printer);
                console.log('任务 ID:', result.job_ids);
                if (result.discarded_files) {
                    console.log('被丢弃的文件:', result.discarded_files);
                }
            } else {
                console.error('打印失败:', result.message);
                if (result.discarded_files) {
                    console.error('被丢弃的文件:', result.discarded_files);
                }
            }

        } catch (error) {
            console.error('提交打印请求时出错:', error);
        }
    }

    const printFab = document.getElementById('print-now');
    printFab.addEventListener('click', submitPrintRequest);
})();