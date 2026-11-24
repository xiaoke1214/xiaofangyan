import { getReviewQueueDetail, decideReviewTask, getRejectionCodes, loadAudio, lockReviewTask, unlockReviewTask } from '../api.js';
import { showModal } from './Modal.js';
import { globalState, goReviewDetail } from '../main.js';

let currentQueueId = null;
let audioUrl = null;

export function renderReviewDetail(queueId) {
    currentQueueId = queueId;
    const container = document.createElement('div');
    container.className = 'page-section active';
    container.style.padding = '20px';

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom:20px;">
            <h2 style="margin:0;color:#2c4a36;font-weight:800;">审核任务 #${queueId}</h2>
            <button id="back-queue" style="padding:6px 14px;border:1px solid #ccc;background:#fff;border-radius:6px;cursor:pointer;">返回队列</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.04);">
                <h4 style="color:#2c4a36;margin-bottom:12px;">音频播放</h4>
                <audio id="audio-player" controls style="width:100%">
                <div id="audio-tip" style="margin-top:10px;color:#666;">加载音频...</div>
            </div>
            <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.04);">
                <h4 style="color:#2c4a36;margin-bottom:12px;">文本信息</h4>
                <div style="margin:8px 0;"><b>标准文本：</b><div id="text-standard"></div></div>
                <div style="margin:8px 0;"><b>方言文本：</b><div id="text-dialect"></div></div>
                <div style="margin:8px 0;"><b>ASR识别文本：</b><div id="text-asr"></div></div>
                <div style="margin:8px 0;"><b>质量分：</b><span id="score-quality"></span></div>
                <div style="margin:8px 0;"><b>风险分：</b><span id="score-risk"></span></div>
            </div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.04);margin-top:16px;">
            <h4 style="color:#2c4a36;margin-bottom:12px;">提交审核结果</h4>
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
                <label><input type="radio" name="result" value="pass"> 通过</label>
                <label><input type="radio" name="result" value="reject"> 驳回</label>
            </div>
            <div id="reject-wrap" style="display:none;">
                <p>驳回原因：</p>
                <select id="reject-code" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;"></select>
            </div>
            <textarea id="reject-desc" placeholder="补充说明（可选）" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;margin:10px 0;"></textarea>
            <button id="submit-decide" style="padding:8px 18px;border:none;background:#2c4a36;color:#fff;border-radius:6px;cursor:pointer;">提交结果</button>
        </div>
    `;

    // 返回队列 + 解锁
    container.querySelector('#back-queue').onclick = async () => {
        try {
            await unlockReviewTask(currentQueueId);
        } catch (e) {
            console.warn('解锁失败', e);
        }
        // 释放音频blob内存
        if(audioUrl) URL.revokeObjectURL(audioUrl);
        window.__routeMap['review-queue'].render();
    }

    // 单选切换
    const radios = container.querySelectorAll('input[name="result"]');
    const rejectWrap = container.querySelector('#reject-wrap');
    radios.forEach(rd => {
        rd.onchange = () => {
            rejectWrap.style.display = rd.value === 'reject' ? 'block' : 'none';
        }
    })

    // 提交审核
    container.querySelector('#submit-decide').onclick = async () => {
        const val = container.querySelector('input[name="result"]:checked')?.value;
        if(!val) return showModal('请选择审核结果！');
        const payload = {
            verdict: val
        }
        if(val === 'reject') {
            payload.rejection_code = container.querySelector('#reject-code').value;
            payload.rejection_note = container.querySelector('#reject-desc').value;
        }
        try {
            await decideReviewTask(queueId, payload);
            showModal('提交成功！');
            if(audioUrl) URL.revokeObjectURL(audioUrl);
            setTimeout(()=>{
                window.__routeMap['review-queue'].render();
            },1200)
        }catch(e){
            showModal('提交失败！');
        }
    }

    // 加载详情（先锁单！后端要求）
    loadDetail(container, queueId);
    return container;
}

async function loadDetail(container, qid) {
    // 审核员token
    const token = localStorage.getItem('reviewer_token');
    try {
        // 第一步：锁单
        await lockReviewTask(qid);
        // 第二步：拿详情
        const res = await getReviewQueueDetail(qid);
        const d = res.data;

        container.querySelector('#text-standard').innerText = d.standard_text || '-';
        container.querySelector('#text-dialect').innerText = d.dialect_text || '-';
        container.querySelector('#text-asr').innerText = d.asr_text || '-';
        container.querySelector('#score-quality').innerText = d.quality_score ?? '-';
        container.querySelector('#score-risk').innerText = d.risk_score ?? '-';

        // 加载音频
        if(d.recording_id) {
            const audioSrc = await loadAudio(d.recording_id, token);
            audioUrl = audioSrc;
            const audioEl = container.querySelector('#audio-player');
            audioEl.src = audioSrc;
            container.querySelector('#audio-tip').innerText = '音频加载完成';
        }else{
            container.querySelector('#audio-tip').innerText = '无音频';
        }

        // 驳回下拉选项
        const codeRes = await getRejectionCodes();
        const sel = container.querySelector('#reject-code');
        sel.innerHTML = '';
        (codeRes.data || []).forEach(item=>{
            const opt = document.createElement('option');
            opt.value = item.value;
            opt.innerText = item.label;
            sel.appendChild(opt);
        })
    }catch(e){
        console.error(e);
        showModal('加载详情或者锁单失败');
    }
}
