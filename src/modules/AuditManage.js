// src/modules/AuditManage.js
import { getAdminReviewQueue } from '../api.js';
import { RegionSelect } from './RegionSelect.js';

export function renderAuditManage() {
    const container = document.createElement('div');
    container.className = 'page-section active';
    container.style.padding = '20px';

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2c4a36; font-weight: 800;">语料审核管理 (全局)</h2>
            <div id="audit-region-container"></div>
        </div>
        
        <div style="background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background: #f8faf9; color: #5E8C72; font-size: 14px;">
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">队列ID</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">录音ID</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">发音人</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">任务包</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">AI结果</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">状态</th>
                    </tr>
                </thead>
                <tbody id="audit-table-body">
                    <tr><td colspan="6" style="text-align:center; padding: 20px;">正在加载审核队列...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    let currentRegionId = '';
    const regionSelect = RegionSelect((regionId) => {
        currentRegionId = regionId;
        loadQueue();
    });
    container.querySelector('#audit-region-container').appendChild(regionSelect.element);

    async function loadQueue() {
        const tbody = document.getElementById('audit-table-body');
        if (!tbody) return; 

        try {
            // 修复：管理端必须调用 getAdminReviewQueue
            const res = await getAdminReviewQueue({ region_id: currentRegionId });
            
            if(res.code === 0 && res.data) {
                const list = res.data.items || res.data || [];
                if(list.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999; padding: 20px;">暂无审核任务</td></tr>`;
                    return;
                }
                tbody.innerHTML = list.map(item => `
                    <tr style="border-bottom: 1px solid #eef2f0;">
                        <td style="padding: 14px; color: #333;">${item.queue_id}</td>
                        <td style="padding: 14px; color: #666;">${item.recording_id}</td>
                        <td style="padding: 14px; color: #666;">${item.speaker_id}</td>
                        <td style="padding: 14px; color: #666;">${item.package_name || '-'}</td>
                        <td style="padding: 14px; color: #666;">质量:${item.quality_score} | 风险:${item.risk_score}</td>
                        <td style="padding: 14px;">
                             <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #fdf6ec; color: #e6a23c;">${item.status}</span>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999; padding: 20px;">暂无审核任务</td></tr>`;
            }
        } catch (e) {
            console.error('加载审核队列失败', e);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding: 20px;">网络异常，请检查后端</td></tr>`;
        }
    }
    loadQueue();
    return container;
}