// src/modules/WithdrawManage.js
import { getWithdrawalList, approveWithdrawal, payWithdrawal, rejectWithdrawal, getWithdrawalSummary, getWithdrawalReconciliation } from '../api.js';
import { RegionSelect } from './RegionSelect.js';
import { showModal } from './Modal.js';

export function renderWithdrawManage() {
    const container = document.createElement('div');
    container.className = 'page-section active';
    container.style.padding = '20px';

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2c4a36; font-weight: 800;">激励提现管理</h2>
            <div id="withdraw-region-container"></div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:16px;">
            <button id="btn-summary" style="padding:6px 14px;border:1px solid #2c4a36;color:#2c4a36;background:#fff;border-radius:6px;cursor:pointer;">提现汇总</button>
            <button id="btn-reconciliation" style="padding:6px 14px;border:1px solid #2c4a36;color:#2c4a36;background:#fff;border-radius:6px;cursor:pointer;">对账明细</button>
        </div>
        <div style="background:#fff;border-radius:8px;box-shadow:0 2px 8px #00000014;overflow:hidden;">
            <div style="padding:16px;border-bottom:1px solid #eee;display:flex;gap:12px;align-items:center;">
                <input id="search-keyword" placeholder="搜索用户ID/姓名" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;outline:none;">
                <button id="btn-search" style="padding:6px 14px;background:#2c4a36;color:#fff;border:none;border-radius:6px;cursor:pointer;">搜索</button>
            </div>
            <table style="width:100%;border-collapse:collapse;">
                <thead style="background:#f7f9f8;">
                    <tr>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">提现ID</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">用户</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">金额</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">状态</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">操作</th>
                    </tr>
                </thead>
                <tbody id="withdraw-table-body">
                    <tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">加载中...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    const regionWrap = container.querySelector('#withdraw-region-container');
    RegionSelect(regionWrap, (selectedRegionId) => {
        loadList({ region_id: selectedRegionId });
    });

    let currentFilter = {};
    const tbody = container.querySelector('#withdraw-table-body');

    async function loadList(filter = {}) {
        currentFilter = filter;
        tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">加载中...</td></tr>`;
        try {
            const res = await getWithdrawalList(filter);
            const list = res.data || [];
            if (!list.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">暂无提现记录</td></tr>`;
                return;
            }
            tbody.innerHTML = '';
            list.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';
                let actionHtml = '';
                if(item.status === 'pending_approve'){
                    actionHtml = `
                        <button data-id="${item.id}" class="btn-approve" style="padding:4px 8px;background:#2c4a36;color:#fff;border:none;border-radius:4px;cursor:pointer;">审核通过</button>
                        <button data-id="${item.id}" class="btn-reject" style="padding:4px 8px;background:#b84242;color:#fff;border:none;border-radius:4px;cursor:pointer;">驳回</button>
                    `
                }else if(item.status === 'approved'){
                    actionHtml = `<button data-id="${item.id}" class="btn-pay" style="padding:4px 8px;background:#2c4a36;color:#fff;border:none;border-radius:4px;cursor:pointer;">标记已打款</button>`
                }
                tr.innerHTML = `
                    <td style="padding:12px 16px;">${item.id}</td>
                    <td style="padding:12px 16px;">${item.user_name || '-'}</td>
                    <td style="padding:12px 16px;">${item.amount || 0}</td>
                    <td style="padding:12px 16px;">${item.status_text || item.status}</td>
                    <td style="padding:12px 16px;display:flex;gap:8px;">${actionHtml}</td>
                `;
                tbody.appendChild(tr);
            });

            tbody.querySelectorAll('.btn-approve').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    if(!confirm('确认审核通过？')) return;
                    await approveWithdrawal(id);
                    alert('审核成功');
                    loadList(currentFilter);
                }
            })
            tbody.querySelectorAll('.btn-reject').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    const reason = prompt('输入驳回原因：');
                    if(!reason) return;
                    await rejectWithdrawal(id, reason);
                    alert('已驳回');
                    loadList(currentFilter);
                }
            })
            tbody.querySelectorAll('.btn-pay').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    if(!confirm('确认标记已打款？')) return;
                    await payWithdrawal(id);
                    alert('标记打款完成');
                    loadList(currentFilter);
                }
            })
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;text-align:center;color:red;">加载失败：${err.message}</td></tr>`;
        }
    }

    container.querySelector('#btn-search').onclick = () => {
        const kw = container.querySelector('#search-keyword').value.trim();
        loadList({ ...currentFilter, keyword: kw });
    }

    container.querySelector('#btn-summary').onclick = async () => {
        const res = await getWithdrawalSummary();
        const d = res.data || {};
        showModal({
            title: '提现汇总统计',
            content: `待审核：${d.pending || 0}<br/>已通过待打款：${d.approved || 0}<br/>已完成：${d.paid || 0}<br/>已驳回：${d.rejected || 0}`
        })
    }

    container.querySelector('#btn-reconciliation').onclick = async () => {
        const res = await getWithdrawalReconciliation();
        showModal({
            title: '对账明细',
            content: `<pre>${JSON.stringify(res.data, null, 2)}</pre>`
        })
    }

    loadList();
    return container;
}
