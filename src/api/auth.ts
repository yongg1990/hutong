import { request, apiCall } from './client';
import B from '@/utils/Secret/BigInt';
import R from '@/utils/Secret/RSA';

export interface LoginPayload {
  username: string;
  password: string;
  tenantId?: string;
}

export interface LoginResult {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    username: string;
    realName: string;
    roles: string[];
    tenantId: string;
    tenantName: string;
    permissions: string[];
  };
}

export interface LogoutResult {
  success: boolean;
  message: string;
}

// The backend login contract uses the legacy RSA/BigInt PKCS#1 v1.5 format.
B.setMaxDigits(129);
const loginRsaKey = new R.RSAKeyPair(
  '010001',
  '',
  'DBCC53814668BD44D2185B1195A00C5222DAB190AEF5397E6466918D560337ECA438CF8725BA35A2F38B79BC7C1A441ED610D361B990008A47B42633C23D6674DC8545032BF161B83FE0E1B7609D1A8DD72B23AEDC60830A1614D9A7D22A3419FC9616BA858FC9D2D4A390B6A4D3CE5488CAD6F4264A1412E5E30FF372C80515'
);

function encryptLoginPassword(password: string): string {
  return R.encryptedString(loginRsaKey, password);
}

/** Authentication API defined by Swagger /tenant-access/auth/*. */
export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResult> {
    // Authentication must be confirmed by the backend. Do not use apiCall's
    // offline fallback here, otherwise a failed login would create a local session.
    const response = await request.post<any>('/tenant-access/auth/login', {
      username: payload.username.trim(),
      password: encryptLoginPassword(payload.password)
    });
    const res = response?.data?.token ? response.data : response;
    const token = res?.token;
    if (!token) throw new Error('登录接口未返回有效 token，无法建立会话');

    const user = res?.user || {
      id: String(res?.userId || payload.username.trim()),
      username: payload.username.trim(),
      realName: payload.username.trim(),
      tenantId: String(res?.tenantId || payload.tenantId || 'TENANT-YN-DEMO'),
      tenantName: String(res?.tenantName || '云南省中药材全产业链协同示范联盟'),
      roles: ['ROLE_OPERATOR'],
      permissions: []
    };

    localStorage.setItem('weappauthorization', token);
    localStorage.setItem('tcmirp_token', token);
    localStorage.setItem('tcmirp_user', JSON.stringify(user));
    localStorage.setItem('tcmirp_tenant_id', user.tenantId);
    localStorage.setItem('tcmirp_tenant_name', user.tenantName);
    localStorage.setItem('tcmirp_session_source', 'backend');
    return { token, tokenType: 'Bearer', expiresIn: Number(res?.expiresIn || 86400), user };
  },

  async logout(): Promise<LogoutResult> {
    const token = localStorage.getItem('weappauthorization') || localStorage.getItem('tcmirp_token') || '';
    const res = await apiCall<LogoutResult>(
      request.post('/tenant-access/auth/logout', {}, { headers: { WeAppAuthorization: token } }),
      { success: true, message: '安全登出成功' },
      '用户退出登录'
    );
    ['weappauthorization', 'tcmirp_token', 'tcmirp_user', 'tcmirp_tenant_id', 'tcmirp_tenant_name', 'tcmirp_session_source'].forEach(k => localStorage.removeItem(k));
    return res;
  },

  async getCurrentUser(): Promise<any> {
    const cached = localStorage.getItem('tcmirp_user');
    if (!cached) return null;
    try { return JSON.parse(cached); } catch { return null; }
  }
};
