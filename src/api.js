// src/api.js
const BASE_URL = '/api/v1';

export async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };

  const token = localStorage.getItem('admin_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(url, { ...options, headers });
    
    // 先读取 text 防止 ngrok 返回 HTML 导致 JSON.parse 报错
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('后端返回的不是 JSON，可能是 ngrok 拦截了：', text);
      throw new Error('接口返回格式错误');
    }

    if (data.code === 10104 || response.status === 401) {
      console.warn('Token 失效，请重新登录');
      localStorage.removeItem('admin_token');
      alert('登录已过期，请重新登录');
      window.location.reload(); 
    }
    return data;
  } catch (error) {
    console.error('网络请求错误:', error);
    throw error;
  }
}

export const login = (phone, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) });
export const getDashboardStats = () => request('/admin/dashboard/stats');
export const getUserList = () => request('/admin/users');
export const getPackages = () => request('/admin/packages');
export const publishPackage = (id) => request(`/admin/packages/${id}/publish`, { method: 'POST' });
export const pausePackage = (id) => request(`/admin/packages/${id}/pause`, { method: 'POST' });
export const getReviewQueue = () => request('/admin/review/queue');
export const submitReviewDecision = (queueId, decisionData) => request(`/admin/review/queue/${queueId}/decide`, { method: 'POST', body: JSON.stringify(decisionData) });
export const getWithdrawalList = () => request('/admin/withdrawals');
export const approveWithdrawal = (id) => request(`/admin/withdrawals/${id}/approve`, { method: 'POST' });
export const payWithdrawal = (id) => request(`/admin/withdrawals/${id}/pay`, { method: 'POST' });
export const rejectWithdrawal = (id, reason) => request(`/admin/withdrawals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });