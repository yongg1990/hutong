import { defineStore } from 'pinia';
import { authApi, type LoginPayload, type LoginResult } from '@/api/auth';
import { useContextStore } from './contextStore';

export interface AuthState {
  token: string;
  isLoggedIn: boolean;
  user: {
    id: string;
    username: string;
    realName: string;
    roles: string[];
    tenantId: string;
    tenantName: string;
    permissions: string[];
  } | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const storedToken = localStorage.getItem('weappauthorization') || localStorage.getItem('tcmirp_token') || '';
    const hasBackendSession = localStorage.getItem('tcmirp_session_source') === 'backend';
    const isLegacyDemoToken = /^(jwt_tcmirp_|local-|demo-|mock-|fake-|dev-token)/i.test(storedToken);
    const savedToken = !hasBackendSession || isLegacyDemoToken ? '' : storedToken;
    if (!savedToken && storedToken) {
      localStorage.removeItem('weappauthorization');
      localStorage.removeItem('tcmirp_token');
      localStorage.removeItem('tcmirp_user');
      localStorage.removeItem('tcmirp_session_source');
    }
    let savedUser = null;
    try {
      const raw = localStorage.getItem('tcmirp_user');
      if (raw) savedUser = JSON.parse(raw);
    } catch (e) {
      savedUser = null;
    }

    return {
      token: savedToken,
      isLoggedIn: Boolean(savedToken && savedUser),
      user: savedUser
    };
  },

  actions: {
    async login(payload: LoginPayload): Promise<LoginResult> {
      const res = await authApi.login(payload);
      this.token = res.token;
      this.isLoggedIn = true;
      this.user = res.user;

      if (res.token) {
        localStorage.setItem('weappauthorization', res.token);
        localStorage.setItem('tcmirp_token', res.token);
      }

      // Sync to context store
      const contextStore = useContextStore();
      contextStore.setTenant(res.user.tenantId, res.user.tenantName);
      contextStore.userName = res.user.realName || res.user.username;
      contextStore.userRole = (res.user.roles && res.user.roles[0]) || '业务操作员';

      return res;
    },

    async logout(): Promise<void> {
      try {
        await authApi.logout();
      } catch (err) {
        console.warn('Backend logout failed, clearing local state', err);
      } finally {
        this.token = '';
        this.isLoggedIn = false;
        this.user = null;
        localStorage.removeItem('weappauthorization');
        localStorage.removeItem('tcmirp_token');
        localStorage.removeItem('tcmirp_user');
        localStorage.removeItem('tcmirp_session_source');
      }
    },

    initSession() {
      const token = localStorage.getItem('weappauthorization') || localStorage.getItem('tcmirp_token');
      const rawUser = localStorage.getItem('tcmirp_user');
      const isBackendSession = localStorage.getItem('tcmirp_session_source') === 'backend';
      const isLegacyDemoToken = Boolean(token && /^(jwt_tcmirp_|local-|demo-|mock-|fake-|dev-token)/i.test(token));
      if (token && rawUser && isBackendSession && !isLegacyDemoToken) {
        try {
          this.token = token;
          this.user = JSON.parse(rawUser);
          this.isLoggedIn = true;

          const contextStore = useContextStore();
          if (this.user) {
            contextStore.setTenant(this.user.tenantId, this.user.tenantName);
            contextStore.userName = this.user.realName || this.user.username;
            contextStore.userRole = (this.user.roles && this.user.roles[0]) || '业务操作员';
          }
        } catch (e) {
          console.error('Failed to parse cached user', e);
          this.token = '';
          this.isLoggedIn = false;
          this.user = null;
          localStorage.removeItem('tcmirp_session_source');
        }
      } else {
        this.token = '';
        this.isLoggedIn = false;
        this.user = null;
        localStorage.removeItem('weappauthorization');
        localStorage.removeItem('tcmirp_token');
        localStorage.removeItem('tcmirp_user');
        localStorage.removeItem('tcmirp_session_source');
      }
    }
  }
});
