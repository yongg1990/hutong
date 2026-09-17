<template>
  <div class="settings-page">
    <PageHeader
      title="角色与权限体系"
      subtitle="角色目录与功能权限授权"
    >
      <template #actions>
        <el-button @click="loadRoles">刷新角色</el-button>
        <el-button type="primary" @click="openCreateDialog">
          + 新增业务角色
        </el-button>
      </template>
    </PageHeader>

    <!-- Top KPI Row -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="label">角色数</span>
        <div class="value">
          <strong class="mono">{{ roles.length }}</strong>
          <span class="unit">个角色</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="label">全域权限字典节点</span>
        <div class="value">
          <strong class="mono brand-color">{{ permissionCount }}</strong>
          <span class="unit">项</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input
        v-model="keyword"
        placeholder="角色编码 (ROLE_*) / 角色名称"
        style="width: 260px"
        clearable
      />
    </FilterBar>

    <!-- Roles Table Panel -->
    <div class="panel">
      <div class="panel-header">
        <h2>系统角色权能清单 ({{ filteredRoles.length }})</h2>
      </div>
      <div class="panel-body">
        <el-table :data="filteredRoles" v-loading="loading" style="width: 100%" empty-text="暂无匹配的角色定义">
          <el-table-column prop="roleId" label="角色 ID" width="110" />
          <el-table-column prop="tenantId" label="租户 ID" width="110" />
          <el-table-column prop="roleCode" label="角色标识编码" min-width="170" class-name="mono">
            <template #default="{ row }">
              <span class="role-code-text">{{ row.roleCode }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="roleName" label="角色名称" min-width="160">
            <template #default="{ row }">
              <strong>{{ row.roleName }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="职责与权能描述" min-width="220" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <StatusTag :code="row.status" :label="row.status === 'ACTIVE' ? '启用' : '停用'" />
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="170" />
          <el-table-column prop="updatedAt" label="更新时间" width="170" />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openPermissionDrawer(row)">
                配置功能权限
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Permission Assignment Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="'配置角色权限: ' + (activeRole?.roleName || '')"
      size="560px"
      v-loading="loadingPerms"
    >
      <div v-if="activeRole" class="drawer-perm-content">
        <div class="perm-banner">
          <div class="perm-role-name">{{ activeRole.roleName }}</div>
          <div class="mono text-muted">标识符: {{ activeRole.roleCode }}</div>
          <div style="font-size: 12px; margin-top: 4px; color: var(--color-text);">
            已选择 <b class="brand-color">{{ currentCheckedKeys.length }}</b> 项功能权限点
          </div>
        </div>

        <div class="tree-tools">
          <el-button size="small" @click="checkAllNodes">全选所有权限</el-button>
          <el-button size="small" @click="uncheckAllNodes">全部清空</el-button>
          <el-button size="small" @click="expandAllNodes">全部展开</el-button>
          <el-button size="small" @click="collapseAllNodes">全部折叠</el-button>
        </div>

        <div class="tree-container">
          <el-tree
            ref="treeRef"
            :data="permissionTree"
            show-checkbox
            check-strictly
            node-key="code"
            :props="{ label: 'label', children: 'children' }"
            @check="onTreeCheck"
          >
            <template #default="{ data }">
              <div class="custom-tree-node">
                <div class="tree-node-main">
                  <span>{{ data.label }}</span>
                  <span class="tree-node-detail mono">
                    ID: {{ data.permissionId || data.id }} | 模块: {{ data.moduleCode || '-' }} |
                    类型: {{ data.permissionType || '-' }} | 上级: {{ data.parentId || '-' }} | 状态: {{ data.status || '-' }}
                  </span>
                  <span v-if="data.apiMethod || data.apiPath" class="tree-node-detail mono">
                    {{ data.apiMethod || '-' }} {{ data.apiPath || '-' }}
                  </span>
                </div>
                <span class="tree-code-tag mono">{{ data.code }}</span>
              </div>
            </template>
          </el-tree>
        </div>

        <div class="drawer-foot">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingPerms" @click="savePermissions">
            确认并保存权限配置
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- Create / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      title="创建新角色"
      width="540px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
        <el-form-item label="角色编码" prop="roleCode">
          <el-input
            v-model="form.roleCode"
            placeholder="如 ROLE_AUDITOR (大写英文字母与下划线)"
          />
        </el-form-item>
        <el-form-item label="租户 ID">
          <el-input-number v-model="roleTenantId" :min="1" placeholder="留空创建平台角色" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="如 业务协同审计员" />
        </el-form-item>
        <el-form-item label="职责描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="说明该角色在产业链协同中的岗位职责及数据访问范围"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRoleForm">保存提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage, type FormInstance, type ElTree } from 'element-plus';
import { apiErrorMessage } from '@/api/client';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import {
  rbacApi,
  type RoleItem,
  type PermissionNode
} from '@/api/rbac';

const roles = ref<RoleItem[]>([]);
const permissionTree = ref<PermissionNode[]>([]);
const permissionCount = ref(0);
const loading = ref(false);
const submitting = ref(false);
const savingPerms = ref(false);
const loadingPerms = ref(false);

const keyword = ref('');
const appliedKeyword = ref('');
const dialogVisible = ref(false);
const drawerVisible = ref(false);

const activeRole = ref<RoleItem | null>(null);
const treeRef = ref<InstanceType<typeof ElTree>>();
const currentCheckedKeys = ref<string[]>([]);

const formRef = ref<FormInstance>();
const roleTenantId = ref<number | undefined>();
const form = ref<Partial<RoleItem>>({
  roleCode: '',
  roleName: '',
  description: '',
});

const rules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
};

const filteredRoles = computed(() => {
  return roles.value.filter(item => {
    if (appliedKeyword.value) {
      const q = appliedKeyword.value.toLowerCase();
      const m1 = (item.roleCode || '').toLowerCase().includes(q);
      const m2 = (item.roleName || '').toLowerCase().includes(q);
      if (!m1 && !m2) return false;
    }
    return true;
  });
});

const loadRoles = async () => {
  loading.value = true;
  try {
    const [rList, pTree] = await Promise.all([
      rbacApi.getRoles(),
      rbacApi.getPermissionTree()
    ]);
    roles.value = rList;
    permissionCount.value = pTree.length;
  } catch (err) {
    roles.value = [];
    permissionCount.value = 0;
    ElMessage.error(apiErrorMessage(err, '角色与权限加载失败'));
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRoles();
});

const handleSearch = () => {
  appliedKeyword.value = keyword.value.trim();
};

const handleReset = () => {
  keyword.value = '';
  appliedKeyword.value = '';
};

const openCreateDialog = () => {
  form.value = {
    roleCode: '',
    roleName: '',
    description: ''
  };
  roleTenantId.value = undefined;
  dialogVisible.value = true;
};

const submitRoleForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      await rbacApi.createRole({ roleCode: form.value.roleCode!, roleName: form.value.roleName!,
        description: form.value.description }, roleTenantId.value);
      ElMessage.success(`新角色 [${form.value.roleName}] 创建成功！`);
      dialogVisible.value = false;
      await loadRoles();
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, '保存角色失败，请检查输入'));
    } finally {
      submitting.value = false;
    }
  });
};

const openPermissionDrawer = async (row: RoleItem) => {
  activeRole.value = row;
  permissionTree.value = [];
  currentCheckedKeys.value = [];
  drawerVisible.value = true;
  loadingPerms.value = true;
  try {
    const permissions = await rbacApi.getRolePermissions(row.id);
    permissionTree.value = buildPermissionTree(permissions);
    currentCheckedKeys.value = permissions.filter(p => p.granted).map(p => p.code);
    await nextTick();
    treeRef.value?.setCheckedKeys(currentCheckedKeys.value);
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '角色权限加载失败'));
    drawerVisible.value = false;
  } finally {
    loadingPerms.value = false;
  }
};

const buildPermissionTree = (permissions: PermissionNode[]): PermissionNode[] => {
  const byId = new Map(permissions.map(p => [String(p.id), { ...p, children: [] as PermissionNode[] }]));
  const roots: PermissionNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId == null ? undefined : byId.get(String(node.parentId));
    if (parent && parent !== node) parent.children!.push(node);
    else roots.push(node);
  }
  return roots;
};

const onTreeCheck = () => {
  if (treeRef.value) {
    currentCheckedKeys.value = treeRef.value.getCheckedKeys(false) as string[];
  }
};

const checkAllNodes = () => {
  const getAllCodes = (nodes: PermissionNode[]): string[] => {
    let res: string[] = [];
    for (const n of nodes) {
      res.push(n.code);
      if (n.children) res = res.concat(getAllCodes(n.children));
    }
    return res;
  };
  const all = getAllCodes(permissionTree.value);
  if (treeRef.value) {
    treeRef.value.setCheckedKeys(all);
    currentCheckedKeys.value = all;
  }
};

const uncheckAllNodes = () => {
  if (treeRef.value) {
    treeRef.value.setCheckedKeys([]);
    currentCheckedKeys.value = [];
  }
};

const expandAllNodes = () => {
  if (treeRef.value) {
    const nodes = (treeRef.value as any).store._getAllNodes();
    for (const n of nodes) n.expanded = true;
  }
};

const collapseAllNodes = () => {
  if (treeRef.value) {
    const nodes = (treeRef.value as any).store._getAllNodes();
    for (const n of nodes) n.expanded = false;
  }
};

const savePermissions = async () => {
  if (!activeRole.value) return;
  savingPerms.value = true;
  try {
    const checked = treeRef.value?.getCheckedKeys(false) as string[] || [];
    await rbacApi.assignRolePermissions(activeRole.value.id, checked);
    ElMessage.success(`角色【${activeRole.value.roleName}】的 ${checked.length} 项功能权限配置已实时生效！`);
    drawerVisible.value = false;
    await loadRoles();
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '权限保存失败，请重试'));
  } finally {
    savingPerms.value = false;
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

.role-code-text {
  font-weight: 700;
  color: var(--color-brand);
}

.drawer-perm-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 14px;
}

.perm-banner {
  background: #edf6f1;
  border: 1px solid #cce5d7;
  border-radius: 6px;
  padding: 12px 14px;
}

.perm-role-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-brand);
}

.tree-tools {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tree-container {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  background: #ffffff;
  overflow-y: auto;
  max-height: calc(100vh - 280px);
}

.custom-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 12px;
  font-size: 13px;
}

.tree-node-main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}

.tree-node-detail {
  color: var(--color-muted);
  font-size: 10px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.tree-code-tag {
  font-size: 11px;
  color: var(--color-muted);
  background: #f1f6f3;
  padding: 1px 6px;
  border-radius: 3px;
}

.drawer-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}
</style>
