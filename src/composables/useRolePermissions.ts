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

export function useRolePermissions() {
const roles = ref<RoleItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
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
const roleTenantId = ref('');
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
    const countPermissions = (nodes: PermissionNode[]): number => nodes.reduce((total, node) => total + 1 + countPermissions(node.children || []), 0);
    permissionCount.value = countPermissions(pTree);
  } catch (err) {
    roles.value = [];
    total.value = 0;
    permissionCount.value = 0;
    ElMessage.error(apiErrorMessage(err, '角色与权限加载失败'));
  } finally {
    loading.value = false;
  }
};
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
const openPermissionCreate = () => {
  editingPermission.value = null;
  permissionForm.value = { permissionCode: '', permissionName: '', moduleCode: '', permissionType: '', parentId: '', apiMethod: '', apiPath: '', status: 'ACTIVE' };
  permissionFormRef.value?.clearValidate(); permissionEditVisible.value = true;
};
const openPermissionEdit = (item: PermissionNode) => {
  permissionFormRef.value?.clearValidate();
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
  if (!permissionFormRef.value) return;
  const valid = await permissionFormRef.value.validate().catch(() => false);
  if (!valid) return;
  savingPermissionItem.value = true;
  try {
    const form = permissionForm.value;
    const data = { permissionCode: form.permissionCode.trim(), permissionName: form.permissionName.trim(), moduleCode: form.moduleCode.trim(), permissionType: form.permissionType, parentId: form.parentId ? String(form.parentId) : undefined, apiMethod: form.apiMethod?.trim() || undefined, apiPath: form.apiPath?.trim() || undefined };
    if (editingPermission.value) await rbacApi.updatePermission(editingPermission.value.id, { ...data, status: form.status });
    else await rbacApi.createPermission(data);
    ElMessage.success(editingPermission.value ? '权限修改成功' : '权限创建成功');
    permissionEditVisible.value = false;
    await loadPermissionItems();
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '权限修改失败'));
  } finally {
    savingPermissionItem.value = false;
  }
};
const confirmDeletePermission = async (item: PermissionNode) => {
  if (savingPermissionItem.value) return;
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
  roleTenantId.value = '';
  dialogVisible.value = true;
};
const submitRoleForm = async () => {
  if (roleTenantId.value.trim() && !/^\d+$/.test(roleTenantId.value.trim())) return ElMessage.warning('租户 ID 必须是数字字符串');
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      await rbacApi.createRole({ roleCode: form.value.roleCode!, roleName: form.value.roleName!,
        description: form.value.description }, roleTenantId.value.trim() || undefined);
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
    permissionTree.value = permissions;
    const flatten = (nodes: PermissionNode[]): PermissionNode[] => nodes.flatMap(node => [node, ...flatten(node.children || [])]);
    currentCheckedKeys.value = flatten(permissions).filter(p => p.granted).map(p => p.code);
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
return { roles, total, page, pageSize, permissionTree, permissionCount, permissionItems, permissionNameFilter, filteredPermissionTree, permissionManagerVisible, permissionEditVisible, loadingPermissionItems, savingPermissionItem, editingPermission, permissionFormRef, permissionForm, permissionRules, parentOptions, loading, submitting, savingPerms, loadingPerms, tenantFilter, appliedTenantId, dialogVisible, drawerVisible, activeRole, treeRef, currentCheckedKeys, formRef, roleTenantId, form, rules, loadRoles, handleSearch, handleReset, handleSizeChange, loadPermissionItems, openPermissionManager, openPermissionCreate, openPermissionEdit, savePermissionItem, confirmDeletePermission, openCreateDialog, submitRoleForm, openPermissionDrawer, buildPermissionTree, syncParentChecks, updateParentIndeterminate, onTreeCheck, checkAllNodes, uncheckAllNodes, expandAllNodes, collapseAllNodes, savePermissions };
}
