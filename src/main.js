// src/main.js
import { renderLogin } from './modules/Login.js';
import { renderDashboard } from './modules/Dashboard.js';
import { renderUserManage } from './modules/UserManage.js';
import { renderTaskManage } from './modules/TaskManage.js';
import { renderAuditManage } from './modules/AuditManage.js';
import { renderWithdrawManage } from './modules/WithdrawManage.js';
import { renderDatasetManage } from './modules/DatasetManage.js';
import { renderSystemManage } from './modules/SystemManage.js';
import { renderReviewQueue } from './modules/ReviewQueue.js';
import { renderWallet } from './modules/Wallet.js';

const app = document.getElementById('app');

export const globalState = {
    admin_token: localStorage.getItem('admin_token') || null,
    reviewer_token: localStorage.getItem('reviewer_token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
};

const adminRoutes = {
    'dashboard': { name: '数据看板', render: renderDashboard },
    'user': { name: '用户与角色管理', render: renderUserManage },
    'task': { name: '方言内容与任务管理', render: renderTaskManage },
    'audit': { name: '语料审核管理', render: renderAuditManage },
    'withdraw': { name: '激励结算与提现管理', render: renderWithdrawManage },
    'dataset': { name: '数据资产与数据集管理', render: renderDatasetManage },
    'system': { name: '模型与系统管理', render: renderSystemManage }
};

const reviewerRoutes = {
    'review-queue': { name: '审核任务大厅', render: renderReviewQueue },
    'wallet': { name: '我的收益', render: renderWallet }
};

export function initApp() {
    const hasAdmin = !!globalState.admin_token;
    const hasReviewer = !!globalState.reviewer_token;
    
    // 防御：有 token 没用户信息，强退
    if ((hasAdmin || hasReviewer) && !globalState.user) {
        logout();
        return;
    }

    if (!hasAdmin && !hasReviewer) {
        app.innerHTML = '';
        app.appendChild(renderLogin(handleLoginSuccess));
    } else {
        renderMainLayout();
    }
}

function handleLoginSuccess(token, userInfo) {
    globalState.user = userInfo;
    localStorage.setItem('user', JSON.stringify(userInfo));

    const roles = userInfo.roles || [];
    if (roles.includes('admin')) {
        globalState.admin_token = token;
        globalState.reviewer_token = null;
        localStorage.setItem('admin_token', token);
        localStorage.removeItem('reviewer_token');
    } else if (roles.includes('reviewer')) {
        globalState.reviewer_token = token;
        globalState.admin_token = null;
        localStorage.setItem('reviewer_token', token);
        localStorage.removeItem('admin_token');
    } else {
        alert('未知角色，请联系管理员');
        return;
    }
    renderMainLayout();
}

export function logout() {
    globalState.admin_token = null;
    globalState.reviewer_token = null;
    globalState.user = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('reviewer_token');
    localStorage.removeItem('user');
    initApp();
}

function renderMainLayout() {
    const roles = globalState.user?.roles || [];
    const isAdmin = roles.includes('admin');
    const isReviewer = roles.includes('reviewer');
    let menuHtml = '';
    let currentRoutes = {};

    if(isAdmin) {
        currentRoutes = adminRoutes;
        menuHtml = Object.keys(adminRoutes).map(key => `<div class="my-menu-item" data-route="${key}">${adminRoutes[key].name}</div>`).join('');
    } else if(isReviewer) {
        currentRoutes = reviewerRoutes;
        menuHtml = Object.keys(reviewerRoutes).map(key => `<div class="my-menu-item" data-route="${key}">${reviewerRoutes[key].name}</div>`).join('');
    }

    app.innerHTML = `
        <style>
            body { margin: 0; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #f4f7f6; }
            .my-navbar { background: #fff; height: 64px; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
            .my-logo { font-size: 20px; font-weight: 800; color: #2c4a36; }
            .my-main-body { display: flex; height: calc(100vh - 64px); }
            .my-menu { width: 240px; background: #fff; margin: 16px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); padding: 12px; display: flex; flex-direction: column; gap: 6px; }
            .my-menu-item { padding: 14px 18px; color: #555; cursor: pointer; font-size: 15px; font-weight: 500; border-radius: 8px; }
            .my-menu-item:hover { background: #f8faf9; color: #2c4a36; }
            .my-menu-item.active { background: #f0f9eb; color: #3a6b4c; font-weight: bold; }
            .my-content { flex: 1; padding: 16px 16px 16px 0; overflow-y: auto; }
        </style>

        <div class="my-navbar">
            <div class="my-logo">乡语智库管理后台</div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 14px; color: #666;">欢迎你，<b>${globalState.user?.phone || ''}</b></span>
                <button id="logout-btn" style="padding: 6px 16px; border: none; background: #fef0f0; color: #f56c6c; border-radius: 6px; cursor: pointer;">退出登录</button>
            </div>
        </div>
        <div class="my-main-body">
            <div class="my-menu" id="sidebar-menu">${menuHtml}</div>
            <div class="my-content" id="content-area"></div>
        </div>
    `;

    document.getElementById('logout-btn').onclick = logout;
    window.__routeMap = currentRoutes;

    document.querySelectorAll('.my-menu-item').forEach(item => {
        item.onclick = (e) => switchPage(e.target.getAttribute('data-route'));
    });

    switchPage(Object.keys(currentRoutes)[0]);
}

function switchPage(routeKey) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    const routeMap = window.__routeMap || {};
    const route = routeMap[routeKey];
    if (!route) return;

    try {
        document.querySelectorAll('.my-menu-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`.my-menu-item[data-route="${routeKey}"]`)?.classList.add('active');
        
        contentArea.innerHTML = '';
        
        // 超级防御：捕获页面渲染时可能产生的任何崩溃
        const pageContent = route.render();
        if (pageContent && pageContent instanceof Node) {
            contentArea.appendChild(pageContent);
        } else {
            contentArea.innerHTML = `<div style="padding:20px;color:red;">该页面渲染失败，请检查该页面的代码是否有错。</div>`;
        }
    } catch (error) {
        console.error('切换页面出错:', error);
        contentArea.innerHTML = `<div style="padding:20px;color:red;">页面加载异常：${error.message}</div>`;
    }
}

initApp();