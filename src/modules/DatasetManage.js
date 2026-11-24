// src/modules/DatasetManage.js
import { getDatasets } from '../api.js';
import { RegionSelect } from './RegionSelect.js';

export function renderDatasetManage() {
    const container = document.createElement('div');
    container.className = 'page-section active';
    container.style.padding = '20px';

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2c4a36; font-weight: 800;">数据资产与数据集管理</h2>
            <div id="dataset-region-container"></div>
        </div>
        
        <div style="background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background: #f8faf9; color: #5E8C72; font-size: 14px;">
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">数据集名称</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">版本</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">包含语料数</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">生成时间</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">状态</th>
                        <th style="padding: 14px; border-bottom: 2px solid #eef2f0;">操作</th>
                    </tr>
                </thead>
                <tbody id="dataset-table-body">
                    <tr><td colspan="6" style="text-align:center; padding: 20px;">正在加载数据集...</td></tr>
                </tbody>
            </table>
            <div style="margin-top:20px; padding:15px; background: #f8faf9; border-radius:8px; font-size:13px; color: #7a8f82; line-height: 1.8;">
                <b>说明：</b> 系统已按说话人维度进行训练集 / 验证集 / 测试集划分，避免数据泄漏。
            </div>
        </div>
    `;

    let currentRegionId = '';
    const regionSelect = RegionSelect((regionId) => {
        currentRegionId = regionId;
        loadDatasets();
    });
    container.querySelector('#dataset-region-container').appendChild(regionSelect.element);

    async function loadDatasets() {
        const tbody = document.getElementById('dataset-table-body');
        if (!tbody) return; // 安全锁

        try {
            const res = await getDatasets(currentRegionId);
            if(res.code === 0 && res.data?.items) {
                if (res.data.items.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999; padding: 20px;">暂无数据集</td></tr>`;
                    return;
                }
                tbody.innerHTML = res.data.items.map(item => `
                    <tr style="border-bottom: 1px solid #eef2f0;">
                        <td style="padding: 14px; color: #333;">${item.name}</td>
                        <td style="padding: 14px; color: #666;">${item.version}</td>
                        <td style="padding: 14px; color: #666;">${item.total_recordings || 0} 条</td>
                        <td style="padding: 14px; color: #666;">${item.created_at || '-'}</td>
                        <td style="padding: 14px;">
                            <span style="background:#f0f9eb; color:#67c23a; padding:4px 8px; border-radius:4px; font-size:12px;">${item.status}</span>
                        </td>
                        <td style="padding: 14px;">
                            <button style="padding: 6px 12px; border: 1px solid #5E8C72; background: #fff; color: #5E8C72; border-radius: 4px; cursor: pointer;">导出</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999; padding: 20px;">暂无数据集</td></tr>`;
            }
        } catch (e) {
            console.error('加载数据集失败', e);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding: 20px;">网络异常</td></tr>`;
        }
    }
    
    loadDatasets();

    return container;
}