(function() {
    async function checkQueue() {
        try {
            let response = await fetch('/api/check-queue');
            let data = await response.json();
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