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
    const menuItems = document.querySelectorAll('s-menu-item');
    menuItems.forEach(function(item) {
        item.addEventListener('click', () => { goto(item.id); });
    });
    goto('home');
});



async function goto(page) {
    // 定义元素
    const container = document.getElementById('container');
    const drawer = document.getElementById('drawer');
    // 虚化容器
    container.style.opacity = '0.3';
    // 获取子结构
    async function fetchResource(url, retries = 3, delay = 100) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.text();
            } catch (error) {
                if (attempt === retries) {
                    console.warn(`加载资源失败（${attempt}/${retries}）：${url} - ${error}`);
                    return null; // 所有重试失败后返回 null
                }
                // 在重试之间添加延迟
                await new Promise(resolve => setTimeout(resolve, delay));
                console.log(`重试加载（${attempt}/${retries}）：${url}`);
            }
        }
    }
    try {
        const [subHtml, subCss, subJs] = await Promise.all([
            fetchResource(`./${page}/index.html`),
            fetchResource(`./${page}/style.css`),
            fetchResource(`./${page}/script.js`)
        ]);
        
        // 清空容器并填充新内容
        container.innerHTML = '';
        container.insertAdjacentHTML('beforeend', subHtml || '');
        
        // 处理 CSS
        if (subCss) {
            const oldStyle = document.getElementById('spa-style');
            if (oldStyle) oldStyle.remove();
            
            const style = document.createElement('style');
            style.id = 'spa-style';
            style.textContent = subCss;
            container.appendChild(style);
        }
        
        // 处理 JS
        if (subJs) {
            const script = document.createElement('script');
            script.textContent = subJs;
            script.async = true;
            document.head.appendChild(script);
        }
    } catch (error) {
        console.error('页面加载出错:', error);
    }
    // 滚动到顶部
    container.scrollTop = 0;
    // 显示容器
    container.style.opacity = '1';
    // 其他更改
    const menuItems = document.querySelectorAll('s-menu-item');
    const appTitle = document.getElementById('app-title');
    var currentTitle;
    menuItems.forEach(function(item) {
        if (item.id == page) {
            item.setAttribute('checked', 'true');
            currentTitle = item.textContent.trim();
        } else {
            item.removeAttribute('checked');
        }
    });
    drawer.close();
    appTitle.innerText = currentTitle;
    document.title = `${currentTitle} | 局域网打印`;
}