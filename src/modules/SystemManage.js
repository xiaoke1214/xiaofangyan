// src/modules/SystemManage.js
import { getAIModels, toggleAiModel } from '../api.js';
import { RegionSelect } from './RegionSelect.js';
import { showModal } from './Modal.js';

export function renderSystemManage() {
    const container = document.createElement('div');
    container.className = 'page-section active';
    container.style.padding = '20px';

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2c4a36; font-weight: 800;">AI模型系统管理</h2>
            <div id="system-region-container"></div>
        </div>
        <div style="background:#fff;border-radius:8px;box-shadow:0 2px 8px #00000014;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;">
                <thead style="background:#f7f9f8;">
                    <tr>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">模型ID</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">模型名称</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">状态</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">操作</th>
                    </tr>
                </thead>
                <tbody id="model-table-body">
                    <tr><td colspan="4" style="padding:20px;text-align:center;color:#999;">加载中...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    const regionWrap = container.querySelector('#system-region-container');
    RegionSelect(regionWrap, (selectedRegionId) => {
        loadList({ region_id: selectedRegionId });
    });

    const tbody = container.querySelector('#model-table-body');

    async function loadList(params = {}) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding:20px;text-align:center;color:#999;">加载中...</td></tr>`;
        try {
            const res = await getAIModels(params);
            const list = res.data || [];
            if (!list.length) {
                tbody.innerHTML = `<tr><td colspan="4" style="padding:20px;text-align:center;color:#999;">暂无模型数据</td></tr>`;
                return;
            }
            tbody.innerHTML = '';
            list.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';
                tr.innerHTML = `
                    <td style="padding:12px 16px;">${item.id}</td>
                    <td style="padding:12px 16px;">${item.name || '-'}</td>
                    <td style="padding:12px 16px;">${item.status_text || item.status}</td>
                    <td style="padding:12px 16px;">
                        <button data-id="${item.id}" class="btn-toggle" style="padding:4px 8px;background:#2c4a36;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:6px;">切换状态</button>
                        <button data-id="${item.id}" class="btn-detail" style="padding:4px 8px;background:#666;color:#fff;border:none;border-radius:4px;cursor:pointer;">查看详情</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            tbody.querySelectorAll('.btn-detail').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.dataset.id;
                    showModal({ title: '模型详情', content: `模型ID：${id}` });
                }
            })
            tbody.querySelectorAll('.btn-toggle').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    await toggleAiModel(id);
                    loadList(params);
                }
            })
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="4" style="padding:20px;text-align:center;color:red;">加载失败：${err.message}</td></tr>`;
        }
    }

    loadList();
    return container;
}
