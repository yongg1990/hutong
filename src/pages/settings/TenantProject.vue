<template>
  <div class="settings-page">
    <PageHeader
      title="多租户与项目空间"
      subtitle="切换或管理当前协同项目空间，并跳转至租户机构、用户账号与权限矩阵管理"
    >
      <template #actions>
        <el-button @click="router.push('/settings/tenants')">租户管理 ➔</el-button>
        <el-button @click="router.push('/settings/users')">用户管理 ➔</el-button>
        <el-button @click="router.push('/settings/roles')">角色与权限 ➔</el-button>
        <el-button type="primary" @click="createDialogVisible = true">创建项目空间</el-button>
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

    <FilterBar @search="loadProject" @reset="handleReset">
      <el-input-number v-model="projectSpaceId" :min="1" placeholder="项目空间 ID" style="width: 220px" />
    </FilterBar>

    <div class="grid-two">
      <div class="panel">
        <div class="panel-header">
          <h2>当前项目空间配置</h2>
        </div>
        <div class="panel-body">
          <template v-if="projectSpace">
            <div class="kv-row"><span>项目空间 ID:</span> <b class="mono">{{ projectSpace.projectSpaceId }}</b></div>
            <div class="kv-row"><span>租户 ID:</span> <b class="mono">{{ projectSpace.tenantId }}</b></div>
            <div class="kv-row"><span>项目代码:</span> <b class="mono">{{ projectSpace.projectCode }}</b></div>
            <div class="kv-row"><span>项目名称:</span> <b>{{ projectSpace.projectName }}</b></div>
            <div class="kv-row"><span>区域代码:</span> <b class="mono">{{ projectSpace.regionCode }}</b></div>
            <div class="kv-row"><span>状态:</span> <StatusTag :code="projectSpace.status" /></div>
            <div class="kv-row"><span>锁版本:</span> <b class="mono">{{ projectSpace.lockVersion }}</b></div>
            <div class="kv-row"><span>创建时间:</span> <b>{{ projectSpace.createdAt }}</b></div>
            <div class="kv-row"><span>业务范围:</span> <b class="mono scope-value">{{ JSON.stringify(projectSpace.businessScope || {}) }}</b></div>
            <el-button type="primary" style="margin-top: 14px" @click="switchProject">设为当前项目空间</el-button>
          </template>
          <el-empty v-else description="请输入项目空间 ID 查询" />
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
          <el-table :data="members" v-loading="loading" style="width: 100%">
            <el-table-column prop="userId" label="用户 ID" width="100" class-name="mono" />
            <el-table-column prop="tenantId" label="租户 ID" width="100" class-name="mono" />
            <el-table-column prop="realName" label="姓名 / 账号" min-width="160">
              <template #default="{ row }">
                <span>{{ row.realName }}</span>
                <span class="sub-user-text mono">({{ row.username }})</span>
              </template>
            </el-table-column>
            <el-table-column label="项目角色 *" min-width="140">
              <template #default="{ row }">
                <el-tag size="small" type="success">{{ (row.roles && row.roles[0]) || '业务成员' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="tenantName" label="所属机构 *" min-width="180" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column prop="createdAt" label="创建时间" width="170" />
            <el-table-column prop="updatedAt" label="更新时间" width="170" />
          </el-table>
        </div>
      </div>
    </div>

    <el-dialog v-model="createDialogVisible" title="创建项目空间" width="600px">
      <el-form :model="createForm" label-position="top">
        <div class="form-grid">
          <el-form-item label="项目代码" required><el-input v-model="createForm.projectCode" /></el-form-item>
          <el-form-item label="项目名称" required><el-input v-model="createForm.projectName" /></el-form-item>
          <el-form-item label="区域代码" required><el-input v-model="createForm.regionCode" /></el-form-item>
        </div>
        <el-form-item label="业务范围 JSON" required>
          <el-input v-model="businessScopeText" type="textarea" :rows="7" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createProject">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useContextStore } from '@/stores/contextStore';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { settingsApi, type ProjectSpaceCreateRequest, type ProjectSpaceResponse } from '@/api/settings';
import { rbacApi, type UserItem } from '@/api/rbac';
import { apiErrorMessage } from '@/api/client';

const router = useRouter();
const contextStore = useContextStore();
const projectSpaceId = ref<number | undefined>(Number(localStorage.getItem('tcmirp_project_space_id')) || 1);
const projectSpace = ref<ProjectSpaceResponse | null>(null);
const loading = ref(false);
const creating = ref(false);
const createDialogVisible = ref(false);
const businessScopeText = ref('{\n  "scenarioCodes": [],\n  "regionCodes": [],\n  "partyIds": [],\n  "objectTypes": []\n}');
const createForm = ref<Omit<ProjectSpaceCreateRequest, 'businessScope'>>({ projectCode: '', projectName: '', regionCode: '' });

const tenantCount = ref(3);
const userCount = ref(5);
const roleCount = ref(5);
const members = ref<UserItem[]>([]);

const loadProject = async () => {
  if (!projectSpaceId.value) {
    projectSpace.value = null;
    members.value = [];
    return;
  }
  loading.value = true;
  try {
    const config = await settingsApi.getProjectSpaceById(projectSpaceId.value);
    projectSpace.value = config;
    const uList = await rbacApi.getUsers({ tenantId: config.tenantId });
    members.value = uList;
    userCount.value = uList.length;
  } catch (err) {
    console.error('Failed to load project space', err);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  loadProject();
  const [tList, rList] = await Promise.all([rbacApi.getTenants(), rbacApi.getRoles()]);
  tenantCount.value = tList.length;
  roleCount.value = rList.length;
});

const handleReset = () => {
  projectSpaceId.value = undefined;
  projectSpace.value = null;
  members.value = [];
};

const switchProject = () => {
  if (!projectSpace.value) return;
  contextStore.switchProject(String(projectSpace.value.projectSpaceId), projectSpace.value.projectName);
  localStorage.setItem('tcmirp_project_space_id', String(projectSpace.value.projectSpaceId));
  ElMessage.success(`项目空间已切换为: ${contextStore.projectName}`);
};

const createProject = async () => {
  if (!createForm.value.projectCode || !createForm.value.projectName || !createForm.value.regionCode) {
    ElMessage.warning('请填写完整的项目空间信息');
    return;
  }
  let businessScope: ProjectSpaceCreateRequest['businessScope'];
  try {
    businessScope = JSON.parse(businessScopeText.value);
  } catch {
    ElMessage.warning('业务范围必须是有效 JSON');
    return;
  }
  creating.value = true;
  try {
    const created = await settingsApi.createProjectSpace({ ...createForm.value, businessScope });
    projectSpace.value = created;
    projectSpaceId.value = Number(created.projectSpaceId) || undefined;
    createDialogVisible.value = false;
    ElMessage.success('项目空间创建成功');
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '项目空间创建失败'));
  } finally {
    creating.value = false;
  }
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

.scope-value {
  max-width: 65%;
  overflow-wrap: anywhere;
  text-align: right;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.sub-user-text {
  font-size: 11px;
  color: var(--color-muted);
  margin-left: 4px;
}
</style>
