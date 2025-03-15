// 阻断后退行为
window.onpopstate = function(event) {
    return;
};

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
            document.title = `${currentTitle} | 打印`;
            goto(currentPageId);
        });
    });
    goto('home');
});



async function goto(page) {
    // 定义元素
    const container = document.getElementById('container');
    // 虚化容器
    container.style.opacity = '0.3';
    // 获取子结构
    async function fetchResource(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
        } catch (error) {
            console.warn(`加载资源失败：${url} - ${error}`);
            return null; // 返回 null 表示加载失败
        }
    }
    const subHtml = await fetchResource(`./${page}/index.html`);
    const subCss = await fetchResource(`./${page}/style.css`);
    const subJs = await fetchResource(`./${page}/script.js`);
    // 填充子结构到容器，添加样式，运行脚本
    container.innerHTML = '';
    container.insertAdjacentHTML('beforeend', subHtml);
    if (subCss) {
        const style = document.createElement('style');
        style.innerText = subCss;
        container.appendChild(style);
    }
    if (subJs) {
        const script = document.createElement('script');
        script.textContent = subJs;
        script.async = true;
        document.head.appendChild(script);
    }
    // 滚动到顶部
    container.scrollTop = 0;
    // 显示容器
    container.style.opacity = '1';
}