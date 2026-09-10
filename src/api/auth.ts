import { request, apiCall } from './client';
import { rbacApi, type UserItem } from './rbac';

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

/**
 * 身份认证与权限会话服务 (Swagger: /api/tcmirp/auth/*)
 */
export const authApi = {
  /**
   * 用户登录 POST /api/tcmirp/auth/login
   */
  async login(payload: LoginPayload): Promise<LoginResult> {
    // Determine user profile based on mock/seed users if backend unreachable
    const users = await rbacApi.getUsers();
    let matched = users.find(u => u.username.toLowerCase() === payload.username.trim().toLowerCase());
    
    if (!matched) {
      // Allow demo fallback login
      matched = {
        id: `USER-${Date.now().toString(36).toUpperCase()}`,
        username: payload.username.trim(),
        realName: payload.username.trim() === 'admin' ? '系统总管' : payload.username.trim(),
        tenantId: payload.tenantId || 'TENANT-YN-DEMO',
        tenantName: '云南省中药材全产业链协同示范联盟',
        roles: ['ROLE_SUPER_ADMIN'],
        phone: '13888000000',
        email: `${payload.username}@tcmirp.cn`,
        status: 'ACTIVE',
        lastLoginAt: new Date().toLocaleString(),
        createdAt: new Date().toLocaleString()
      };
    }

    const fallbackResult: LoginResult = {
      token: `jwt_tcmirp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: String(matched.id),
        username: matched.username,
        realName: matched.realName,
        roles: matched.roles || ['ROLE_OPERATOR'],
        tenantId: String(matched.tenantId),
        tenantName: matched.tenantName || '云南省中药材全产业链协同示范联盟',
        permissions: ['workspace:view', 'business:all', 'governance:all', 'trust:all', 'settings:all']
      }
    };

    const res = await apiCall<any>(
      request.post('/tenant-access/auth/login', {
        username: payload.username.trim(),
        password: payload.password
      }),
      fallbackResult,
      '用户登录'
    );

    // Extract token: matches login interface response data.token (or res.token if already unwrapped)
    const token = res?.data?.token || res?.token || fallbackResult.token;
    const user = res?.user || res?.data?.user || fallbackResult.user;

    // Save session info with weappauthorization
    if (token) {
      localStorage.setItem('weappauthorization', token);
      localStorage.setItem('tcmirp_token', token);
    }
    if (user) {
      localStorage.setItem('tcmirp_user', JSON.stringify(user));
      localStorage.setItem('tcmirp_tenant_id', user.tenantId);
      localStorage.setItem('tcmirp_tenant_name', user.tenantName);
    }

    return {
      token,
      tokenType: 'Bearer',
      expiresIn: res?.expiresIn || 86400,
      user
    };
  },

  /**
   * 用户退出登录 POST /api/tcmirp/tenant-access/auth/logout
   */
  async logout(): Promise<LogoutResult> {
    const token = localStorage.getItem('weappauthorization') || localStorage.getItem('tcmirp_token') || '';
    const res = await apiCall<LogoutResult>(
      request.post('/tenant-access/auth/logout', {}, {
        headers: {
          weappauthorization: token,
          WeAppAuthorization: token
        }
      }),
      { success: true, message: '安全登出成功' },
      '用户退出登录'
    );

    localStorage.removeItem('weappauthorization');
    localStorage.removeItem('tcmirp_token');
    localStorage.removeItem('tcmirp_user');
    localStorage.removeItem('tcmirp_tenant_id');
    localStorage.removeItem('tcmirp_tenant_name');

    return res;
  },

  /**
   * 获取当前登录用户信息 GET /api/tcmirp/auth/me
   */
  async getCurrentUser(): Promise<any> {
    const cached = localStorage.getItem('tcmirp_user');
    let fallback = null;
    if (cached) {
      try {
        fallback = JSON.parse(cached);
      } catch (e) {
        fallback = null;
      }
    }

    return apiCall(
      request.get('/auth/me'),
      fallback,
      '获取当前会话用户'
    );
  }
};
