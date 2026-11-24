// src/modules/Wallet.js 审核员钱包收益
import { getWalletMe, getWalletTransactions } from '../api.js';
import { showModal } from './Modal.js';

export function renderWallet() {
    const container = document.createElement('div');
    container.className = 'page-section active';
    container.style.padding = '20px';

    container.innerHTML = `
        <h2 style="margin:0 0 20px 0;color:#2c4a36;font-weight:800;">我的钱包</h2>
        <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.04);margin-bottom:16px;">
            <h4 style="color:#2c4a36;margin:0 0 8px 0;">可用积分</h4>
            <div style="font-size:24px;font-weight:bold;" id="wallet-balance">--</div>
            <div style="color:#666;font-size:14px;margin-top:4px;">单位：积分，1积分 = 0.01元</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.04);">
            <h4 style="color:#2c4a36;margin:0 0 12px 0;">收益流水</h4>
            <table style="width:100%;border-collapse: collapse;">
                <thead>
                    <tr style="background:#f6f8f7;">
                        <th style="text-align:left;padding:12px;border-bottom:1px solid #eee;">时间</th>
                        <th style="text-align:left;padding:12px;border-bottom:1px solid #eee;">类型</th>
                        <th style="text-align:left;padding:12px;border-bottom:1px solid #eee;">积分变动</th>
                        <th style="text-align:left;padding:12px;border-bottom:1px solid #eee;">备注</th>
                    </tr>
                </thead>
                <tbody id="wallet-table-body">
                    <tr><td colspan="4" style="text-align:center;padding:20px;color:#999;">加载中……</td></tr>
                </tbody>
            </table>
        </div>
    `;

    const tbody = container.querySelector('#wallet-table-body');
    const balanceDom = container.querySelector('#wallet-balance');

    async function loadData() {
        try {
            const resMe = await getWalletMe();
            if(resMe.code === 0) {
                balanceDom.innerText = resMe.data.available_points;
            }
            const resTrans = await getWalletTransactions();
            if(resTrans.code !== 0) throw new Error(resTrans.message);
            const list = resTrans.data?.list || [];
            if(list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#999;">暂无流水</td></tr>`;
                return;
            }
            tbody.innerHTML = list.map(item=>`
                <tr>
                    <td style="padding:12px;border-bottom:1px solid #eee;">${item.created_at}</td>
                    <td style="padding:12px;border-bottom:1px solid #eee;">${item.type}</td>
                    <td style="padding:12px;border-bottom:1px solid #eee;">${item.point_change}</td>
                    <td style="padding:12px;border-bottom:1px solid #eee;">${item.note || '-'}</td>
                </tr>
            `).join('');
        } catch(e) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:red;">加载失败</td></tr>`;
            console.error(e);
        }
    }
    loadData();
    return container;
}
