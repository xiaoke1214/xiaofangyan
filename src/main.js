// ================= 核心逻辑 =================

const users = {
    'admin':   { password: '123456', role: 'admin',   name: '平台管理员' },
    'auditor': { password: '123456', role: 'auditor', name: '审核标注员' }
};

const menus = {
    admin: [
        { id: 'dashboard',    name: '数据看板' },
        { id: 'user',         name: '用户与角色管理' },
        { id: 'task',         name: '方言内容与任务管理' },
        { id: 'audit-manage', name: '语料审核管理' },
        { id: 'withdraw',     name: '激励结算与提现管理' },
        { id: 'dataset',      name: '数据资产与数据集管理' },
        { id: 'system',       name: '模型与系统管理' }
    ],
    auditor: [
        { id: 'audit', name: '审核工作台' }
    ]
};

let currentRole = '';

function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const user = users[username];

    if (user && user.password === password) {
        currentRole = user.role;
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('main-page').style.display = 'flex';
        document.getElementById('display-username').innerText = username;
        document.getElementById('display-role').innerText = user.name;
        renderMenu(currentRole);
        switchPage(menus[currentRole][0].id);
    } else {
        alert('账号或密码错误！');
    }
}

function renderMenu(role) {
    const sidebar = document.getElementById('sidebar-menu');
    sidebar.innerHTML = '';
    menus[role].forEach(menu => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerText = menu.name;
        div.onclick = () => switchPage(menu.id);
        div.id = `menu-${menu.id}`;
        sidebar.appendChild(div);
    });
}

function switchPage(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`section-${pageId}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    const menuEl = document.getElementById(`menu-${pageId}`);
    if (menuEl) menuEl.classList.add('active');
}

function handleLogout() {
    document.getElementById('main-page').style.display = 'none';
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function switchAuthTab(tab) {
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
    document.getElementById('form-login').classList.toggle('active', tab === 'login');
    document.getElementById('form-register').classList.toggle('active', tab === 'register');

    const hint = document.getElementById('switch-hint');
    if (tab === 'login') {
        hint.innerHTML = '还没有账号？<a onclick="switchAuthTab(\'register\')">去注册</a>';
    } else {
        hint.innerHTML = '已有账号？<a onclick="switchAuthTab(\'login\')">去登录</a>';
    }
}

function handleRegister() {
    const u  = document.getElementById('reg-username').value.trim();
    const p  = document.getElementById('reg-password').value.trim();
    const p2 = document.getElementById('reg-password2').value.trim();

    if (!u || !p || !p2) { alert('请填写完整信息'); return; }
    if (p !== p2)        { alert('两次密码不一致'); return; }
    if (u in users)      { alert('账号已存在'); return; }

    users[u] = { password: p, role: 'admin', name: '平台管理员' };
    alert('注册成功，请登录');
    switchAuthTab('login');
    document.getElementById('username').value = u;
}

// ================= 关键：挂到 window =================
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.handleRegister = handleRegister;
window.switchAuthTab = switchAuthTab;