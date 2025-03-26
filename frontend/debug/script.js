(function() {
    async function checkQueue() {
        try {
            let response = await fetch('/api/check-queue');
            let data = await response.json();
            if (data.status == 'success') {
                if (!data.jobs) {
                    const successSnackbar = sober.Snackbar.builder({
                        text: `打印队列为空。😋`
                    });
                    successSnackbar.show();
                } else {
                    const queue = data.jobs;
                    
                    const tipDialog = sober.Dialog.builder({
                        headline: '打印队列',
                        text: 
                    })
                }
            }
            console.log(data);
        } catch (error) {
            const errorSnackbar = sober.Snackbar.builder({
                text: `请求错误。😢（${error}）`,
                type: 'error'
            });
            errorSnackbar.show();
        }
    }
    const checkQueueButton = document.getElementById('check-queue-button');
    checkQueueButton.addEventListener('click', checkQueue);
    
})();