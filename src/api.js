// src/api.js
const BASE_URL = 'https://noncondensible-emanatively-dalilah.ngrok-free.dev/api/v1';

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...options.headers,
  };

  // 区分两套token：admin_token 管理员，reviewer_token 审核员
  let token;
  if (path.startsWith('/admin/')) {
    token = localStorage.getItem('admin_token');
  } else {
    token = localStorage.getItem('reviewer_token');
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let url = `${BASE_URL}${path}`;
  // params 自动拼接url参数
  if (options.params) {
    const search = new URLSearchParams(options.params).toString();
    if (search) {
      url += (url.includes('?') ? '&' : '?') + search;
    }
    delete options.params;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
    // 捕获 ngrok 拦截页 (HTML)
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.error('[API] 拦截/非json返回，status:', response.status);
      throw new Error('ngrok安全拦截，接口无法访问');
    }

    const data = await response.json();

    // 401 未授权 / Token过期
    if (response.status === 401 || data.code === 10104) {
      console.warn('[API] Token失效 401');
      if (path.startsWith('/admin/')) {
        localStorage.removeItem('admin_token');
      } else {
        localStorage.removeItem('reviewer_token');
      }
      alert('登录已过期，请重新登录');
      window.location.reload();
      return;
    }
    
    return data;
  } catch (error) {
    console.error('网络请求错误:', error);
    throw error;
  }
}

// ===================== ✅ 1. 基础与登录 =====================
export const login = (phone, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) });

// ===================== ✅ 2. 数据看板 =====================
export const getDashboardStats = (params) => request('/admin/dashboard/stats', { params });

// ===================== ✅ 3. 用户管理 =====================
export const getUserList = (params) => request('/admin/users', { params });
export const getUserProfile = (userId) => request(`/admin/users/${userId}/profile`);
export const getUserRoles = (userId) => request(`/admin/users/${userId}/roles`);
export const setUserRoles = (userId, body) => request(`/admin/users/${userId}/roles`, { method: 'POST', body: JSON.stringify(body) });
export const deleteUserRole = (userId, roleId) => request(`/admin/users/${userId}/roles/${roleId}`, { method: 'DELETE' });
export const patchUserStatus = (userId, body) => request(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify(body) });

// ===================== ✅ 4. 任务包管理 =====================
export const getPackages = (params) => request('/admin/packages', { params });
export const updatePackage = (id, body) => request(`/admin/packages/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const publishPackage = (id) => request(`/admin/packages/${id}/publish`, { method: 'POST' });
export const pausePackage = (id) => request(`/admin/packages/${id}/pause`, { method: 'POST' });

// ===================== ✅ 5. 提现管理 =====================
export const getWithdrawals = (params) => request('/admin/withdrawals', { params });
export const approveWithdrawal = (id) => request(`/admin/withdrawals/${id}/approve`, { method: 'POST' });
export const payWithdrawal = (id) => request(`/admin/withdrawals/${id}/pay`, { method: 'POST' });
export const rejectWithdrawal = (id, reason) => request(`/admin/withdrawals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
export const getWithdrawalSummary = () => request('/admin/withdrawals/summary');
export const getWithdrawalReconciliation = () => request('/admin/withdrawals/reconciliation');
export const getRewardRules = () => request('/admin/system/reward-rules');

// ===================== ✅ 6. 数据集与模型管理 =====================
export const getDatasets = (params) => request('/admin/datasets', { params });
export const getAIModels = (params) => request('/admin/ai-models', { params });
export const toggleAiModel = (id) => request(`/admin/ai-models/${id}/toggle`, { method: 'POST' });

// ===================== ✅ 7. 管理员审核队列 =====================
export const getAdminReviewQueue = (params) => request('/admin/review/queue', { params });
export const getAdminReviewQueueDetail = (queueId) => request(`/admin/review/queue/${queueId}/detail`);
export const assignReviewTask = (queueId, assigned_to) => request(`/admin/review/queue/${queueId}/assign`, { method: 'POST', body: JSON.stringify({ assigned_to }) });

// ===================== ✅ 8. 审核员端接口 =====================
export const getReviewQueue = (params) => request('/review/queue', { params });
export const lockReviewTask = (queueId, ttl = 600) => request(`/review/queue/${queueId}/lock`, { method: 'POST', body: JSON.stringify({ ttl }) });
export const unlockReviewTask = (queueId) => request(`/review/queue/${queueId}/unlock`, { method: 'POST' });
export const getReviewQueueDetail = (queueId) => request(`/review/queue/${queueId}/detail`);
export const decideReviewTask = (queueId, body) => request(`/review/queue/${queueId}/decide`, { method: 'POST', body: JSON.stringify(body) });
export const getRejectionCodes = () => request('/review/rejection-codes');
export const getWalletMe = () => request('/wallet/me');
export const getWalletTransactions = () => request('/wallet/transactions');

// ===================== ⚠️ 9. 假数据/兜底接口 =====================
// 区域下拉数据（前端写死，后端暂不提供接口）
export const getRegions = () => Promise.resolve({ data: [] });

// ===================== 🔊 10. 音频加载 =====================
export async function loadAudio(recordingId, token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'ngrok-skip-browser-warning': '1',
  };
  const res = await fetch(`${BASE_URL}/review/recordings/${recordingId}/play`, { headers });
  const { data } = await res.json();
  const audioRes = await fetch(data.url, { headers: { 'ngrok-skip-browser-warning': '1' } });
  const blob = await audioRes.blob();
  return URL.createObjectURL(blob);
}

// ===================== 🔄 11. 终极兼容别名（完美解决页面报错） =====================
// 因为你的不同页面里 import 的名字五花八门，这里全部给它们做个指向
export const getWithdrawalList = getWithdrawals; // WithdrawManage.js 用
export const toggleAIModel = toggleAiModel;      // SystemManage.js 用 (注意大小写)
export const getReviewDetail = getReviewQueueDetail; // 审核员端可能用
export const getAIModelsList = getAIModels;      // 兜底别名