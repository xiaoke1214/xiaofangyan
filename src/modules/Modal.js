// src/modules/Modal.js
export function showModal(title, contentHTML, onConfirm) {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex; justify-content: center; align-items: center;
        z-index: 9999; opacity: 0; transition: opacity 0.3s ease;
    `;

    // 创建弹窗主体
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: #ffffff;
        width: 480px; max-width: 90%;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        transform: translateY(20px); transition: all 0.3s ease;
        overflow: hidden;
        font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    `;

    modal.innerHTML = `
        <div style="padding: 20px 24px; border-bottom: 1px solid #eef2f0; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 18px; color: #2c4a36; font-weight: 700;">${title}</h3>
            <button id="modal-close-btn" style="background: none; border: none; font-size: 20px; color: #999; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 24px; max-height: 60vh; overflow-y: auto;">
            ${contentHTML}
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid #eef2f0; display: flex; justify-content: flex-end; gap: 12px; background: #f8faf9;">
            <button id="modal-cancel-btn" style="padding: 8px 20px; border: 1px solid #d1ded7; background: #fff; color: #666; border-radius: 6px; cursor: pointer; font-weight: 500;">取消</button>
            <button id="modal-confirm-btn" style="padding: 8px 20px; border: none; background: #5E8C72; color: #fff; border-radius: 6px; cursor: pointer; font-weight: 500; box-shadow: 0 4px 12px rgba(94, 140, 114, 0.3);">确定</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 触发动画
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'translateY(0)';
    });

    // 关闭函数
    const close = () => {
        overlay.style.opacity = '0';
        modal.style.transform = 'translateY(20px)';
        setTimeout(() => { if (document.body.contains(overlay)) document.body.removeChild(overlay); }, 300);
    };

    // 绑定事件
    modal.querySelector('#modal-close-btn').onclick = close;
    modal.querySelector('#modal-cancel-btn').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    modal.querySelector('#modal-confirm-btn').onclick = () => {
        if (typeof onConfirm === 'function') {
            const isClose = onConfirm();
            if (isClose !== false) close();
        } else {
            close();
        }
    };

    return modal;
}