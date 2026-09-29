<template>
  <div class="settings-page">
    <PageHeader title="前置节点部署" subtitle="登记部署实例，并按部署实例 ID 查询配置与运行状态">
      <template #actions><el-button type="primary" @click="openCreateDialog">登记部署实例</el-button></template>
    </PageHeader>

    <FilterBar @search="loadInstance" @reset="handleReset">
      <el-input v-model="instanceId" placeholder="部署实例 ID" clearable style="width: 280px" @keyup.enter="loadInstance" />
    </FilterBar>

    <div class="panel" v-loading="loading">
      <div class="panel-header"><h2>部署实例详情</h2></div>
      <div class="panel-body">
        <template v-if="instance">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="部署实例 ID"><span class="mono">{{ instance.deploymentInstanceId }}</span></el-descriptions-item>
            <el-descriptions-item label="租户 ID"><span class="mono">{{ instance.tenantId || '-' }}</span></el-descriptions-item>
            <el-descriptions-item label="实例代码"><span class="mono">{{ instance.instanceCode }}</span></el-descriptions-item>
            <el-descriptions-item label="部署模式">{{ instance.deploymentMode }}</el-descriptions-item>
            <el-descriptions-item label="运行环境">{{ instance.environment }}</el-descriptions-item>
            <el-descriptions-item label="区域代码"><span class="mono">{{ instance.regionCode }}</span></el-descriptions-item>
            <el-descriptions-item label="运行状态"><StatusTag :code="instance.status" /></el-descriptions-item>
            <el-descriptions-item label="配置版本"><span class="mono">{{ instance.version || '-' }}</span></el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">{{ instance.createdAt || '-' }}</el-descriptions-item>
          </el-descriptions>
          <div class="capability-section">
            <h3>能力及版本配置</h3>
            <el-table :data="capabilityRows" empty-text="暂无能力配置">
              <el-table-column prop="key" label="配置项" min-width="200" class-name="mono" />
              <el-table-column label="配置值" min-width="320">
                <template #default="{ row }"><span class="mono value-text">{{ formatValue(row.value) }}</span></template>
              </el-table-column>
            </el-table>
          </div>
        </template>
        <el-empty v-else description="请输入部署实例 ID 查询" />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="登记部署实例" width="620px" destroy-on-close :close-on-click-modal="false">
      <el-form :model="form" label-position="top">
        <div class="form-grid">
          <el-form-item label="实例代码" required><el-input v-model="form.instanceCode" maxlength="64" show-word-limit /></el-form-item>
          <el-form-item label="部署模式" required>
            <el-select v-model="form.deploymentMode" style="width: 100%">
              <el-option v-for="mode in deploymentModes" :key="mode" :label="mode" :value="mode" />
            </el-select>
          </el-form-item>
          <el-form-item label="运行环境" required><el-input v-model="form.environment" /></el-form-item>
          <el-form-item label="区域代码" required><el-input v-model="form.regionCode" /></el-form-item>
        </div>
        <el-form-item label="能力及版本配置 JSON" required>
          <JsonEditor v-model="capabilitiesText" :rows="7" label="能力及版本配置 JSON" placeholder="请输入 JSON 对象" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="createInstance">登记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import JsonEditor from '@/components/common/JsonEditor.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { settingsApi, type DeploymentInstanceCreateRequest, type DeploymentInstanceResponse } from '@/api/settings';
import { apiErrorMessage } from '@/api/client';

const deploymentModes: DeploymentInstanceCreateRequest['deploymentMode'][] = ['SAAS', 'DEDICATED', 'HYBRID', 'EDGE_ONLY'];
const instanceId = ref('');
const instance = ref<DeploymentInstanceResponse | null>(null);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const capabilitiesText = ref('{}');
const emptyForm = (): DeploymentInstanceCreateRequest => ({
  instanceCode: '', deploymentMode: 'HYBRID', environment: '', regionCode: '', capabilities: {}
});
const form = ref<DeploymentInstanceCreateRequest>(emptyForm());

const capabilityRows = computed(() => Object.entries(instance.value?.capabilities || {}).map(([key, value]) => ({ key, value })));
const validId = (value: string) => /^[0-9]+$/.test(value.trim());
const formatValue = (value: unknown) => typeof value === 'string' ? value : JSON.stringify(value);

const loadInstance = async () => {
  const id = instanceId.value.trim();
  if (!validId(id)) {
    instance.value = null;
    ElMessage.warning('请输入有效的部署实例 ID');
    return;
  }
  loading.value = true;
  try {
    instance.value = await settingsApi.getDeploymentInstanceById(id);
  } catch (err) {
    instance.value = null;
    ElMessage.error(apiErrorMessage(err, '部署实例查询失败'));
  } finally {
    loading.value = false;
  }
};

const handleReset = () => { instanceId.value = ''; instance.value = null; };

const openCreateDialog = () => {
  form.value = emptyForm();
  capabilitiesText.value = '{}';
  dialogVisible.value = true;
};

const createInstance = async () => {
  if (!form.value.instanceCode.trim() || !form.value.environment.trim() || !form.value.regionCode.trim()) {
    ElMessage.warning('请填写实例代码、运行环境和区域代码');
    return;
  }
  let capabilities: unknown;
  try {
    capabilities = JSON.parse(capabilitiesText.value);
  } catch {
    ElMessage.warning('能力及版本配置必须是有效 JSON');
    return;
  }
  if (!capabilities || Array.isArray(capabilities) || typeof capabilities !== 'object') {
    ElMessage.warning('能力及版本配置必须是 JSON 对象');
    return;
  }
  saving.value = true;
  try {
    const created = await settingsApi.createDeploymentInstance({ ...form.value, capabilities: capabilities as Record<string, unknown> });
    instance.value = created;
    instanceId.value = String(created.deploymentInstanceId);
    dialogVisible.value = false;
    ElMessage.success('部署实例登记成功');
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '部署实例登记失败'));
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.settings-page { width: 100%; padding-bottom: 24px; }
.panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; }
.panel-header { display: flex; align-items: center; min-height: 54px; padding: 0 16px; border-bottom: 1px solid var(--color-border); background: #fbfdfc; }
.panel-header h2, .capability-section h3 { margin: 0; font-size: 15px; }
.panel-body { padding: 16px; }
.capability-section { margin-top: 20px; }
.capability-section h3 { margin-bottom: 10px; }
.value-text { overflow-wrap: anywhere; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 14px; }
@media (max-width: 720px) { .form-grid { grid-template-columns: 1fr; } }
</style>
