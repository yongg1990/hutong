<template>
  <div class="settings-page">
    <PageHeader
      title="用户与账号管理"
      subtitle="租户用户账号创建与角色绑定"
    >
      <template #actions>
        <el-button @click="loadUsers">刷新用户</el-button>
        <el-button type="primary" @click="openCreateDialog">
          + 新增用户账号
        </el-button>
      </template>
    </PageHeader>

    <!-- Top KPI Row -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="label">当前列表用户数</span>
        <div class="value">
          <strong class="mono">{{ users.length }}</strong>
          <span class="unit">人</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="label">正常可用账号</span>
        <div class="value">
          <strong class="mono brand-color">{{ activeUsersCount }}</strong>
          <span class="unit">人激活</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="label">所属协同租户数</span>
        <div class="value">
          <strong class="mono">{{ distinctTenantsCount }}</strong>
          <span class="unit">家机构</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-select v-model="tenantFilter" placeholder="所属租户机构" style="width: 220px" clearable>
        <el-option label="全部租户" value="" />
        <el-option
          v-for="t in tenants"
          :key="t.id"
          :label="t.tenantName"
          :value="t.id"
        />
      </el-select>
    </FilterBar>

    <!-- Users Table Panel -->
    <div class="panel">
      <div class="panel-header">
        <h2>用户账号列表 ({{ filteredUsers.length }})</h2>
      </div>
      <div class="panel-body">
        <el-table :data="filteredUsers" v-loading="loading" style="width: 100%" empty-text="暂无匹配的用户账号">
          <el-table-column prop="userId" label="用户 ID" width="110" class-name="mono" />
          <el-table-column prop="tenantId" label="租户 ID" width="110" class-name="mono" />
          <el-table-column prop="username" label="登录账号" min-width="140" class-name="mono">
            <template #default="{ row }">
              <span class="username-cell">{{ row.username }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="displayName" label="显示名称" min-width="150" />
          <el-table-column prop="tenantName" label="所属租户机构 *" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <StatusTag :code="row.status" :label="row.status === 'ACTIVE' ? '启用' : '停用'" />
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="170" />
          <el-table-column prop="updatedAt" label="更新时间" width="170" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openRoleDialog(row, 'bind')">绑定角色</el-button>
              <el-button size="small" link @click="openRoleDialog(row, 'unbind')">解除角色</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      title="新增业务用户账号"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
        <div class="form-row-two">
          <el-form-item label="登录账号" prop="username" style="flex: 1">
            <el-input v-model="form.username" placeholder="如 zhang_san (英文字符)" />
          </el-form-item>
          <el-form-item label="显示名称" prop="displayName" style="flex: 1">
            <el-input v-model="form.displayName" placeholder="如 张建国" />
          </el-form-item>
        </div>

        <el-form-item label="所属租户" prop="tenantId">
          <el-select v-model="form.tenantId" placeholder="选择所属租户" style="width: 100%" @change="selectedRoleIds = []">
            <el-option
              v-for="t in tenants"
              :key="t.id"
              :label="t.tenantName"
              :value="t.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="初始密码">
          <el-input v-model="password" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item label="分配角色">
          <el-select
            v-model="selectedRoleIds"
            multiple
            placeholder="可选，创建后绑定"
            style="width: 100%"
          >
            <el-option
              v-for="r in availableRoles"
              :key="r.id"
              :label="r.roleName + ' (' + r.roleCode + ')'"
              :value="r.id"
            />
          </el-select>
        </el-form-item>

      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存提交</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="roleDialogVisible" :title="roleAction === 'bind' ? '绑定角色' : '解除角色'" width="480px">
      <el-select v-if="roleAction === 'bind'" v-model="bindingRoleIds" multiple placeholder="选择角色" style="width: 100%" :loading="loadingDialogRoles">
        <el-option v-for="r in dialogRoles" :key="r.id" :label="r.roleName + ' (' + r.roleCode + ')'" :value="r.id" />
      </el-select>
      <el-select v-else v-model="selectedRoleId" placeholder="选择角色" style="width: 100%" :loading="loadingDialogRoles">
        <el-option v-for="r in dialogRoles" :key="r.id" :label="r.roleName + ' (' + r.roleCode + ')'" :value="r.id" />
      </el-select>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="loadingDialogRoles || (roleAction === 'bind' ? !bindingRoleIds.length : !selectedRoleId)" @click="submitRoleAction">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { rbacApi, type UserItem, type TenantItem, type RoleItem } from '@/api/rbac';
import { apiErrorMessage } from '@/api/client';

const users = ref<UserItem[]>([]);
const tenants = ref<TenantItem[]>([]);
const roles = ref<RoleItem[]>([]);
const loading = ref(false);
const submitting = ref(false);

const tenantFilter = ref<string | number>('');

const dialogVisible = ref(false);
const password = ref('');
const selectedRoleIds = ref<(string | number)[]>([]);
const roleDialogVisible = ref(false);
const dialogRoles = ref<RoleItem[]>([]);
const loadingDialogRoles = ref(false);
const bindingRoleIds = ref<(string | number)[]>([]);
const selectedRoleId = ref<string | number>('');
const roleAction = ref<'bind' | 'unbind'>('bind');
const selectedUser = ref<UserItem | null>(null);

const formRef = ref<FormInstance>();
const form = ref<Partial<UserItem>>({
  username: '',
  displayName: '',
  tenantId: '',
  status: 'ACTIVE'
});

const rules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  tenantId: [{ required: true, message: '请选择所属租户', trigger: 'change' }]
};

const activeUsersCount = computed(() => users.value.filter(u => u.status === 'ACTIVE').length);
const distinctTenantsCount = computed(() => new Set(users.value.map(u => u.tenantId)).size);
const filteredUsers = computed(() => users.value);
const availableRoles = computed(() => roles.value.filter(r =>
  form.value.tenantId == null || form.value.tenantId === '' ||
  r.tenantId == null || String(r.tenantId) === String(form.value.tenantId)
));

const loadData = async () => {
  loading.value = true;
  try {
    const [uList, tList, rList] = await Promise.all([
      rbacApi.getUsers({ tenantId: tenantFilter.value || undefined }),
      rbacApi.getTenants({ page: 1, size: 100 }),
      rbacApi.getRoles()
    ]);
    tenants.value = tList;
    roles.value = rList;
    users.value = uList.map(user => ({
      ...user,
      tenantName: tList.find(tenant => String(tenant.id) === String(user.tenantId))?.tenantName
    }));
  } catch (err) {
    users.value = [];
    ElMessage.error(apiErrorMessage(err, '用户与角色数据加载失败'));
  } finally {
    loading.value = false;
  }
};

const loadUsers = async () => {
  await loadData();
};

onMounted(() => {
  loadData();
});

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  tenantFilter.value = '';
  loadData();
};

const openCreateDialog = () => {
  form.value = {
    username: '',
    displayName: '',
    tenantId: tenants.value[0]?.id || '',
    status: 'ACTIVE'
  };
  password.value = '';
  selectedRoleIds.value = [];
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  if (!password.value) {
    ElMessage.error('请输入初始密码');
    return;
  }
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const created = await rbacApi.createUser({
        tenantId: form.value.tenantId,
        username: form.value.username!,
        displayName: form.value.displayName!,
        password: password.value
      });
      dialogVisible.value = false;
      if (selectedRoleIds.value.length) {
        try {
          await rbacApi.bindUserRoles(created.userId ?? created.id, selectedRoleIds.value, form.value.tenantId);
          ElMessage.success(`用户 [${created.username}] 创建并绑定角色成功`);
        } catch (err) {
          ElMessage.warning(`用户已创建，${apiErrorMessage(err, '角色绑定失败，请在列表中重试')}`);
        }
      } else {
        ElMessage.success(`用户 [${created.username}] 创建成功`);
      }
      await loadData();
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, '保存用户失败，请检查输入'));
    } finally {
      submitting.value = false;
    }
  });
};

const openRoleDialog = async (row: UserItem, action: 'bind' | 'unbind') => {
  selectedUser.value = row;
  roleAction.value = action;
  selectedRoleId.value = '';
  bindingRoleIds.value = [];
  dialogRoles.value = [];
  roleDialogVisible.value = true;
  loadingDialogRoles.value = true;
  try {
    const roleList = await rbacApi.getRoles();
    dialogRoles.value = roleList.filter(role =>
      row.tenantId == null || row.tenantId === '' || role.tenantId == null || String(role.tenantId) === String(row.tenantId)
    );
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '角色列表加载失败'));
  } finally {
    loadingDialogRoles.value = false;
  }
};

const submitRoleAction = async () => {
  if (!selectedUser.value || (roleAction.value === 'bind' ? !bindingRoleIds.value.length : !selectedRoleId.value)) return;
  const { userId, tenantId } = selectedUser.value;
  if (userId == null) {
    ElMessage.error('用户 ID 缺失');
    return;
  }
  submitting.value = true;
  try {
    if (roleAction.value === 'bind') {
      await rbacApi.bindUserRoles(userId, bindingRoleIds.value, tenantId);
    } else {
      if (tenantId == null || tenantId === '') {
        ElMessage.error('租户 ID 缺失');
        return;
      }
      await rbacApi.unbindUserRole(userId, selectedRoleId.value, tenantId);
    }
    ElMessage.success(roleAction.value === 'bind' ? '角色绑定成功' : '角色解除成功');
    roleDialogVisible.value = false;
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '角色操作失败'));
  } finally {
    submitting.value = false;
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

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: #fbfdfc;
}

.panel-header h2 {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
}

.sub-text {
  font-size: 12px;
  color: var(--color-muted);
}

.username-cell {
  font-weight: 600;
  color: var(--color-brand);
}

.roles-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-tag {
  font-size: 11.5px;
}

.form-row-two {
  display: flex;
  gap: 16px;
}
</style>
