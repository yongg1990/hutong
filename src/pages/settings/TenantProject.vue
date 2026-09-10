<template>
  <div class="settings-page">
    <PageHeader
      title="多租户与项目空间"
      subtitle="切换或管理当前协同项目空间，并跳转至租户机构、用户账号与权限矩阵管理"
    >
      <template #actions>
        <el-button @click="router.push('/settings/tenants')">租户管理 ➔</el-button>
        <el-button @click="router.push('/settings/users')">用户管理 ➔</el-button>
        <el-button type="primary" @click="router.push('/settings/roles')">角色与权限 ➔</el-button>
      </template>
    </PageHeader>

    <!-- Three RBAC Shortcut Cards -->
    <div class="kpi-grid">
      <div class="kpi-card hover-card" @click="router.push('/settings/tenants')">
        <span class="label">协同租户管理</span>
        <div class="value">
          <strong class="mono">{{ tenantCount }}</strong>
          <span class="unit">家机构</span>
        </div>
        <span class="sub brand-color">查看入驻租户、增删改查与配额 ➔</span>
      </div>

      <div class="kpi-card hover-card" @click="router.push('/settings/users')">
        <span class="label">用户账号与认证</span>
        <div class="value">
          <strong class="mono">{{ userCount }}</strong>
          <span class="unit">名成员</span>
        </div>
        <span class="sub brand-color">账号分配、角色绑定与密码重置 ➔</span>
      </div>

      <div class="kpi-card hover-card" @click="router.push('/settings/roles')">
        <span class="label">角色与权限体系</span>
        <div class="value">
          <strong class="mono">{{ roleCount }}</strong>
          <span class="unit">种角色</span>
        </div>
        <span class="sub brand-color">RBAC 28 项功能点权限树矩阵 ➔</span>
      </div>

      <div class="kpi-card">
        <span class="label">当前隔离集群</span>
        <div class="value">
          <strong class="mono text-success">PROD-ISOLATED</strong>
        </div>
        <span class="sub">Header: X-Tenant-Id / X-Project-Id</span>
      </div>
    </div>

    <div class="grid-two">
      <div class="panel">
        <div class="panel-header">
          <h2>当前项目空间配置</h2>
        </div>
        <div class="panel-body">
          <div class="kv-row"><span>租户代码:</span> <b class="mono">{{ contextStore.tenantId }}</b></div>
          <div class="kv-row"><span>项目名称:</span> <b>{{ contextStore.projectName }}</b></div>
          <div class="kv-row"><span>我的当前角色:</span> <b>{{ contextStore.userRole }}</b></div>
          <div class="kv-row"><span>环境模式:</span> <b>PROD - 生产物理隔离集群</b></div>

          <el-divider style="margin: 16px 0" />

          <h3>切换快速协同项目空间</h3>
          <el-radio-group v-model="selectedProject" @change="switchProject">
            <el-radio label="PRJ-YN-TCM-2026">云南中药全产业链追溯示范项目</el-radio>
            <el-radio label="PRJ-WS-SANQI-01">文山三七专线合规追溯项目</el-radio>
          </el-radio-group>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>当前项目协同成员</h2>
          <el-button size="small" type="primary" link @click="router.push('/settings/users')">
            管理全部账号 ➔
          </el-button>
        </div>
        <div class="panel-body" style="padding: 0;">
          <el-table :data="members" style="width: 100%">
            <el-table-column prop="realName" label="姓名 / 账号" min-width="140">
              <template #default="{ row }">
                <span>{{ row.realName }}</span>
                <span class="sub-user-text mono">({{ row.username }})</span>
              </template>
            </el-table-column>
            <el-table-column label="项目角色" min-width="140">
              <template #default="{ row }">
                <el-tag size="small" type="success">{{ (row.roles && row.roles[0]) || '业务成员' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="tenantName" label="所属机构" min-width="180" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useContextStore } from '@/stores/contextStore';
import PageHeader from '@/components/common/PageHeader.vue';
import { settingsApi } from '@/api/settings';
import { rbacApi, type UserItem } from '@/api/rbac';

const router = useRouter();
const contextStore = useContextStore();
const selectedProject = ref(contextStore.projectId);

const tenantCount = ref(3);
const userCount = ref(5);
const roleCount = ref(5);
const members = ref<UserItem[]>([]);

onMounted(async () => {
  try {
    const [config, tList, uList, rList] = await Promise.all([
      settingsApi.getTenantProject(),
      rbacApi.getTenants(),
      rbacApi.getUsers(),
      rbacApi.getRoles()
    ]);
    if (config?.projectId && config?.projectName) {
      selectedProject.value = config.projectId;
    }
    tenantCount.value = tList.length;
    userCount.value = uList.length;
    roleCount.value = rList.length;
    members.value = uList.slice(0, 5);
  } catch (err) {
    console.error('Failed to load tenant project config', err);
  }
});

const switchProject = (val: any) => {
  if (val === 'PRJ-WS-SANQI-01') {
    contextStore.switchProject('PRJ-WS-SANQI-01', '文山三七专线合规追溯项目');
  } else {
    contextStore.switchProject('PRJ-YN-TCM-2026', '云南中药全产业链追溯示范项目');
  }
  ElMessage.success(`项目空间已切换为: ${contextStore.projectName}`);
};
</script>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 24px;
}

.hover-card {
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.hover-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-brand);
}

.grid-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 900px) {
  .grid-two {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  background: #fbfdfc;
}

.panel-header h2 {
  font-size: 15px;
  margin: 0;
}

.panel-body {
  padding: 16px;
}

.kv-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13.5px;
}

.kv-row span {
  color: var(--color-muted);
}

.sub-user-text {
  font-size: 11px;
  color: var(--color-muted);
  margin-left: 4px;
}
</style>
