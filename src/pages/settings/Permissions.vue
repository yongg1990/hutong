<template>
<div>
<PageHeader title="权限管理" />
      <div class="query-surface">
        <el-input v-model="permissionNameFilter" placeholder="搜索权限名称" clearable class="permission-search" />
        <el-button type="primary" @click="openPermissionCreate">新增权限</el-button>
      </div>
      <div class="table-surface">
        <LocalPaginatedTable
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
        </LocalPaginatedTable>
      </div>
    <el-dialog v-model="permissionEditVisible" :title="editingPermission ? '修改权限' : '新增权限'" width="560px" append-to-body destroy-on-close :close-on-click-modal="false">
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


</div>
</template>
<script setup lang="ts">
import LocalPaginatedTable from '@/components/common/LocalPaginatedTable.vue';
import { onMounted } from 'vue';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { useRolePermissions } from '@/composables/useRolePermissions';
const state = useRolePermissions();
const { roles, total, page, pageSize, permissionTree, permissionCount, permissionItems, permissionNameFilter, filteredPermissionTree, permissionManagerVisible, permissionEditVisible, loadingPermissionItems, savingPermissionItem, editingPermission, permissionFormRef, permissionForm, permissionRules, parentOptions, loading, submitting, savingPerms, loadingPerms, tenantFilter, appliedTenantId, dialogVisible, drawerVisible, activeRole, treeRef, currentCheckedKeys, formRef, roleTenantId, form, rules, loadRoles, handleSearch, handleReset, handleSizeChange, loadPermissionItems, openPermissionManager, openPermissionCreate, openPermissionEdit, savePermissionItem, confirmDeletePermission, openCreateDialog, submitRoleForm, openPermissionDrawer, buildPermissionTree, syncParentChecks, updateParentIndeterminate, onTreeCheck, checkAllNodes, uncheckAllNodes, expandAllNodes, collapseAllNodes, savePermissions } = state;
onMounted(() => { void loadPermissionItems(); });
</script>
<style scoped>.permission-search{max-width:260px;margin:0 12px 12px}</style>
