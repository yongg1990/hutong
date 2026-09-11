<template>
  <div class="login-container">
    <div class="login-bg-decorations">
      <div class="decor-circle circle-1"></div>
      <div class="decor-circle circle-2"></div>
    </div>

    <div class="login-box">
      <!-- Left side: Platform Brand & Architecture Intro -->
      <div class="login-aside">
        <div class="aside-brand">
          <div class="brand-logo">
            <svg viewBox="0 0 32 32" fill="none" class="logo-svg" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" stroke="#4ade80" stroke-width="1.8" stroke-dasharray="3 3" />
              <path d="M16 6C16 6 9 11 9 18C9 22 12.2 25 16 25C19.8 25 23 22 23 18C23 11 16 6 16 6Z" fill="#22c55e" />
              <path d="M16 11V23" stroke="#dcfce7" stroke-width="1.8" stroke-linecap="round" />
              <path d="M16 14L12 17" stroke="#dcfce7" stroke-width="1.5" stroke-linecap="round" />
              <path d="M16 17L20 20" stroke="#dcfce7" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
          <div>
            <h1 class="aside-title">中药全产业链追溯协同平台</h1>
            <p class="aside-sub">Yunnan TCM Whole Industry Chain Traceability</p>
          </div>
        </div>

        <div class="feature-list">
          <div class="feature-item">
            <div class="f-dot"></div>
            <div>
              <strong>全流程可信存证</strong>
              <p>田间GAP种植、初加工、检验LIMS、WMS赋码与跨域物化全程上链存证</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="f-dot"></div>
            <div>
              <strong>多租户安全隔离</strong>
              <p>租户组织间数据逻辑隔离，精准 RBAC 权限矩阵动态鉴权与审计</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="f-dot"></div>
            <div>
              <strong>跨省跨域标准互认</strong>
              <p>直连长三角及沿海重点药港，一码贯通与数字仓单跨省互认</p>
            </div>
          </div>
        </div>

        <div class="aside-footer mono">
          <span>安全接入节点: EDGE-KM-01 | 国密 SM2/SM3 加密握手</span>
        </div>
      </div>

      <!-- Right side: Login Form Card -->
      <div class="login-main">
        <div class="form-header">
          <h2>系统用户身份认证</h2>
          <p>请输入所属协同租户与经授权的账号口令登录</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" class="login-form" size="large">
          <el-form-item prop="tenantId">
            <label class="form-label">所属协同租户</label>
            <el-select v-model="form.tenantId" placeholder="选择或切换所属租户机构" style="width: 100%">
              <el-option
                v-for="t in tenants"
                :key="t.id"
                :label="t.tenantName + ' (' + t.tenantCode + ')'"
                :value="t.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item prop="username">
            <label class="form-label">登录账号</label>
            <el-input
              v-model="form.username"
              placeholder="请输入管理员或业务员账号"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <label class="form-label">安全密码</label>
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入登录密码 (默认 Tcmirp@2026#)"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住当前租户与登录状态</el-checkbox>
            <el-link type="primary" :underline="false" @click="tipForget">忘记密码?</el-link>
          </div>

          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录 平 台
          </el-button>
        </el-form>

        <!-- Fast demo account quick switcher -->
        <div class="quick-accounts">
          <div class="quick-title">快捷体验体验角色账号（一键填入）：</div>
          <div class="quick-tags">
            <el-tag
              class="account-chip"
              effect="plain"
              @click="fillAccount('admin_yn_tcm', 'TENANT-YN-DEMO')"
            >
              系统总管 (admin)
            </el-tag>
            <el-tag
              class="account-chip"
              type="success"
              effect="plain"
              @click="fillAccount('li_quality', 'TENANT-YN-DEMO')"
            >
              质检专员 (li_quality)
            </el-tag>
            <el-tag
              class="account-chip"
              type="warning"
              effect="plain"
              @click="fillAccount('wang_warehouse', 'TENANT-YN-DEMO')"
            >
              仓储调度 (wang_warehouse)
            </el-tag>
            <el-tag
              class="account-chip"
              type="info"
              effect="plain"
              @click="fillAccount('zhao_field', 'TENANT-WS-SANQI')"
            >
              田间农事 (zhao_field)
            </el-tag>
          </div>
        </div>

        <div class="form-footer-api">
          <span>登录认证端点: </span>
          <code class="mono">POST /api/tcmirp/auth/login</code>
          <span style="margin: 0 4px;">·</span>
          <span>请求头自动携带: </span>
          <code class="mono">weappauthorization: data.token</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/authStore';
import { rbacApi, type TenantItem } from '@/api/rbac';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const rememberMe = ref(true);
const tenants = ref<TenantItem[]>([]);
const formRef = ref<FormInstance>();

const form = ref({
  tenantId: 'TENANT-YN-DEMO',
  username: 'admin_yn_tcm',
  password: 'Tcmirp@2026#'
});

const rules = {
  tenantId: [{ required: true, message: '请选择所属租户机构', trigger: 'change' }],
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入安全密码', trigger: 'blur' }]
};

onMounted(async () => {
  try {
    tenants.value = await rbacApi.getTenants();
    if (tenants.value.length > 0 && !tenants.value.some(t => String(t.id) === String(form.value.tenantId))) {
      form.value.tenantId = tenants.value[0].id;
    }
  } catch (err) {
    console.warn('Failed to load tenants for login', err);
  }
});

const fillAccount = (username: string, tenantId: string) => {
  form.value.username = username;
  form.value.tenantId = tenantId;
  form.value.password = 'Tcmirp@2026#';
  ElMessage.info(`已填入预置账号: ${username}`);
};

const handleLogin = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      const res = await authStore.login({
        username: form.value.username,
        password: form.value.password,
        tenantId: form.value.tenantId
      });

      ElMessage.success(`欢迎回来，${res.user.realName || res.user.username}！`);
      
      const redirect = (route.query.redirect as string) || '/workspace';
      router.push(redirect);
    } catch (err: any) {
      ElMessage.error(err.message || '登录失败，请核对账号密码');
    } finally {
      loading.value = false;
    }
  });
};

const tipForget = () => {
  ElMessageBox.alert(
    '若忘记系统账号密码，请联系您所属租户的主系统管理员或平台运维人员，在【用户与账号管理】模块执行「重置密码」，重置后初始默认密码为：<strong style="color: #0e5f40; font-family: monospace;">Tcmirp@2026#</strong>',
    '忘记密码说明',
    { dangerouslyUseHTMLString: true }
  );
};
</script>

<style scoped>
.login-container {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f7f5;
  position: relative;
  overflow: hidden;
  padding: 24px;
  box-sizing: border-box;
}

.login-bg-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.decor-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
}

.circle-1 {
  width: 500px;
  height: 500px;
  background: #25855a;
  top: -150px;
  left: -100px;
}

.circle-2 {
  width: 450px;
  height: 450px;
  background: #14724e;
  bottom: -150px;
  right: -80px;
}

.login-box {
  position: relative;
  z-index: 1;
  width: 960px;
  max-width: 100%;
  min-height: 580px;
  display: flex;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(20, 114, 78, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(37, 133, 90, 0.15);
  overflow: hidden;
}

.login-aside {
  flex: 1;
  background: linear-gradient(145deg, #10593d 0%, #0d4630 100%);
  color: #ffffff;
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.aside-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-logo {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

.logo-svg {
  width: 100%;
  height: 100%;
}

.aside-title {
  font-size: 19px;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  line-height: 1.3;
}

.aside-sub {
  font-size: 11px;
  color: #a7f3d0;
  margin: 4px 0 0;
  letter-spacing: 0.5px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 36px 0;
}

.feature-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.f-dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.feature-item strong {
  display: block;
  font-size: 14.5px;
  color: #f0fdf4;
  margin-bottom: 4px;
}

.feature-item p {
  font-size: 12px;
  color: #bbf7d0;
  line-height: 1.5;
  margin: 0;
}

.aside-footer {
  font-size: 11.5px;
  color: #86efac;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding-top: 14px;
}

.login-main {
  width: 460px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
}

.form-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1a2e24;
  margin: 0 0 6px;
}

.form-header p {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 24px;
}

.form-label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  border-radius: 6px;
}

.quick-accounts {
  margin-top: 24px;
  padding: 12px;
  background: #f8faf9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.quick-title {
  font-size: 11.5px;
  color: #64748b;
  margin-bottom: 8px;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.account-chip {
  cursor: pointer;
  font-size: 11px;
  transition: all 0.15s;
}

.account-chip:hover {
  transform: translateY(-1px);
  border-color: #25855a;
}

.form-footer-api {
  margin-top: 20px;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
}

.form-footer-api code {
  color: #14724e;
  font-weight: 600;
}

@media (max-width: 860px) {
  .login-box {
    flex-direction: column;
    width: 100%;
  }
  .login-aside {
    display: none;
  }
  .login-main {
    width: 100%;
    padding: 30px 20px;
  }
}
</style>
