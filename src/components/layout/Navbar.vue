<template>
  <header class="navbar">
    <div class="brand">
      <div class="brand-logo-wrap">
        <svg class="brand-svg-logo" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="15" stroke="#25855A" stroke-width="1.5" stroke-dasharray="2 2" />
          <path d="M16 6C16 6 9 11 9 18C9 22 12.2 25 16 25C19.8 25 23 22 23 18C23 11 16 6 16 6Z" fill="#13734E" />
          <path d="M16 11V23" stroke="#A7F3D0" stroke-width="1.5" stroke-linecap="round" />
          <path d="M16 14L12 17" stroke="#A7F3D0" stroke-width="1.2" stroke-linecap="round" />
          <path d="M16 17L20 20" stroke="#A7F3D0" stroke-width="1.2" stroke-linecap="round" />
          <circle cx="16" cy="6" r="2" fill="#6EE7B7" />
          <circle cx="9" cy="18" r="1.5" fill="#6EE7B7" />
          <circle cx="23" cy="18" r="1.5" fill="#6EE7B7" />
        </svg>
      </div>
      <div class="brand-text">
        <div class="title-row">
          <span class="title">云南省中药材全产业链追溯与治理协同平台</span>
        </div>
        <span class="sub">Yunnan TCM Whole Industry Chain Traceability & Governance Platform</span>
      </div>
    </div>

    <div class="header-center">
      <el-dropdown trigger="click" @command="handleProjectChange">
        <div class="project-selector">
          <span class="label">项目空间:</span>
          <span class="name">{{ contextStore.projectName }}</span>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="PRJ-YN-TCM-2026">
              云南中药全产业链追溯示范项目 (PRJ-YN-TCM-2026)
            </el-dropdown-item>
            <el-dropdown-item command="PRJ-WS-SANQI-01">
              文山三七专线合规追溯项目 (PRJ-WS-SANQI-01)
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="header-actions">
      <el-button type="primary" size="small" @click="router.push('/business/events/new')">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon> 录入业务事件
      </el-button>

      <el-dropdown trigger="click" @command="handleUserCommand">
        <div class="user-badge cursor-pointer" title="点击展开用户会话与注销操作">
          <el-avatar :size="28" style="background: #14724e; color: #ffffff; font-weight: 600; font-size: 13px;">
            {{ (contextStore.userName || '张').charAt(0) }}
          </el-avatar>
          <div class="user-info">
            <span class="username">{{ contextStore.userName }}</span>
            <span class="role">{{ contextStore.userRole }}</span>
          </div>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-session-menu">
            <div class="dropdown-user-header">
              <div class="dh-name">{{ contextStore.userName }}</div>
              <div class="dh-tenant mono">{{ contextStore.tenantName }}</div>
              <div class="dh-code mono">租户ID: {{ contextStore.tenantId }}</div>
            </div>
            <el-dropdown-item divided command="workspace">
              综合控制台
            </el-dropdown-item>
            <el-dropdown-item command="users">
              用户与账号管理
            </el-dropdown-item>
            <el-dropdown-item command="roles">
              我的权限角色清单
            </el-dropdown-item>
            <el-dropdown-item divided command="relogin">
              切换其他账号登录
            </el-dropdown-item>
            <el-dropdown-item command="logout" class="text-danger">
              <span style="color: #ef4444; font-weight: 600;">安全退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-tooltip content="安全退出当前账号会话" placement="bottom">
        <button class="logout-icon-btn" @click="confirmLogout" aria-label="退出系统">
          <el-icon><SwitchButton /></el-icon>
        </button>
      </el-tooltip>
    </div>

    <!-- Backend Swagger & Network Diagnostic Dialog -->
    <el-dialog
      v-model="showDiagDialog"
      title="后端 Swagger 接口联调与网络连通诊断"
      width="640px"
      append-to-body
      class="diag-dialog"
    >
      <div class="diag-content">
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px;"
        >
          <template #title>
            <span style="font-weight: 700;">为什么提示“内网隔离/基准模式”？</span>
          </template>
          <div style="font-size: 12.5px; line-height: 1.6; margin-top: 4px;">
            您配置的文档地址为私网 IP（<strong>192.168.1.39</strong>）。当前前端系统运行在公网云端沙箱中，<strong>公网环境受限于物理网络协议，无法直接跨网访问您的局域网私有主机</strong>。系统已自动启用「全功能基准 Mock 模式」以保障前端各项操作与流程演示。
          </div>
        </el-alert>

        <el-descriptions :column="1" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="Swagger 文档目标">
            <code class="mono text-xs">{{ apiStatus.swaggerDocUrl }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="当前 API BaseURL">
            <el-input v-model="targetBaseUrl" size="small" placeholder="如 http://192.168.1.39:8900/api/tcmirp 或 cpolar 公网域名">
              <template #append>
                <el-button @click="saveAndTestBaseUrl" :loading="testingConnection">保存并测试</el-button>
              </template>
            </el-input>
          </el-descriptions-item>
          <el-descriptions-item label="网络连通状态">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-tag :type="apiStatus.isOnline ? 'success' : 'danger'" size="small">
                {{ apiStatus.isOnline ? '● 服务在线 (200 OK)' : '○ 局域网未直连 / 模拟基准兜底' }}
              </el-tag>
              <span v-if="apiStatus.checkedAt" class="text-xs text-gray-500">检测时间: {{ apiStatus.checkedAt }}</span>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="diag-guide">
          <div class="dg-title">如何让云端系统 100% 精确匹配您的 Swagger 定义？</div>
          <ol class="dg-steps">
            <li>
              <strong>方法一（推荐）：直接上传 OpenAPI JSON</strong><br />
              在您本地电脑打开 <code>http://192.168.1.39:8900/api/tcmirp/v3/api-docs</code>，将网页返回的 JSON 保存并直接发送给 AI 助手，系统将立即按照您后端的字段完全对齐重构。
            </li>
            <li>
              <strong>方法二：开启内网穿透（如 cpolar / ngrok）</strong><br />
              将本地 <code>8900</code> 端口映射出公网域名后，直接填入上方的 BaseURL，云端即可随时直连真实接口。
            </li>
            <li>
              <strong>方法三：直接粘贴接口定义</strong><br />
              将关键 Controller（如登录、租户、用户）的请求路径与入参示例直接发给 AI 助手，即可精准完成参数与数据结构对齐。
            </li>
          </ol>
        </div>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <el-link
            :href="apiStatus.swaggerDocUrl"
            target="_blank"
            type="primary"
            :underline="false"
            style="font-size: 12px;"
          >
            新标签页打开本地 Swagger 页面 ↗
          </el-link>
          <el-button type="primary" @click="showDiagDialog = false">我已知晓</el-button>
        </div>
      </template>
    </el-dialog>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowDown, Plus, SwitchButton } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useContextStore } from '@/stores/contextStore';
import { useAuthStore } from '@/stores/authStore';
import { apiStatus, checkBackendHealth, setApiBaseUrl } from '@/api/client';

const router = useRouter();
const contextStore = useContextStore();
const authStore = useAuthStore();

const showDiagDialog = ref(false);
const targetBaseUrl = ref(apiStatus.baseUrl);
const testingConnection = ref(false);

const saveAndTestBaseUrl = async () => {
  testingConnection.value = true;
  setApiBaseUrl(targetBaseUrl.value.trim());
  const ok = await checkBackendHealth();
  testingConnection.value = false;
  if (ok) {
    ElMessage.success('后端接口探测成功！已切换为真实在线模式。');
  } else {
    ElMessage.warning('未能连通目标地址（通常因私网不可达或服务未启动），继续使用基准 Mock 兜底保证页面可用。');
  }
};

const handleProjectChange = (projId: string) => {
  if (projId === 'PRJ-WS-SANQI-01') {
    contextStore.switchProject('PRJ-WS-SANQI-01', '文山三七专线合规追溯项目');
  } else {
    contextStore.switchProject('PRJ-YN-TCM-2026', '云南中药全产业链追溯示范项目');
  }
  ElMessage.success(`协同项目空间已切换为: ${contextStore.projectName}`);
};

const handleUserCommand = (cmd: string) => {
  if (cmd === 'workspace') {
    router.push('/workspace');
  } else if (cmd === 'users') {
    router.push('/settings/users');
  } else if (cmd === 'roles') {
    router.push('/settings/roles');
  } else if (cmd === 'relogin') {
    router.push('/login');
  } else if (cmd === 'logout') {
    confirmLogout();
  }
};

const confirmLogout = () => {
  ElMessageBox.confirm(
    '确定要安全退出当前登录账号并清除工作会话凭据吗？',
    '注销登录确认',
    {
      confirmButtonText: '安全退出',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await authStore.logout();
    ElMessage.success('已安全注销会话，请重新登录！');
    router.push('/login');
  }).catch(() => {});
};
</script>

<style scoped>
.navbar {
  height: 52px;
  background: #0f1c16;
  color: #e3ece7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid #1a2f26;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
  z-index: 100;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo-wrap {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-svg-logo {
  width: 32px;
  height: 32px;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-text .title {
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #ffffff;
}

.gov-badge {
  font-size: 10px;
  background: rgba(19, 115, 78, 0.4);
  color: #84f1c1;
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid rgba(52, 211, 153, 0.3);
  font-weight: 600;
}

.brand-text .sub {
  font-size: 10px;
  color: #829e91;
  line-height: 1.1;
  margin-top: 1px;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chain-status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #a0b7ac;
  background: rgba(255, 255, 255, 0.04);
  padding: 3px 9px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.pulse-node {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.25);
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 5px rgba(52, 211, 153, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
  }
}

.chain-label {
  color: #7d968b;
}

.chain-val {
  color: #4ade80;
  font-size: 11px;
  font-weight: 600;
}

.divider-v {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.12);
}

.project-selector {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 4px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #e3ece7;
  transition: all 0.2s;
}

.project-selector:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(52, 211, 153, 0.35);
}

.project-selector .label {
  color: #7d968b;
}

.project-selector .name {
  font-weight: 600;
  color: #ffffff;
}

.arrow-icon {
  font-size: 11px;
  color: #9ebbb0;
  margin-left: 2px;
}

.env-tag {
  background: rgba(14, 95, 64, 0.4);
  border: 1px solid #1a8359;
  color: #79f3bf;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 3px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 8px;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.user-badge:hover {
  background: rgba(255, 255, 255, 0.08);
}

.cursor-pointer {
  cursor: pointer;
}

.logout-icon-btn {
  background: transparent;
  border: 1px solid #1a2f26;
  color: #9ebbb0;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.logout-icon-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.dropdown-user-header {
  padding: 8px 16px 10px;
  border-bottom: 1px solid #f1f5f3;
}

.dh-name {
  font-weight: 700;
  font-size: 14px;
  color: #14724e;
}

.dh-tenant {
  font-size: 11.5px;
  color: #475569;
  margin-top: 2px;
}

.dh-code {
  font-size: 10.5px;
  color: #94a3b8;
  margin-top: 2px;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.username {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
}

.role {
  font-size: 10.5px;
  color: #88a396;
}

.api-diag-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 14px;
  font-size: 11px;
  color: #fbbf24;
  transition: all 0.2s ease;
}

.api-diag-pill:hover {
  background: rgba(245, 158, 11, 0.22);
  border-color: rgba(245, 158, 11, 0.6);
}

.api-diag-pill.online {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.dot-online {
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}

.dot-offline {
  background: #f59e0b;
}

.diag-content {
  font-size: 13px;
  color: #334155;
}

.diag-guide {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
}

.dg-title {
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.dg-steps {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #475569;
  line-height: 1.8;
}

.dg-steps code {
  background: #e2e8f0;
  padding: 1px 5px;
  border-radius: 3px;
  color: #0f766e;
  font-family: monospace;
}
</style>
