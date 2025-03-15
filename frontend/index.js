document.addEventListener('DOMContentLoaded', function() {
    // 设置抽屉展开按钮
    const drawer = document.getElementById('drawer');
    const drawerOpener = document.getElementById('drawer-opener');
    drawerOpener.addEventListener('click', function() {
        drawer.toggle();
    });
    // 设置菜单项点击动作
    const appTitle = document.getElementById('app-title');
    const menuItems = document.querySelectorAll('s-menu-item');
    menuItems.forEach(function(item) {
        item.addEventListener('click', function() {
            // 更新其他状态
            menuItems.forEach(function(otherItem) {
                otherItem.removeAttribute('checked');
            });
            // 更新当前状态
            item.setAttribute('checked', 'true');
            drawer.close();
            const currentTitle = item.innerText;
            const currentPageId = item.id;
            appTitle.innerText = currentTitle;
            document.title = currentTitle;
            updatePage(currentPageId);
        });
    });
});

function updatePage(pageId) {
    
}