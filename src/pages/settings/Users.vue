<template>
  <div class="settings-page">
    <PageHeader
      title="用户与账号管理"
      subtitle="多租户统一身份认证、成员账号分配、手机/邮箱绑定及跨角色权限映射"
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
        <span class="label">平台注册用户总数</span>
        <div class="value">
          <strong class="mono">{{ users.length }}</strong>
          <span class="unit">人</span>
        </div>
        <span class="sub">统一支持 JWT 与 OAuth 凭证认证</span>
      </div>

      <div class="kpi-card">
        <span class="label">正常可用账号</span>
        <div class="value">
          <strong class="mono brand-color">{{ activeUsersCount }}</strong>
          <span class="unit">人激活</span>
        </div>
        <span class="sub">无异常登录与风控锁定</span>
      </div>

      <div class="kpi-card">
        <span class="label">所属协同租户数</span>
        <div class="value">
          <strong class="mono">{{ distinctTenantsCount }}</strong>
          <span class="unit">家机构</span>
        </div>
        <span class="sub">账号按租户组织物理隔离</span>
      </div>

      <div class="kpi-card">
        <span class="label">已绑定业务角色</span>
        <div class="value">
          <strong class="mono">{{ boundRolesCount }}</strong>
          <span class="unit">个岗位</span>
        </div>
        <span class="sub">支持单用户多角色权限继承</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input
        v-model="keyword"
        placeholder="登录账号 / 真实姓名 / 联系电话"
        style="width: 240px"
        clearable
      />
      <el-select v-model="tenantFilter" placeholder="所属租户机构" style="width: 220px" clearable>
        <el-option label="全部租户" value="" />
        <el-option
          v-for="t in tenants"
          :key="t.id"
          :label="t.tenantName"
          :value="t.id"
        />
      </el-select>
      <el-select v-model="statusFilter" placeholder="账号状态" style="width: 140px" clearable>
        <el-option label="全部状态" value="" />
        <el-option label="正常 (ACTIVE)" value="ACTIVE" />
        <el-option label="禁用 (DISABLED)" value="DISABLED" />
      </el-select>
    </FilterBar>

    <!-- Users Table Panel -->
    <div class="panel">
      <div class="panel-header">
        <h2>用户账号列表 ({{ filteredUsers.length }})</h2>
        <span class="sub-text">支持对用户进行权限角色授权、重置默认密码及锁定启停</span>
      </div>
      <div class="panel-body">
        <el-table :data="filteredUsers" v-loading="loading" style="width: 100%" empty-text="暂无匹配的用户账号">
          <el-table-column prop="username" label="登录账号" min-width="140" class-name="mono">
            <template #default="{ row }">
              <span class="username-cell">{{ row.username }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="realName" label="姓名 / 备注" min-width="150" />
          <el-table-column prop="tenantName" label="所属租户机构" min-width="200" show-overflow-tooltip />
          <el-table-column label="已分配业务角色" min-width="200">
            <template #default="{ row }">
              <div class="roles-wrap">
                <el-tag
                  v-for="role in row.roles"
                  :key="role"
                  size="small"
                  type="success"
                  class="role-tag"
                >
                  {{ getRoleName(role) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="联系电话" width="130" class-name="mono" />
          <el-table-column prop="lastLoginAt" label="最近一次登录" width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <StatusTag :code="row.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="230" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button size="small" type="warning" link @click="handleResetPassword(row)">
                重置密码
              </el-button>
              <el-button
                size="small"
                :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
                link
                @click="toggleStatus(row)"
              >
                {{ row.status === 'ACTIVE' ? '停用' : '启用' }}
              </el-button>
              <el-button size="small" type="danger" link @click="confirmDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑用户账号与角色' : '新增业务用户账号'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
        <div class="form-row-two">
          <el-form-item label="登录账号" prop="username" style="flex: 1">
            <el-input v-model="form.username" placeholder="如 zhang_san (英文字符)" :disabled="isEditing" />
          </el-form-item>
          <el-form-item label="真实姓名" prop="realName" style="flex: 1">
            <el-input v-model="form.realName" placeholder="如 张建国" />
          </el-form-item>
        </div>

        <el-form-item label="所属租户" prop="tenantId">
          <el-select v-model="form.tenantId" placeholder="选择所属租户" style="width: 100%" @change="onTenantChange">
            <el-option
              v-for="t in tenants"
              :key="t.id"
              :label="t.tenantName"
              :value="t.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="分配角色" prop="roles">
          <el-select
            v-model="form.roles"
            multiple
            placeholder="请选择赋予该用户的业务角色 (支持多选)"
            style="width: 100%"
          >
            <el-option
              v-for="r in roles"
              :key="r.roleCode"
              :label="r.roleName + ' (' + r.roleCode + ')'"
              :value="r.roleCode"
            />
          </el-select>
        </el-form-item>

        <div class="form-row-two">
          <el-form-item label="联系电话" prop="phone" style="flex: 1">
            <el-input v-model="form.phone" placeholder="11位手机号码" />
          </el-form-item>
          <el-form-item label="电子邮箱" prop="email" style="flex: 1">
            <el-input v-model="form.email" placeholder="工作邮箱" />
          </el-form-item>
        </div>

        <el-form-item label="账号状态">
          <el-radio-group v-model="form.status">
            <el-radio label="ACTIVE">正常允许登录 (ACTIVE)</el-radio>
            <el-radio label="DISABLED">冻结锁定 (DISABLED)</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { rbacApi, type UserItem, type TenantItem, type RoleItem } from '@/api/rbac';

const users = ref<UserItem[]>([]);
const tenants = ref<TenantItem[]>([]);
const roles = ref<RoleItem[]>([]);
const loading = ref(false);
const submitting = ref(false);

const keyword = ref('');
const tenantFilter = ref('');
const statusFilter = ref('');

const dialogVisible = ref(false);
const isEditing = ref(false);

const formRef = ref<FormInstance>();
const form = ref<Partial<UserItem>>({
  username: '',
  realName: '',
  tenantId: '',
  tenantName: '',
  roles: [],
  phone: '',
  email: '',
  status: 'ACTIVE'
});

const rules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  tenantId: [{ required: true, message: '请选择所属租户', trigger: 'change' }],
  roles: [{ required: true, message: '请至少分配一个角色', trigger: 'change' }]
};

const activeUsersCount = computed(() => users.value.filter(u => u.status === 'ACTIVE').length);
const distinctTenantsCount = computed(() => new Set(users.value.map(u => u.tenantId)).size);
const boundRolesCount = computed(() => {
  const set = new Set<string>();
  users.value.forEach(u => (u.roles || []).forEach(r => set.add(r)));
  return set.size;
});

const filteredUsers = computed(() => {
  return users.value.filter(item => {
    if (keyword.value) {
      const q = keyword.value.trim().toLowerCase();
      const m1 = (item.username || '').toLowerCase().includes(q);
      const m2 = (item.realName || '').toLowerCase().includes(q);
      const m3 = (item.phone || '').toLowerCase().includes(q);
      if (!m1 && !m2 && !m3) return false;
    }
    if (tenantFilter.value && item.tenantId !== tenantFilter.value) {
      return false;
    }
    if (statusFilter.value && item.status !== statusFilter.value) {
      return false;
    }
    return true;
  });
});

const getRoleName = (code: string) => {
  const matched = roles.value.find(r => r.roleCode === code);
  return matched ? matched.roleName : code;
};

const onTenantChange = (tid: string) => {
  const matched = tenants.value.find(t => t.id === tid);
  if (matched) {
    form.value.tenantName = matched.tenantName;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [uList, tList, rList] = await Promise.all([
      rbacApi.getUsers(),
      rbacApi.getTenants(),
      rbacApi.getRoles()
    ]);
    users.value = uList;
    tenants.value = tList;
    roles.value = rList;
  } catch (err) {
    console.error('Failed to load user and rbac data', err);
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
  // Query executed silently without toast popup
};

const handleReset = () => {
  keyword.value = '';
  tenantFilter.value = '';
  statusFilter.value = '';
};

const openCreateDialog = () => {
  isEditing.value = false;
  form.value = {
    username: '',
    realName: '',
    tenantId: tenants.value[0]?.id || '',
    tenantName: tenants.value[0]?.tenantName || '',
    roles: [],
    phone: '',
    email: '',
    status: 'ACTIVE'
  };
  dialogVisible.value = true;
};

const openEditDialog = (row: UserItem) => {
  isEditing.value = true;
  form.value = { ...row, roles: [...(row.roles || [])] };
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEditing.value && form.value.id) {
        await rbacApi.updateUser(form.value.id, form.value);
        ElMessage.success(`用户 [${form.value.username}] 信息与角色更新成功！`);
      } else {
        const created = await rbacApi.createUser({
          tenantId: form.value.tenantId,
          username: form.value.username || '',
          displayName: form.value.realName || form.value.username || '',
          roles: form.value.roles || []
        });
        ElMessage.success(`用户 [${created.username}] 创建成功，初始默认密码为 Tcm@2026!Admin`);
      }
      dialogVisible.value = false;
      await loadData();
    } catch (err) {
      ElMessage.error('保存用户失败，请检查输入');
    } finally {
      submitting.value = false;
    }
  });
};

const handleResetPassword = (row: UserItem) => {
  ElMessageBox.confirm(
    `确定要将用户【${row.realName} (${row.username})】的密码重置为系统默认安全口令吗？`,
    '重置用户密码',
    {
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const res = await rbacApi.resetPassword(row.id);
    ElMessageBox.alert(
      `用户 [${row.username}] 密码已成功重置为临时口令：<strong style="color: #0e5f40; font-family: monospace; font-size: 15px;">${res.tempPass}</strong><br>请通知该用户首次登录后立即修改口令。`,
      '密码重置成功',
      { dangerouslyUseHTMLString: true }
    );
  }).catch(() => {});
};

const toggleStatus = async (row: UserItem) => {
  const nextStatus = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  const label = nextStatus === 'ACTIVE' ? '启用' : '锁定停用';
  await rbacApi.updateUser(row.id, { status: nextStatus });
  row.status = nextStatus;
  ElMessage.success(`用户 [${row.username}] 状态已设置为: ${label}`);
};

const confirmDelete = (row: UserItem) => {
  ElMessageBox.confirm(
    `确定删除用户账号【${row.realName} (${row.username})】吗？删除后此账号无法再次登录系统。`,
    '确认删除用户',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await rbacApi.deleteUser(row.id);
    ElMessage.success(`用户 [${row.username}] 已删除`);
    await loadData();
  }).catch(() => {});
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
