(function() {
    function checkQueue() {
        fetch('/api/check-queue', {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                if (data.jobs.length === 0) {
                    const tipSnackbar = sober.Snackbar.builder({
                        text: '打印队列为空。🧐'
                    });
                    tipSnackbar.show()
                } else {
                    let jobInfo = data.jobs.map(job => `${job.job_id} - ${job.status}`).join("\n");
                    const infoDialog = sober.Dialog.builder({
                        headline: '打印队列',
                        text: jobInfo,
                        actions: [
                            {
                                text: '清空队列',
                                click: clearQueue
                            },
                            {
                                text: '好',
                                click: () => {
                                    infoDialog.showed = false;
                                }
                            }
                        ]
                    });
                }
            } else {
                const errorSnackbar = sober.Snackbar.builder({
                    text: `出现错误。😢（${data.message}）`,
                    type: 'error'
                });
                errorSnackbar.show();
            }
        })
        .catch(error => {
            const errorSnackbar = sober.Snackbar.builder({
                text: `请求失败。😢（${error}）`,
                type: 'error'
            });
            errorSnackbar.show();
        });
    }
    const checkQueueButton = document.getElementById('check-queue-button');
    checkQueueButton.addEventListener('click', checkQueue);
})();