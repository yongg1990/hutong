<template>
  <div class="settings-page">
    <PageHeader
      title="角色与权限体系"
      subtitle="基于 RBAC 模型的细粒度功能权限控制、角色权能矩阵与权限点授权"
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
        <span class="label">预置与自定义角色数</span>
        <div class="value">
          <strong class="mono">{{ roles.length }}</strong>
          <span class="unit">个角色</span>
        </div>
        <span class="sub">包含超管、质检、仓储、农事与审计</span>
      </div>

      <div class="kpi-card">
        <span class="label">全域权限字典节点</span>
        <div class="value">
          <strong class="mono brand-color">28</strong>
          <span class="unit">个端点</span>
        </div>
        <span class="sub">支持模块级与按钮级动态鉴权</span>
      </div>

      <div class="kpi-card">
        <span class="label">成员分配覆盖率</span>
        <div class="value">
          <strong class="mono">{{ totalUserBound }}</strong>
          <span class="unit">人次绑定</span>
        </div>
        <span class="sub">遵循最小特权与职责分离原则</span>
      </div>

      <div class="kpi-card">
        <span class="label">安全策略引擎</span>
        <div class="value">
          <strong class="mono text-success">RBAC-v2</strong>
        </div>
        <span class="sub">集成 X-Tenant-Id 租户空间隔离</span>
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
        <span class="sub-text">点击「配置功能权限」可展开全平台 7 大业务板块的精细化权限树</span>
      </div>
      <div class="panel-body">
        <el-table :data="filteredRoles" v-loading="loading" style="width: 100%" empty-text="暂无匹配的角色定义">
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
          <el-table-column label="已授权功能点" width="130" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.permissions?.length || 0 }} 个权限点</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="userCount" label="关联用户数" width="110" align="center">
            <template #default="{ row }">
              <span class="mono">{{ row.userCount }} 人</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="职责与权能描述" min-width="260" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <StatusTag :code="row.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作 / 权限矩阵" width="230" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openPermissionDrawer(row)">
                配置功能权限
              </el-button>
              <el-button size="small" link @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button size="small" type="danger" link @click="confirmDelete(row)">
                删除
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
            node-key="code"
            :default-expanded-keys="['business:all', 'governance:all', 'trust:all', 'settings:all']"
            :props="{ label: 'label', children: 'children' }"
            @check="onTreeCheck"
          >
            <template #default="{ data }">
              <div class="custom-tree-node">
                <span>{{ data.label }}</span>
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
      :title="isEditing ? '编辑角色基础信息' : '创建新角色'"
      width="540px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
        <el-form-item label="角色编码" prop="roleCode">
          <el-input
            v-model="form.roleCode"
            placeholder="如 ROLE_AUDITOR (大写英文字母与下划线)"
            :disabled="isEditing"
          />
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
        <el-form-item label="启用状态">
          <el-radio-group v-model="form.status">
            <el-radio label="ACTIVE">启用 (ACTIVE)</el-radio>
            <el-radio label="DISABLED">停用 (DISABLED)</el-radio>
          </el-radio-group>
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
import { ElMessage, ElMessageBox, type FormInstance, type ElTree } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import {
  rbacApi,
  standardPermissionTree,
  type RoleItem,
  type PermissionNode
} from '@/api/rbac';

const roles = ref<RoleItem[]>([]);
const permissionTree = ref<PermissionNode[]>(standardPermissionTree);
const loading = ref(false);
const submitting = ref(false);
const savingPerms = ref(false);

const keyword = ref('');
const dialogVisible = ref(false);
const drawerVisible = ref(false);
const isEditing = ref(false);

const activeRole = ref<RoleItem | null>(null);
const treeRef = ref<InstanceType<typeof ElTree>>();
const currentCheckedKeys = ref<string[]>([]);

const formRef = ref<FormInstance>();
const form = ref<Partial<RoleItem>>({
  roleCode: '',
  roleName: '',
  tenantId: 'TENANT-YN-DEMO',
  description: '',
  status: 'ACTIVE',
  permissions: []
});

const rules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }]
};

const totalUserBound = computed(() => roles.value.reduce((acc, cur) => acc + (cur.userCount || 0), 0));

const filteredRoles = computed(() => {
  return roles.value.filter(item => {
    if (keyword.value) {
      const q = keyword.value.trim().toLowerCase();
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
    permissionTree.value = pTree;
  } catch (err) {
    console.error('Failed to load roles', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRoles();
});

const handleSearch = () => {
  ElMessage.success('角色筛选完成！');
};

const handleReset = () => {
  keyword.value = '';
};

const openCreateDialog = () => {
  isEditing.value = false;
  form.value = {
    roleCode: '',
    roleName: '',
    tenantId: 'TENANT-YN-DEMO',
    description: '',
    status: 'ACTIVE',
    permissions: ['workspace:view']
  };
  dialogVisible.value = true;
};

const openEditDialog = (row: RoleItem) => {
  isEditing.value = true;
  form.value = { ...row };
  dialogVisible.value = true;
};

const submitRoleForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEditing.value && form.value.id) {
        await rbacApi.updateRole(form.value.id, form.value);
        ElMessage.success(`角色 [${form.value.roleName}] 更新成功！`);
      } else {
        await rbacApi.createRole(form.value as any);
        ElMessage.success(`新角色 [${form.value.roleName}] 创建成功！`);
      }
      dialogVisible.value = false;
      await loadRoles();
    } catch (err) {
      ElMessage.error('保存角色失败，请检查输入');
    } finally {
      submitting.value = false;
    }
  });
};

const openPermissionDrawer = (row: RoleItem) => {
  activeRole.value = row;
  currentCheckedKeys.value = [...(row.permissions || [])];
  drawerVisible.value = true;

  nextTick(() => {
    if (treeRef.value) {
      treeRef.value.setCheckedKeys(currentCheckedKeys.value);
    }
  });
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
    await rbacApi.updateRole(activeRole.value.id, { permissions: checked });
    activeRole.value.permissions = checked;
    ElMessage.success(`角色【${activeRole.value.roleName}】的 ${checked.length} 项功能权限配置已实时生效！`);
    drawerVisible.value = false;
    await loadRoles();
  } catch (err) {
    ElMessage.error('权限保存失败，请重试');
  } finally {
    savingPerms.value = false;
  }
};

const confirmDelete = (row: RoleItem) => {
  ElMessageBox.confirm(
    `确定要删除角色【${row.roleName} (${row.roleCode})】吗？删除后该角色成员的对应授权将被收回。`,
    '确认删除角色',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await rbacApi.deleteRole(row.id);
    ElMessage.success(`角色 [${row.roleName}] 已删除`);
    await loadRoles();
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
