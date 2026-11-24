// src/modules/Dashboard.js
import { getDashboardStats } from '../api.js';
import { RegionSelect } from './RegionSelect.js';

export function renderDashboard() {
    const container = document.createElement('div');
    container.className = 'page-section active';
    container.style.padding = '20px';
    
    container.innerHTML = `
        <style>
            .my-dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            .my-dashboard-title { margin: 0; color: #2c4a36; font-size: 22px; font-weight: 700; }
            .my-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
            .my-card { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); text-align: center; border: 1px solid #eef2f0; transition: transform 0.2s, box-shadow 0.2s; }
            .my-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(94, 140, 114, 0.15); }
            .my-card h3 { margin: 0 0 12px 0; font-size: 14px; color: #7a8f82; font-weight: 500; }
            .my-card .number { font-size: 32px; font-weight: 800; color: #3a6b4c; }
            .my-table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); padding: 24px; border: 1px solid #eef2f0; }
            .my-table-title { font-size: 16px; font-weight: 700; color: #2c4a36; margin-bottom: 16px; }
            .my-table { width: 100%; border-collapse: collapse; text-align: left; }
            .my-table th { padding: 14px; background: #f8faf9; color: #5E8C72; font-weight: 600; font-size: 14px; border-bottom: 2px solid #eef2f0; }
            .my-table td { padding: 14px; border-bottom: 1px solid #eef2f0; color: #333; font-size: 14px; }
            .my-table tr:last-child td { border-bottom: none; }
            .tag-warn { background: #fdf6ec; color: #e6a23c; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .tag-danger { background: #fef0f0; color: #f56c6c; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .tag-ok { background: #f0f9eb; color: #67c23a; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        </style>

        <div class="my-dashboard-header">
            <h2 class="my-dashboard-title">数据看板</h2>
            <div id="region-container"></div>
        </div>
        
        <div class="my-grid">
            <div class="my-card"><h3>今日采集量</h3><div class="number" id="stat-today">--</div></div>
            <div class="my-card"><h3>累计语料数</h3><div class="number" id="stat-total">--</div></div>
            <div class="my-card"><h3>活跃用户数</h3><div class="number" id="stat-users">--</div></div>
            <div class="my-card"><h3>数据合格率</h3><div class="number" id="stat-rate">--</div></div>
        </div>
        
        <div class="my-table-card">
            <div class="my-table-title">待处理业务概览</div>
            <table class="my-table">
                <thead>
                    <tr><th>业务类型</th><th>待处理数量</th><th>状态</th></tr>
                </thead>
                <tbody>
                    <tr><td>待审核语音</td><td id="stat-pending-audio" style="font-weight:bold;">--</td><td><span class="tag-warn">需尽快处理</span></td></tr>
                    <tr><td>待审核提现</td><td id="stat-pending-money" style="font-weight:bold;">--</td><td><span class="tag-danger">需人工审核</span></td></tr>
                    <tr><td>AI服务异常</td><td id="stat-ai-error" style="font-weight:bold;">0 次</td><td><span class="tag-ok" id="stat-ai-status">正常</span></td></tr>
                </tbody>
            </table>
        </div>
    `;

    // 初始化区域组件（这里已经改了 .element）
    const regionSelect = RegionSelect((regionId) => {
        fetchStats(regionId);
    });
    container.querySelector('#region-container').appendChild(regionSelect.element);

    async function fetchStats(regionId = '') {
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        try {
            setText('stat-today', '...');
            const res = await getDashboardStats({ region_id: regionId });
            
            if ((res.code === 0 || res.code === 200) && res.data) {
                const data = res.data;
                const formatNum = (num) => (num || 0).toLocaleString();
                
                setText('stat-today', formatNum(data.recordings_today));
                setText('stat-total', formatNum(data.total_recordings));
                setText('stat-users', formatNum(data.active_users));
                
                const rate = data.approval_rate_pct !== null ? Number(data.approval_rate_pct).toFixed(1) : '0.0';
                setText('stat-rate', `${rate}%`);

                setText('stat-pending-audio', (data.pending_reviews || 0) + ' 条');
                setText('stat-pending-money', (data.pending_withdrawals || 0) + ' 笔');
                
                const aiError = data.ai_service_error_count || 0;
                setText('stat-ai-error', aiError + ' 次');
                
                const aiStatusEl = document.getElementById('stat-ai-status');
                if (aiStatusEl) {
                    if (aiError > 0) {
                        aiStatusEl.innerText = '异常';
                        aiStatusEl.className = 'tag-danger';
                    } else {
                        aiStatusEl.innerText = '正常';
                        aiStatusEl.className = 'tag-ok';
                    }
                }
            }
        } catch (error) {
            console.error('加载看板数据异常:', error);
            setText('stat-today', '加载失败');
        }
    }

    fetchStats('');
    return container;
}