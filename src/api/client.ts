import axios, { type AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import { reactive } from 'vue';
import { isStaticMode } from '../stores/demoStore';
import { staticAdapter } from './staticAdapter';
import { isConnectableEndpoint } from '../config/apiContract';

// Default requests use the local proxy for the documented intranet API.
export const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/tcmirp';
export const SWAGGER_DOC_URL = 'http://192.168.1.39/api/tcmirp/swagger-ui/index.html#/';

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

export const queryActivity = reactive({ pending: 0, visible: false });
const activeQueries = new WeakSet<object>();
let queryVisibleSince = 0;
let hideQueryTimer: ReturnType<typeof setTimeout> | undefined;

const beginQuery = (config: object) => {
  if (hideQueryTimer) clearTimeout(hideQueryTimer);
  hideQueryTimer = undefined;
  if (queryActivity.pending === 0) queryVisibleSince = Date.now();
  activeQueries.add(config);
  queryActivity.pending++;
  if (!queryActivity.visible) {
    queryActivity.visible = true;
  }
};

const finishQuery = (config?: object) => {
  if (!config || !activeQueries.delete(config)) return;
  queryActivity.pending--;
  if (queryActivity.pending === 0) {
    hideQueryTimer = setTimeout(() => {
      if (queryActivity.pending === 0) queryActivity.visible = false;
      hideQueryTimer = undefined;
    }, Math.max(0, 500 - (Date.now() - queryVisibleSince)));
  }
};


// Request Interceptor
request.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  const rawUrl = String(config.url || '').split('?')[0];
  const connectable = isConnectableEndpoint(method, rawUrl);
  if (isStaticMode() && !connectable) {
    config.adapter = staticAdapter;
    if (method === 'GET') beginQuery(config);
    return config;
  }
  if (!connectable) {
    return Promise.reject(Object.assign(new Error('该接口所属分组未标注“可对接”，当前不进行后端调用'), { code: 'UNSUPPORTED_ENDPOINT' }));
  }
  if (method === 'GET') beginQuery(config);
  // Retrieve token from weappauthorization or tcmirp_token
  const isLogin = rawUrl === '/tenant-access/auth/login';
  const token = isLogin ? null : localStorage.getItem('weappauthorization') || localStorage.getItem('tcmirp_token');

  // Inject multi-tenant, context and weappauthorization headers
  const storedTenantId = isLogin ? null : String(config.headers?.['X-Tenant-Id'] || localStorage.getItem('tcmirp_tenant_id') || '');
  const storedProjectId = isLogin ? null : localStorage.getItem('tcmirp_project_space_id') || localStorage.getItem('tcmirp_project_id');
  const storedSourceSystemId = isLogin ? null : localStorage.getItem('tcmirp_source_system_id');
  const tenantId = storedTenantId && /^\d+$/.test(storedTenantId) ? storedTenantId : undefined;
  const projectId = storedProjectId && /^\d+$/.test(storedProjectId) ? storedProjectId : undefined;
  const sourceSystemId = storedSourceSystemId && /^\d+$/.test(storedSourceSystemId) ? storedSourceSystemId : undefined;

  if (config.headers) {
    if (typeof (config.headers as any).set === 'function') {
      if (tenantId) (config.headers as any).set('X-Tenant-Id', tenantId);
      if (projectId) {
        (config.headers as any).set('X-Project-Id', projectId);
        (config.headers as any).set('X-Project-Space-Id', projectId);
      }
      if (sourceSystemId) (config.headers as any).set('X-Source-System-Id', sourceSystemId);
      (config.headers as any).set('X-Request-Id', `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
      // 登录后如果有token，在请求头自动带上 weappauthorization
      if (token) {
        (config.headers as any).set('weappauthorization', token);
        (config.headers as any).set('WeAppAuthorization', token);
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      }
    } else {
      if (tenantId) (config.headers as any)['X-Tenant-Id'] = tenantId;
      if (projectId) {
        (config.headers as any)['X-Project-Id'] = projectId;
        (config.headers as any)['X-Project-Space-Id'] = projectId;
      }
      if (sourceSystemId) (config.headers as any)['X-Source-System-Id'] = sourceSystemId;
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
  finishQuery(response.config);
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
        response: { status: Number(res.code) },
        businessMessage: res.message
      });
      Object.assign(authError, { config: response.config });
      return Promise.reject(authError);
    }

    if (res.code === 200 || res.code === 0 || res.code === '0' || res.code === '200') {
      return res.data !== undefined ? res.data : res;
    }
    return Promise.reject(Object.assign(new Error(res.message || 'API Error'), { businessMessage: res.message, config: response.config }));
  }
  return res;
}, (error) => {
  finishQuery(error?.config);
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

export function apiErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: unknown }; businessMessage?: unknown } | null;
  const data = err?.response?.data;
  const body = typeof data === 'string' ? (() => {
    try { return JSON.parse(data); } catch { return null; }
  })() : data;
  const message = (body && typeof body === 'object' && 'message' in body ? body.message : undefined)
    ?? err?.businessMessage
    ?? (error instanceof Error ? error.message : undefined);
  return typeof message === 'string' && message.trim() ? message.trim() : fallback;
}

// Local-only pages may retain reference data; real API failures must propagate.
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
    // Calls in connectable groups must report real failures, never mock success.
    if (err?.config && isConnectableEndpoint(err.config.method || 'GET', String(err.config.url || ''))) throw err;
    if (isStaticMode()) throw err;
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      throw err;
    }

    // A local/demo-only page intentionally has no endpoint in the current
    // Swagger document; this is not evidence that the backend is offline.
    if (err?.code === 'UNSUPPORTED_ENDPOINT') {
      return fallbackData;
    }

    apiStatus.isOnline = false;
    if (err?.response || err?.businessMessage) {
      ElMessage.error(apiErrorMessage(err, actionName ? `${actionName}失败` : '请求失败'));
    }

    throw err;
  }
}

// Check backend connectivity to Swagger/Health API
export async function checkBackendHealth(): Promise<boolean> {
  if (isStaticMode()) return true;
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
