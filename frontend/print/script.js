(function() {
    serverIp = localStorage.getItem('serverIp');
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
    
    // 修改 getFiles，支持传入 subfolder 参数
    async function getFiles(event, subfolder) {
        const folder = subfolder || event?.target?.value;
        console.log('当前文件夹：', folder); // 此处应能正常获取到值
        
        const ul = document.getElementById('file-checkbox-container');
        const response = await fetch(`http://${serverIp}:632/subfiles?subfolder=${folder}`);
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
    
    // 打印机配置项及所有备选值
    const printerOptions = {
        PageSize: [
            "A4", "Letter", "Legal", "A6", "A5", "B5", "8.5x13in", "216x340mm",
            "195x270mm", "184x260mm", "Postcard", "4x6", "5x7", "B6", "10x15",
            "Statement", "EnvMonarch", "EnvDL", "Env10", "EnvC5", "EnvISOB5",
            "EnvC6", "EnvChou3", "DoublePostcardRotated", "Executive", "Envroc16k"
        ],
        MediaType: [
            "Plain", "Auto", "Letterhead", "Envelope", "Labels", "Bond", "Colored",
            "Recycled", "Transparency", "Preprinted", "Prepunched", "HPEcoSMARTLite",
            "Mid-Weight", "Light", "Heavy", "ExtraHeavy", "Rough", "Vellum"
        ],
        InputSlot: [
            "tray1", "Manual"
        ],
        EconoMode: [
            false, true
        ],
        ColorModel: [
            "Gray", "Mono", "KGray"
        ],
        OutputMode: [
            "Draft", "FastRes600", "FastRes1200", "ImageREt2400"
        ]
    };

    // 选项的中文映射（用于显示 label）
    const optionLabels = {
        PageSize: "纸张尺寸",
        MediaType: "纸张类型",
        InputSlot: "进纸来源",
        EconoMode: "省墨模式",
        ColorModel: "颜色模式",
        OutputMode: "打印质量"
    };

    // 选项值的中文映射（用于选项文本）
    const valueLabels = {
        KGray: "灰度增强",
        Gray: "灰度",
        Mono: "单色",
        FastRes600: "600 DPI",
        FastRes1200: "1200 DPI",
        Draft: "草稿",
        ImageREt2400: "高质量",
        Manual: "手动进纸",
        tray1: "纸盒 1",
        true: "开启",
        false: "关闭",
        Auto: "自动",
        Plain: "普通纸",
        HPEcoSMARTLite: "环保纸",
        Light: "轻质纸",
        MidWeight: "中等厚度",
        Heavy: "厚纸",
        ExtraHeavy: "特厚纸",
        Transparency: "透明胶片",
        Labels: "标签纸",
        Letterhead: "信纸",
        Envelope: "信封",
        Preprinted: "预印纸",
        Prepunched: "打孔纸",
        Colored: "彩色纸",
        Bond: "书写纸",
        Recycled: "再生纸",
        Rough: "粗糙纸",
        Vellum: "羊皮纸"
    };

    // 获取要插入的父元素
    const container = document.getElementById("printer-options");

    // 遍历配置项，生成 `<s-picker>` 结构
    for (const [key, values] of Object.entries(printerOptions)) {
        const picker = document.createElement("s-picker");
        picker.id = key;
        picker.className = "print-option-pickers";
        picker.setAttribute("label", optionLabels[key] || key);

        values.forEach(value => {
            const item = document.createElement("s-picker-item");
            item.setAttribute("value", value);
            item.textContent = valueLabels[value] || value;
            picker.appendChild(item);
        });
        const pickerValue = localStorage.getItem(picker.id);
        if(pickerValue) {
            picker.value = pickerValue;
        }
        picker.addEventListener('change', (event) => {
            localStorage.setItem(event.target.id, event.target.value);
        });

        container.appendChild(picker);
    }
})();