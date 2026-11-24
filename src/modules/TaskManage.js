// src/modules/TaskManage.js
import { getPackages, publishPackage, pausePackage } from '../api.js';
import { RegionSelect } from './RegionSelect.js';
import { showModal } from './Modal.js';

export function renderTaskManage() {
    const container = document.createElement('div');
    container.className = 'page-section active';
    container.style.padding = '20px';

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2c4a36; font-weight: 800;">方言内容与任务管理</h2>
            <div id="task-region-container"></div>
        </div>

        <div style="background:#fff;border-radius:8px;box-shadow:0 2px 8px #00000014;overflow:hidden;">
            <div style="padding:16px;border-bottom:1px solid #eee;display:flex;gap:12px;align-items:center;">
                <input id="search-keyword" placeholder="搜索任务名称" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;outline:none;">
                <button id="btn-search" style="padding:6px 14px;background:#2c4a36;color:#fff;border:none;border-radius:6px;cursor:pointer;">搜索</button>
            </div>
            <table style="width:100%;border-collapse:collapse;">
                <thead style="background:#f7f9f8;">
                    <tr>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">任务ID</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">任务名称</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">所属区域</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">状态</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">操作</th>
                    </tr>
                </thead>
                <tbody id="task-table-body">
                    <tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">加载中...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    // 区域筛选
    const regionWrap = container.querySelector('#task-region-container');
    RegionSelect(regionWrap, (selectedRegionId) => {
        loadList({ region_id: selectedRegionId });
    });

    let currentFilter = {};
    const tbody = container.querySelector('#task-table-body');

    async function loadList(filter = {}) {
        currentFilter = filter;
        tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">加载中...</td></tr>`;
        try {
            const res = await getPackages(filter);
            const list = res.data || [];
            if (!list.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">暂无任务</td></tr>`;
                return;
            }
            tbody.innerHTML = '';
            list.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';
                let actionBtn = '';
                if(item.status === 'draft' || item.status === 'paused'){
                    actionBtn = `<button data-id="${item.id}" class="btn-publish" style="padding:4px 10px;background:#2c4a36;color:#fff;border:none;border-radius:4px;cursor:pointer;">发布</button>`
                }else if(item.status === 'published'){
                    actionBtn = `<button data-id="${item.id}" class="btn-pause" style="padding:4px 10px;border:1px solid #2c4a36;color:#2c4a36;background:#fff;border-radius:4px;cursor:pointer;">暂停</button>`
                }
                tr.innerHTML = `
                    <td style="padding:12px 16px;">${item.id}</td>
                    <td style="padding:12px 16px;">${item.name || '-'}</td>
                    <td style="padding:12px 16px;">${item.region_name || '-'}</td>
                    <td style="padding:12px 16px;">${item.status_text || item.status}</td>
                    <td style="padding:12px 16px;display:flex;gap:8px;">
                        ${actionBtn}
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // 发布
            tbody.querySelectorAll('.btn-publish').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    if(!confirm('确认发布这个任务？')) return;
                    await publishPackage(id);
                    alert('发布成功');
                    loadList(currentFilter);
                }
            })
            // 暂停
            tbody.querySelectorAll('.btn-pause').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    if(!confirm('确认暂停这个任务？')) return;
                    await pausePackage(id);
                    alert('暂停成功');
                    loadList(currentFilter);
                }
            })
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;text-align:center;color:red;">加载失败：${err.message}</td></tr>`;
        }
    }

    // 搜索
    container.querySelector('#btn-search').onclick = () => {
        const kw = container.querySelector('#search-keyword').value.trim();
        loadList({ ...currentFilter, keyword: kw });
    }

    loadList();
    return container;
}
