// src/modules/ReviewQueue.js 【审核员端：我的待审核队列】
import { getReviewQueue, lockReviewTask, getReviewQueueDetail, unlockReviewTask, decideReviewTask, getRejectionCodes } from '../api.js';
import { RegionSelect } from './RegionSelect.js';
import { showModal } from './Modal.js';

export function renderReviewQueue() {
    const container = document.createElement('div');
    container.className = 'page-section active';
    container.style.padding = '20px';

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2c4a36; font-weight: 800;">审核工作台 - 我的待审核语料</h2>
            <div id="audit-region-container"></div>
        </div>

        <div style="background:#fff;border-radius:8px;box-shadow:0 2px 8px #00000014;overflow:hidden;">
            <div style="padding:16px;border-bottom:1px solid #eee;display:flex;gap:12px;align-items:center;">
                <input id="search-keyword" placeholder="搜索语料ID" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;outline:none;">
                <button id="btn-search" style="padding:6px 14px;background:#2c4a36;color:#fff;border:none;border-radius:6px;cursor:pointer;">搜索</button>
            </div>
            <table style="width:100%;border-collapse:collapse;">
                <thead style="background:#f7f9f8;">
                    <tr>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">队列ID</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">所属区域</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">采集人</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">状态</th>
                        <th style="text-align:left;padding:12px 16px;border-bottom:1px solid #eee;">操作</th>
                    </tr>
                </thead>
                <tbody id="audit-table-body">
                    <tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">加载中...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    // 区域筛选
    const regionWrap = container.querySelector('#audit-region-container');
    RegionSelect(regionWrap, (regionId) => {
        loadList({ region_id: regionId });
    });

    const tbody = container.querySelector('#audit-table-body');
    const searchBtn = container.querySelector('#btn-search');
    const searchInput = container.querySelector('#search-keyword');
    let currentFilter = {};
    let activeQueueId = null;
    let audioObjectUrl = null;

    // 页面卸载自动解锁
    window.addEventListener('beforeunload', async () => {
        if (activeQueueId) await unlockReviewTask(activeQueueId);
    });

    async function loadList(filter = {}) {
        currentFilter = filter;
        tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">加载中...</td></tr>`;
        try {
            const res = await getReviewQueue(filter);
            const list = res.data || [];
            if (!list.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">暂无待审核任务</td></tr>`;
                return;
            }
            tbody.innerHTML = '';
            list.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';
                tr.innerHTML = `
                    <td style="padding:12px 16px;">${item.id}</td>
                    <td style="padding:12px 16px;">${item.region_name || '-'}</td>
                    <td style="padding:12px 16px;">${item.collector_name || '-'}</td>
                    <td style="padding:12px 16px;">${item.status_text || item.status}</td>
                    <td style="padding:12px 16px;">
                        <button data-qid="${item.id}" class="btn-start" style="padding:4px 10px;border:1px solid #2c4a36;color:#2c4a36;background:#fff;border-radius:4px;cursor:pointer;">开始审核</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // 绑定开始审核按钮
            container.querySelectorAll('.btn-start').forEach(btn => {
                btn.onclick = async () => {
                    const qid = btn.dataset.qid;
                    try {
                        // 第一步：锁单
                        await lockReviewTask(qid);
                        activeQueueId = qid;
                        // 第二步：拿详情
                        const detailRes = await getReviewQueueDetail(qid);
                        const detail = detailRes.data;
                        // 驳回选项
                        const rejectRes = await getRejectionCodes();
                        const rejectList = rejectRes.data || [];
                        const rejectOptions = rejectList.map(x => `<option value="${x.code}">${x.name}</option>`).join('');

                        showModal({
                            title: `语料审核 #${qid}`,
                            content: `
                                <div style="line-height:1.7;">
                                    <div><strong>区域：</strong>${detail.region_name || '-'}</div>
                                    <div><strong>采集人：</strong>${detail.collector_name || '-'}</div>
                                    <div><strong>标准文本：</strong>${detail.std_text || '-'}</div>
                                    <div><strong>方言文本：</strong>${detail.dialect_text || '-'}</div>
                                    <div><strong>ASR识别文本：</strong>${detail.asr_text || '-'}</div>
                                    <div><strong>质量分：</strong>${detail.quality_score ?? '-'}</div>
                                    <div><strong>风险分：</strong>${detail.risk_score ?? '-'}</div>
                                    <div style="margin:10px 0;">
                                        <audio id="review-audio" controls>
                                    </div>
                                    <div id="reject-wrap" style="display:none;margin:8px 0;">
                                        <label>驳回原因</label>
                                        <select id="reject-code">${rejectOptions}</select>
                                        <textarea id="reject-note" placeholder="补充说明" style="width:100%;margin-top:4px;"></textarea>
                                    </div>
                                    <div style="margin-top:12px;display:flex;gap:10px;">
                                        <button id="pass-btn" style="padding:4px 10px;background:#28a745;color:#fff;border:none;border-radius:4px;cursor:pointer;">通过</button>
                                        <button id="reject-btn" style="padding:4px 10px;background:#dc3545;color:#fff;border:none;border-radius:4px;cursor:pointer;">驳回</button>
                                        <button id="cancel-btn" style="padding:4px 10px;background:#999;color:#fff;border:none;border-radius:4px;cursor:pointer;">取消（解锁）</button>
                                    </div>
                                </div>
                            `
                        });

                        // 音频（后端音频接口就绪后再打开，现在注释）
                        // const token = localStorage.getItem('reviewer_token');
                        // audioObjectUrl = await loadAudio(detail.recording_id, token);
                        // document.getElementById('review-audio').src = audioObjectUrl;

                        // 按钮事件
                        document.getElementById('pass-btn').onclick = async () => {
                            await decideReviewTask(qid, { decision: "pass" });
                            alert("审核通过！");
                            activeQueueId = null;
                            if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
                            loadList(currentFilter);
                        };
                        document.getElementById('reject-btn').onclick = () => {
                            document.getElementById('reject-wrap').style.display = 'block';
                            document.getElementById('reject-btn').onclick = async () => {
                                const code = document.getElementById('reject-code').value;
                                const note = document.getElementById('reject-note').value;
                                await decideReviewTask(qid, { decision: "reject", reject_code: code, note });
                                alert("已驳回！");
                                activeQueueId = null;
                                if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
                                loadList(currentFilter);
                            }
                        };
                        document.getElementById('cancel-btn').onclick = async () => {
                            await unlockReviewTask(qid);
                            activeQueueId = null;
                            if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
                        };
                    } catch (err) {
                        alert('操作失败：' + err.message);
                    }
                }
            })
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding:20px;text-align:center;color:red;">加载失败：${err.message}</td></tr>`;
        }
    }

    // 搜索
    searchBtn.onclick = () => {
        const kw = searchInput.value.trim();
        loadList({ ...currentFilter, keyword: kw });
    }
    searchInput.onkeydown = (e) => {
        if (e.key === 'Enter') searchBtn.click();
    }

    loadList();
    return container;
}
