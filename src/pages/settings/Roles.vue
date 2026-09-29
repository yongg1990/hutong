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

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="tenantFilter" placeholder="租户 ID（留空查询全部）" style="width: 260px" clearable />
    </FilterBar>

    <!-- Roles Table Panel -->
    <div class="panel">
      <div class="panel-header">
        <h2>系统角色权能清单 ({{ total }})</h2>
        <div class="dictionary-actions">
          <span class="sub-text">权限字典 {{ permissionCount }} 项</span>
          <el-button link @click="openPermissionManager">管理字典</el-button>
        </div>
      </div>
      <div class="panel-body">
        <el-table :data="roles" v-loading="loading" style="width: 100%" empty-text="暂无匹配的角色定义">
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
                编辑权限
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-row">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next"
            @current-change="loadRoles"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <!-- Permission Assignment Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="'编辑角色权限: ' + (activeRole?.roleName || '')"
      size="min(960px, 96vw)"
      v-loading="loadingPerms"
      :close-on-click-modal="false"
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

    <el-dialog v-model="permissionManagerVisible" title="编辑权限" width="min(960px, 96vw)" class="permission-manager-dialog" :close-on-click-modal="false">
      <el-input v-model="permissionNameFilter" placeholder="搜索权限名称" clearable class="permission-search" />
      <el-table
        :key="permissionNameFilter.trim() ? 'search' : 'all'"
        :data="filteredPermissionTree"
        :row-key="row => String(row.id)"
        :tree-props="{ children: 'children' }"
        :default-expand-all="!!permissionNameFilter.trim()"
        v-loading="loadingPermissionItems"
        height="min(520px, calc(80vh - 160px))"
        style="width: 100%"
        empty-text="暂无匹配的权限"
      >
        <el-table-column prop="label" label="权限名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="code" label="权限编码" min-width="180" show-overflow-tooltip />
        <el-table-column prop="moduleCode" label="模块" width="110" />
        <el-table-column prop="permissionType" label="类型" width="100" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openPermissionEdit(row)">修改</el-button>
            <el-button link type="danger" @click="confirmDeletePermission(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="permissionEditVisible" title="修改权限" width="560px" append-to-body destroy-on-close :close-on-click-modal="false">
      <el-form ref="permissionFormRef" :model="permissionForm" :rules="permissionRules" label-width="100px">
        <el-form-item label="权限编码" prop="permissionCode">
          <el-input v-model="permissionForm.permissionCode" />
        </el-form-item>
        <el-form-item label="权限名称" prop="permissionName">
          <el-input v-model="permissionForm.permissionName" />
        </el-form-item>
        <el-form-item label="模块编码" prop="moduleCode">
          <el-input v-model="permissionForm.moduleCode" />
        </el-form-item>
        <el-form-item label="权限类型" prop="permissionType">
          <el-select v-model="permissionForm.permissionType" style="width: 100%">
            <el-option label="目录" value="directory" />
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
          </el-select>
        </el-form-item>
        <el-form-item label="上级权限">
          <el-select v-model="permissionForm.parentId" placeholder="根节点" clearable style="width: 100%">
            <el-option v-for="item in parentOptions" :key="item.id" :label="item.label + ' (' + item.code + ')'" :value="String(item.id)" />
          </el-select>
        </el-form-item>
        <el-form-item label="API 方法">
          <el-input v-model="permissionForm.apiMethod" />
        </el-form-item>
        <el-form-item label="API 路径">
          <el-input v-model="permissionForm.apiPath" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="permissionForm.status" style="width: 100%">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="INACTIVE" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permissionEditVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPermissionItem" @click="savePermissionItem">保存</el-button>
      </template>
    </el-dialog>

    <!-- Create / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      title="创建新角色"
      width="540px"
      destroy-on-close
      :close-on-click-modal="false"
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
import { ElMessage, ElMessageBox, type FormInstance, type ElTree } from 'element-plus';
import { apiErrorMessage } from '@/api/client';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import {
  rbacApi,
  type RoleItem,
  type PermissionNode,
  type PermissionUpdateRequest
} from '@/api/rbac';

const roles = ref<RoleItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const permissionTree = ref<PermissionNode[]>([]);
const permissionCount = ref(0);
const permissionItems = ref<PermissionNode[]>([]);
const permissionNameFilter = ref('');
const filteredPermissionTree = computed(() => {
  const tree = buildPermissionTree(permissionItems.value);
  const keyword = permissionNameFilter.value.trim().toLowerCase();
  if (!keyword) return tree;
  const filter = (nodes: PermissionNode[]): PermissionNode[] => nodes.flatMap(node => {
    if (node.label.toLowerCase().includes(keyword)) return [node];
    const children = filter(node.children || []);
    return children.length ? [{ ...node, children }] : [];
  });
  return filter(tree);
});
const permissionManagerVisible = ref(false);
const permissionEditVisible = ref(false);
const loadingPermissionItems = ref(false);
const savingPermissionItem = ref(false);
const editingPermission = ref<PermissionNode | null>(null);
const permissionFormRef = ref<FormInstance>();
const permissionForm = ref<PermissionUpdateRequest>({
  permissionCode: '', permissionName: '', moduleCode: '', permissionType: '',
  parentId: '', apiMethod: '', apiPath: '', status: 'ACTIVE'
});
const permissionRules = {
  permissionCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  permissionName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  moduleCode: [{ required: true, message: '请输入模块编码', trigger: 'blur' }],
  permissionType: [{ required: true, message: '请选择权限类型', trigger: 'change' }]
};
const parentOptions = computed(() => {
  const excluded = new Set<string>();
  if (editingPermission.value) {
    excluded.add(String(editingPermission.value.id));
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of permissionItems.value) {
        if (item.parentId != null && excluded.has(String(item.parentId)) && !excluded.has(String(item.id))) {
          excluded.add(String(item.id));
          changed = true;
        }
      }
    }
  }
  return permissionItems.value.filter(item => !excluded.has(String(item.id)));
});
const loading = ref(false);
const submitting = ref(false);
const savingPerms = ref(false);
const loadingPerms = ref(false);

const tenantFilter = ref('');
const appliedTenantId = ref('');
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

const loadRoles = async () => {
  loading.value = true;
  try {
    const [result, pTree] = await Promise.all([
      rbacApi.getRolePage({ tenantId: appliedTenantId.value, page: page.value, size: pageSize.value }),
      rbacApi.getPermissionTree()
    ]);
    roles.value = result.records;
    total.value = result.total;
    page.value = result.page;
    pageSize.value = result.size;
    permissionCount.value = pTree.length;
  } catch (err) {
    roles.value = [];
    total.value = 0;
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
  appliedTenantId.value = tenantFilter.value.trim();
  page.value = 1;
  loadRoles();
};

const handleReset = () => {
  tenantFilter.value = '';
  appliedTenantId.value = '';
  page.value = 1;
  loadRoles();
};

const handleSizeChange = () => {
  page.value = 1;
  loadRoles();
};

const loadPermissionItems = async () => {
  loadingPermissionItems.value = true;
  try {
    permissionItems.value = await rbacApi.getPermissions();
    permissionCount.value = permissionItems.value.length;
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '权限列表加载失败'));
  } finally {
    loadingPermissionItems.value = false;
  }
};

const openPermissionManager = () => {
  permissionNameFilter.value = '';
  permissionManagerVisible.value = true;
  loadPermissionItems();
};

const openPermissionEdit = (item: PermissionNode) => {
  editingPermission.value = item;
  permissionForm.value = {
    permissionCode: item.code,
    permissionName: item.label,
    moduleCode: item.moduleCode || '',
    permissionType: item.permissionType || '',
    parentId: item.parentId == null ? '' : String(item.parentId),
    apiMethod: item.apiMethod || '',
    apiPath: item.apiPath || '',
    status: item.status || 'ACTIVE'
  };
  permissionEditVisible.value = true;
};

const savePermissionItem = async () => {
  if (!editingPermission.value || !permissionFormRef.value) return;
  const valid = await permissionFormRef.value.validate().catch(() => false);
  if (!valid) return;
  savingPermissionItem.value = true;
  try {
    const data = { ...permissionForm.value, parentId: permissionForm.value.parentId || null };
    await rbacApi.updatePermission(editingPermission.value.id, data);
    ElMessage.success('权限修改成功');
    permissionEditVisible.value = false;
    await loadPermissionItems();
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '权限修改失败'));
  } finally {
    savingPermissionItem.value = false;
  }
};

const confirmDeletePermission = async (item: PermissionNode) => {
  try {
    await ElMessageBox.confirm('确定删除权限【' + item.label + '】吗？', '删除权限', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    });
  } catch {
    return;
  }
  try {
    await rbacApi.deletePermission(item.id);
    ElMessage.success('权限删除成功');
    await loadPermissionItems();
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '权限删除失败'));
  }
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
    syncParentChecks();
    await nextTick();
    treeRef.value?.setCheckedKeys(currentCheckedKeys.value);
    updateParentIndeterminate();
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

const syncParentChecks = () => {
  const checked = new Set(currentCheckedKeys.value);
  const visit = (node: PermissionNode): boolean => {
    if (!node.children?.length) return checked.has(node.code);
    const allChildrenChecked = node.children.map(visit).every(Boolean);
    if (allChildrenChecked) checked.add(node.code);
    else checked.delete(node.code);
    return allChildrenChecked;
  };
  permissionTree.value.forEach(visit);
  currentCheckedKeys.value = [...checked];
};

const updateParentIndeterminate = () => {
  const checked = new Set(currentCheckedKeys.value);
  const visit = (node: PermissionNode): boolean => {
    const descendantChecked = node.children?.map(visit).some(Boolean) ?? false;
    const treeNode = treeRef.value?.getNode(node.code);
    if (treeNode) treeNode.indeterminate = !checked.has(node.code) && descendantChecked;
    return checked.has(node.code) || descendantChecked;
  };
  permissionTree.value.forEach(visit);
};

const onTreeCheck = (data: PermissionNode) => {
  if (!treeRef.value) return;
  const checked = new Set(treeRef.value.getCheckedKeys(false) as string[]);
  const isChecked = checked.has(data.code);
  const updateDescendants = (node: PermissionNode) => {
    for (const child of node.children || []) {
      if (isChecked) checked.add(child.code);
      else checked.delete(child.code);
      updateDescendants(child);
    }
  };
  updateDescendants(data);
  currentCheckedKeys.value = [...checked];
  syncParentChecks();
  treeRef.value.setCheckedKeys(currentCheckedKeys.value);
  updateParentIndeterminate();
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
    updateParentIndeterminate();
  }
};

const uncheckAllNodes = () => {
  if (treeRef.value) {
    treeRef.value.setCheckedKeys([]);
    currentCheckedKeys.value = [];
    updateParentIndeterminate();
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

.dictionary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

.perm-banner .mono {
  overflow-wrap: anywhere;
}

.tree-tools {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tree-container {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  background: #ffffff;
  overflow-y: auto;
  max-height: calc(100vh - 280px);
}

.permission-search {
  width: 260px;
  margin-bottom: 12px;
}

.tree-container :deep(.el-tree-node__content) {
  height: auto;
  min-height: 32px;
  align-items: flex-start;
  padding-top: 6px;
  padding-bottom: 6px;
}

.tree-container :deep(.el-tree-node__expand-icon),
.tree-container :deep(.el-checkbox) {
  margin-top: 2px;
}

.custom-tree-node {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
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
  max-width: 38%;
  overflow-wrap: anywhere;
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
