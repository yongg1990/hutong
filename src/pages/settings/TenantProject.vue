<template>
  <div class="settings-page">
    <PageHeader title="项目协同空间" subtitle="创建项目空间，并按项目空间 ID 查询和切换当前业务上下文">
      <template #actions><el-button type="primary" @click="openCreateDialog">创建项目空间</el-button></template>
    </PageHeader>

    <FilterBar @search="loadProject" @reset="handleReset">
      <el-input v-model="projectSpaceId" placeholder="项目空间 ID" clearable style="width: 280px" @keyup.enter="loadProject" />
    </FilterBar>

    <div class="panel" v-loading="loading">
      <div class="panel-header">
        <h2>项目空间详情</h2>
        <el-button v-if="projectSpace" type="primary" @click="switchProject">设为当前项目空间</el-button>
      </div>
      <div class="panel-body">
        <template v-if="projectSpace">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="项目空间 ID"><span class="mono">{{ projectSpace.projectSpaceId }}</span></el-descriptions-item>
            <el-descriptions-item label="租户 ID"><span class="mono">{{ projectSpace.tenantId || '-' }}</span></el-descriptions-item>
            <el-descriptions-item label="项目代码"><span class="mono">{{ projectSpace.projectCode }}</span></el-descriptions-item>
            <el-descriptions-item label="项目名称">{{ projectSpace.projectName }}</el-descriptions-item>
            <el-descriptions-item label="区域代码"><span class="mono">{{ projectSpace.regionCode }}</span></el-descriptions-item>
            <el-descriptions-item label="状态"><StatusTag :code="projectSpace.status" /></el-descriptions-item>
            <el-descriptions-item label="锁版本"><span class="mono">{{ projectSpace.lockVersion ?? '-' }}</span></el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ projectSpace.createdAt || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="scope-section">
            <h3>业务范围</h3>
            <div class="scope-grid">
              <div v-for="item in scopeItems" :key="item.label" class="scope-item">
                <span class="scope-label">{{ item.label }}</span>
                <div class="tag-list">
                  <el-tag v-for="value in item.values" :key="value" size="small" effect="plain">{{ value }}</el-tag>
                  <span v-if="!item.values.length" class="empty-value">无授权范围</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <el-empty v-else description="请输入项目空间 ID 查询" />
      </div>
    </div>

    <el-dialog v-model="createDialogVisible" title="创建项目空间" width="680px" destroy-on-close :close-on-click-modal="false">
      <el-form :model="createForm" label-position="top">
        <div class="form-grid">
          <el-form-item label="项目代码" required><el-input v-model="createForm.projectCode" maxlength="64" show-word-limit /></el-form-item>
          <el-form-item label="项目名称" required><el-input v-model="createForm.projectName" maxlength="200" show-word-limit /></el-form-item>
          <el-form-item label="区域代码" required><el-input v-model="createForm.regionCode" maxlength="32" /></el-form-item>
        </div>
        <el-form-item label="场景代码"><el-select v-model="createForm.businessScope.scenarioCodes" multiple filterable allow-create default-first-option style="width: 100%" /></el-form-item>
        <el-form-item label="授权区域代码"><el-select v-model="createForm.businessScope.regionCodes" multiple filterable allow-create default-first-option style="width: 100%" /></el-form-item>
        <el-form-item label="主体 ID"><el-select v-model="createForm.businessScope.partyIds" multiple filterable allow-create default-first-option style="width: 100%" /></el-form-item>
        <el-form-item label="业务对象类型"><el-select v-model="createForm.businessScope.objectTypes" multiple filterable allow-create default-first-option style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createProject">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useContextStore } from '@/stores/contextStore';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { settingsApi, type ProjectSpaceCreateRequest, type ProjectSpaceResponse } from '@/api/settings';
import { apiErrorMessage } from '@/api/client';

const contextStore = useContextStore();
const projectSpaceId = ref('');
const projectSpace = ref<ProjectSpaceResponse | null>(null);
const loading = ref(false);
const creating = ref(false);
const createDialogVisible = ref(false);

const emptyCreateForm = (): ProjectSpaceCreateRequest => ({
  projectCode: '', projectName: '', regionCode: '',
  businessScope: { scenarioCodes: [], regionCodes: [], partyIds: [], objectTypes: [] }
});
const createForm = ref<ProjectSpaceCreateRequest>(emptyCreateForm());

const scopeItems = computed(() => [
  { label: '场景代码', values: projectSpace.value?.businessScope?.scenarioCodes || [] },
  { label: '区域代码', values: projectSpace.value?.businessScope?.regionCodes || [] },
  { label: '主体 ID', values: projectSpace.value?.businessScope?.partyIds || [] },
  { label: '业务对象类型', values: projectSpace.value?.businessScope?.objectTypes || [] }
]);

const validId = (value: string) => /^[0-9]+$/.test(value.trim());

const loadProject = async () => {
  const id = projectSpaceId.value.trim();
  if (!validId(id)) {
    projectSpace.value = null;
    ElMessage.warning('请输入有效的项目空间 ID');
    return;
  }
  loading.value = true;
  try {
    projectSpace.value = await settingsApi.getProjectSpaceById(id);
  } catch (err) {
    projectSpace.value = null;
    ElMessage.error(apiErrorMessage(err, '项目空间查询失败'));
  } finally {
    loading.value = false;
  }
};

const handleReset = () => { projectSpaceId.value = ''; projectSpace.value = null; };

const switchProject = () => {
  if (!projectSpace.value) return;
  const id = String(projectSpace.value.projectSpaceId);
  contextStore.switchProject(id, projectSpace.value.projectName);
  localStorage.setItem('tcmirp_project_space_id', id);
  ElMessage.success(`当前项目空间已切换为：${projectSpace.value.projectName}`);
};

const openCreateDialog = () => { createForm.value = emptyCreateForm(); createDialogVisible.value = true; };

const createProject = async () => {
  if (!createForm.value.projectCode.trim() || !createForm.value.projectName.trim() || !createForm.value.regionCode.trim()) {
    ElMessage.warning('请填写项目代码、项目名称和区域代码');
    return;
  }
  creating.value = true;
  try {
    const created = await settingsApi.createProjectSpace(createForm.value);
    projectSpace.value = created;
    projectSpaceId.value = String(created.projectSpaceId);
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
.settings-page { width: 100%; padding-bottom: 24px; }
.panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; min-height: 54px; padding: 0 16px; border-bottom: 1px solid var(--color-border); background: #fbfdfc; }
.panel-header h2, .scope-section h3 { margin: 0; font-size: 15px; }
.panel-body { padding: 16px; }
.scope-section { margin-top: 20px; }
.scope-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
.scope-item { min-height: 72px; padding: 12px; border: 1px solid var(--color-border); border-radius: 6px; }
.scope-label { display: block; margin-bottom: 8px; color: var(--color-muted); font-size: 12px; }
.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
.empty-value { color: var(--color-muted); font-size: 13px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 14px; }
@media (max-width: 720px) { .scope-grid, .form-grid { grid-template-columns: 1fr; } }
</style>
