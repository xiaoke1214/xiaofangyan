// src/modules/UserManage.js
import { getUserList } from '../api.js';
import { RegionSelect } from './RegionSelect.js';
import { showModal } from './Modal.js';

export function renderUserManage() {
    const container = document.createElement('div');
    container.className = 'page-section active';
    container.style.padding = '20px';

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2c4a36; font-weight: 800;">用户与角色管理</h2>
            <div id="user-region-container"></div>
        </div>
        
        <div style="background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background: #f8faf9; color: #5E8C72; font-size: 14px;">
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">用户ID</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">手机号</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">方言区域</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">实名状态</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">角色</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">账号状态</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">操作</th>
                    </tr>
                </thead>
                <tbody id="user-table-body">
                    <tr><td colspan="7" style="text-align:center; padding: 20px;">正在加载用户列表...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    let currentRegionId = '';
    
    const regionSelect = RegionSelect((regionId) => {
        currentRegionId = regionId;
        loadUserList();
    });
    container.querySelector('#user-region-container').appendChild(regionSelect.element);

    async function loadUserList() {
        const tbody = document.getElementById('user-table-body');
        if (!tbody) return;

        try {
            // 修复：调用 api.js 里正确的 getUserList
            const res = await getUserList({ region_id: currentRegionId });
            
            if (res.code === 0 && res.data) {
                const list = res.data.items || res.data || [];
                if (list.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding: 20px;">暂无用户数据</td></tr>`;
                    return;
                }

                tbody.innerHTML = list.map(item => {
                    const realNameTag = item.real_name_verified 
                        ? `<span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #f0f9eb; color: #67c23a;">已认证</span>` 
                        : `<span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #fdf6ec; color: #e6a23c;">未认证</span>`;
                    
                    const statusTag = item.status === 'active' 
                        ? `<span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #f0f9eb; color: #67c23a;">正常</span>` 
                        : `<span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #fef0f0; color: #f56c6c;">已冻结</span>`;
                    
                    const roleText = (item.roles || []).join('、') || '无';

                    return `
                        <tr style="border-bottom: 1px solid #eef2f0;">
                            <td style="padding: 14px; color: #333;">${item.id}</td>
                            <td style="padding: 14px; color: #666;">${item.phone_masked || '-'}</td>
                            <td style="padding: 14px; color: #666;">${item.region_name || '-'}</td>
                            <td style="padding: 14px;">${realNameTag}</td>
                            <td style="padding: 14px; color: #666;">${roleText}</td>
                            <td style="padding: 14px;">${statusTag}</td>
                            <td style="padding: 14px;">
                                <button class="btn-detail" data-id="${item.id}" style="padding: 6px 12px; border: 1px solid #5E8C72; background: #fff; color: #5E8C72; border-radius: 4px; cursor: pointer;">详情</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } else if (res.code === 10104) {
                 // 如果是 401 会在这里被捕获
                 tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red; padding: 20px;">登录状态已过期，请重新登录</td></tr>`;
            } else {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding: 20px;">暂无用户数据</td></tr>`;
            }
        } catch (e) {
            console.error('加载用户列表异常:', e);
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red; padding: 20px;">网络异常，请检查后端</td></tr>`;
        }
    }

    loadUserList();
    return container;
}