// src/modules/Login.js
import { login } from '../api.js';

export function renderLogin(onSuccess) {
    const container = document.createElement('div');
    container.id = 'login-page';
    
    container.style.cssText = `
        display: flex; 
        justify-content: center; 
        align-items: center; 
        min-height: 100vh; 
        background: linear-gradient(135deg, #1e3c2b 0%, #3a6b4c 50%, #5E8C72 100%);
        font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    `;

    container.innerHTML = `
        <style>
            .glass-login-box {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                padding: 45px 40px;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
                width: 380px;
                transition: transform 0.3s ease;
            }
            .glass-login-box:hover { transform: translateY(-5px); }
            .login-title { text-align: center; color: #2c4a36; font-size: 28px; font-weight: 800; letter-spacing: 2px; margin-bottom: 5px; }
            .login-subtitle { text-align: center; color: #7a8f82; margin-bottom: 30px; font-size: 14px; letter-spacing: 1px; }
            .custom-auth-tab { text-align: center; padding-bottom: 10px; font-weight: bold; color: #5E8C72; border-bottom: 2px solid #5E8C72; font-size: 16px; width: 60px; margin: 0 auto 30px auto; }
            .custom-input { width: 100%; box-sizing: border-box; padding: 14px 16px; border: 1px solid #d1ded7; border-radius: 8px; outline: none; background-color: #f8faf9; font-size: 15px; transition: all 0.3s; margin-bottom: 18px; }
            .custom-input:focus { border-color: #5E8C72; background-color: #fff; box-shadow: 0 0 0 3px rgba(94, 140, 114, 0.2); }
            .custom-btn { width: 100%; background: linear-gradient(135deg, #5E8C72 0%, #4a735b 100%); color: white; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; transition: all 0.3s; box-shadow: 0 4px 12px rgba(94, 140, 114, 0.3); }
            .custom-btn:hover { background: linear-gradient(135deg, #4a735b 0%, #3a5c49 100%); box-shadow: 0 6px 16px rgba(94, 140, 114, 0.4); transform: translateY(-1px); }
            .custom-btn:active { transform: translateY(1px); }
        </style>

        <div class="glass-login-box">
            <h2 class="login-title">乡语智库</h2>
            <p class="login-subtitle">智能平台</p>
            <div class="custom-auth-tab">登录</div>
            <div>
                <input type="text" id="login-phone" class="custom-input" placeholder="请输入手机号">
                <input type="password" id="login-password" class="custom-input" placeholder="请输入密码">
                <button id="login-btn" class="custom-btn">登 录</button>
            </div>
        </div>
    `;

    const btn = container.querySelector('#login-btn');
    btn.onclick = async () => {
        const phone = container.querySelector('#login-phone').value.trim();
        const password = container.querySelector('#login-password').value.trim();

        if (!phone || !password) {
            return alert('请输入账号和密码');
        }

        // 1. 开启转圈
        btn.innerText = '安全登录中...';
        btn.disabled = true;
        btn.style.opacity = '0.8';

        // 2. 设置 10 秒防死锁安全计时器
        const timeoutId = setTimeout(() => {
            btn.innerText = '登 录';
            btn.disabled = false;
            btn.style.opacity = '1';
            alert('登录超时！后端服务无响应，请检查 ngrok 或 Flask 是否开启。');
        }, 10000);

        try {
            const res = await login(phone, password);
            clearTimeout(timeoutId); // 如果请求回来了，立刻清除安全计时器
            console.log('登录接口返回:', res);

            if (res.code === 0 && res.data?.access_token) {
                const userInfo = res.data.user;
                onSuccess(res.data.access_token, userInfo);
            } else {
                alert(res.message || '登录失败，请检查账号密码');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('登录请求异常:', error);
            alert('网络请求异常，请确认后端是否存活');
        } finally {
            btn.innerText = '登 录';
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    };

    container.querySelector('#login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btn.click();
    });

    return container;
}