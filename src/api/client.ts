import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { ElNotification } from 'element-plus';

// Default Swagger base endpoint provided: http://192.168.1.39:8900/api/tcmirp
export const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/tcmirp';
export const SWAGGER_DOC_URL = 'http://192.168.1.39:8900/api/tcmirp/swagger-ui/index.html#/';

// Local state for backend connection status
export interface ApiStatus {
  baseUrl: string;
  isOnline: boolean;
  checkedAt: string;
  lastError?: string;
  swaggerDocUrl: string;
}

const savedBase = localStorage.getItem('tcmirp_api_base') || DEFAULT_API_BASE;

export const apiStatus = {
  baseUrl: savedBase,
  isOnline: false,
  checkedAt: '',
  lastError: undefined as string | undefined,
  swaggerDocUrl: SWAGGER_DOC_URL
};

// Create Axios Instance
export const request = axios.create({
  baseURL: apiStatus.baseUrl,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Keep calls aligned with the currently published Swagger contract. The UI has
// additional offline/demo views whose endpoints are not present in this backend;
// those calls intentionally fall through to apiCall's local fallback.
const swaggerEndpointPatterns: Array<{ method: string; pattern: RegExp }> = [
  { method: 'POST', pattern: /^\/tenant-access\/auth\/(login|logout)$/ },
  { method: 'GET', pattern: /^\/tenant-access\/(tenants|users|permissions)$/ },
  { method: 'POST', pattern: /^\/tenant-access\/(tenants|users|permissions)$/ },
  { method: 'GET', pattern: /^\/tenant-access\/tenants\/\d+$/ },
  { method: 'POST', pattern: /^\/tenant-access\/tenants\/\d+\/update$/ },
  { method: 'GET', pattern: /^\/tenant-access\/tenants\/\d+\/delete$/ },
  { method: 'POST', pattern: /^\/tenant-access\/users\/\d+\/roles$/ },
  { method: 'GET', pattern: /^\/tenant-access\/users\/\d+\/roles\/\d+\/delete$/ },
  { method: 'POST', pattern: /^\/tenant-access\/roles\/tenant$/ },
  { method: 'POST', pattern: /^\/tenant-access\/roles\/\d+\/permissions$/ },
  { method: 'POST', pattern: /^\/tenant-access\/permissions\/\d+\/update$/ },
  { method: 'GET', pattern: /^\/tenant-access\/permissions\/\d+\/delete$/ },
  { method: 'POST', pattern: new RegExp('^/openapi/v1/(trace-codes|source-systems|raw-records|parties|mappings/test|identifiers-resolve|identifier-bindings|event-fact/events|event-fact/config/schemas|event-fact/config/schemas/test|event-fact/config/event-types|decoction-piece-products|business-objects|batches)$') },
  { method: 'POST', pattern: /^\/openapi\/v1\/raw-records\/\d+\/replays$/ },
  { method: 'POST', pattern: new RegExp('^/openapi/v1/event-fact/config/schemas/[^/]+/[^/]+/publish$') },
  { method: 'GET', pattern: new RegExp('^/openapi/v1/event-fact/schemas/[^/]+/[^/]+$') },
  { method: 'GET', pattern: new RegExp('^/openapi/v1/event-fact/events/[0-9]+$') },
  { method: 'POST', pattern: new RegExp('^/admin/v1/(project-spaces|deployment-instances)$') },
  { method: 'GET', pattern: new RegExp('^/admin/v1/(project-spaces|deployment-instances)/[0-9]+$') }
];

// Request Interceptor
request.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  const rawUrl = String(config.url || '').split('?')[0];
  if (!swaggerEndpointPatterns.some(item => item.method === method && item.pattern.test(rawUrl))) {
    return Promise.reject(Object.assign(new Error('该接口未在当前 Swagger 文档发布，已使用本地演示数据'), { code: 'UNSUPPORTED_ENDPOINT' }));
  }
  // Retrieve token from weappauthorization or tcmirp_token
  const token = localStorage.getItem('weappauthorization') || localStorage.getItem('tcmirp_token');

  // Inject multi-tenant, context and weappauthorization headers
  const tenantId = localStorage.getItem('tcmirp_tenant_id') || 'TENANT-YN-DEMO';
  const projectId = localStorage.getItem('tcmirp_project_id') || 'PRJ-YN-TCM-2026';

  if (config.headers) {
    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('X-Tenant-Id', tenantId);
      (config.headers as any).set('X-Project-Id', projectId);
      (config.headers as any).set('X-Request-Id', `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
      // 登录后如果有token，在请求头自动带上 weappauthorization
      if (token) {
        (config.headers as any).set('weappauthorization', token);
        (config.headers as any).set('WeAppAuthorization', token);
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      }
    } else {
      (config.headers as any)['X-Tenant-Id'] = tenantId;
      (config.headers as any)['X-Project-Id'] = projectId;
      (config.headers as any)['X-Request-Id'] = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      if (token) {
        (config.headers as any)['weappauthorization'] = token;
        (config.headers as any)['WeAppAuthorization'] = token;
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor
request.interceptors.response.use((response: AxiosResponse) => {
  apiStatus.isOnline = true;
  apiStatus.checkedAt = new Date().toLocaleTimeString();
  apiStatus.lastError = undefined;

  // If backend returns standard envelope { code: 200, data: ..., message: "..." }
  const res = response.data;
  if (res && typeof res === 'object' && 'code' in res) {
    // 401/403: Token invalid or expired, clear and return to login
    if (res.code === 401 || res.code === '401' || res.code === 403 || res.code === '403') {
      localStorage.removeItem('weappauthorization');
      localStorage.removeItem('tcmirp_token');
      localStorage.removeItem('tcmirp_user');
      localStorage.removeItem('tcmirp_session_source');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${redirectUrl}`;
      }
      const authError = Object.assign(new Error(res.message || '登录令牌已失效，请重新登录'), {
        response: { status: Number(res.code) }
      });
      return Promise.reject(authError);
    }

    if (res.code === 200 || res.code === 0 || res.code === '0' || res.code === '200') {
      return res.data !== undefined ? res.data : res;
    }
    // Business error returned by backend
    ElNotification({
      title: '接口业务提示',
      message: res.message || '请求处理异常',
      type: 'warning',
      duration: 4000
    });
    return Promise.reject(new Error(res.message || 'API Error'));
  }
  return res;
}, (error) => {
  apiStatus.checkedAt = new Date().toLocaleTimeString();
  apiStatus.lastError = error.message || '网络连接超时或无法触达后端服务';
  
  // Handle HTTP 401 / 403
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    localStorage.removeItem('weappauthorization');
    localStorage.removeItem('tcmirp_token');
    localStorage.removeItem('tcmirp_user');
    localStorage.removeItem('tcmirp_session_source');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirectUrl}`;
    }
  }

  // Do not crash the app, bubble error for caller fallback
  return Promise.reject(error);
});

// Safe API Call with Automatic Mock Fallback for Intranet/Offline Dev environments
export async function apiCall<T>(
  requestPromise: Promise<any>,
  fallbackData: T,
  actionName?: string
): Promise<T> {
  try {
    const result = await requestPromise;
    apiStatus.isOnline = true;
    return result as T;
  } catch (err: any) {
    // 401 Unauthorized token expired
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      throw err;
    }

    // A local/demo-only page intentionally has no endpoint in the current
    // Swagger document; this is not evidence that the backend is offline.
    if (err?.code === 'UNSUPPORTED_ENDPOINT') {
      return fallbackData;
    }

    apiStatus.isOnline = false;
    // Log friendly guidance if intranet IP is unreachable
    console.warn(`[TCMIRP API] 接口调用未能直连后端 (${apiStatus.baseUrl}${actionName ? ` - ${actionName}` : ''})，已自动使用基准数据保障系统持续运行。`, err);
    return fallbackData;
  }
}

// Check backend connectivity to Swagger/Health API
export async function checkBackendHealth(): Promise<boolean> {
  try {
    // Try pinging Swagger docs or health endpoint
    await axios.get(`${apiStatus.baseUrl}/v3/api-docs`, { timeout: 3000 });
    apiStatus.isOnline = true;
    apiStatus.lastError = undefined;
    apiStatus.checkedAt = new Date().toLocaleTimeString();
    return true;
  } catch {
    try {
      await axios.get(`${apiStatus.baseUrl}/health`, { timeout: 2000 });
      apiStatus.isOnline = true;
      apiStatus.lastError = undefined;
      apiStatus.checkedAt = new Date().toLocaleTimeString();
      return true;
    } catch (e: any) {
      apiStatus.isOnline = false;
      apiStatus.lastError = e.message || '连接失败';
      apiStatus.checkedAt = new Date().toLocaleTimeString();
      return false;
    }
  }
}

// Update Base URL
export function setApiBaseUrl(newUrl: string) {
  apiStatus.baseUrl = newUrl;
  request.defaults.baseURL = newUrl;
  localStorage.setItem('tcmirp_api_base', newUrl);
}
