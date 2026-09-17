<template>
  <div class="settings-page">
    <PageHeader
      title="前置节点与部署状态"
      subtitle="边缘轻量部署节点 (Edge Node) 离线缓存、心跳监控与规则包同步"
    >
      <template #actions>
        <el-button type="primary" @click="dialogVisible = true">登记部署实例</el-button>
      </template>
    </PageHeader>

    <FilterBar @search="loadNode" @reset="handleReset">
      <el-input-number v-model="instanceId" :min="1" placeholder="部署实例 ID" style="width: 220px" />
    </FilterBar>

    <div class="panel">
      <el-table :data="instances" v-loading="loading" empty-text="请输入部署实例 ID 查询">
        <el-table-column prop="deploymentInstanceId" label="部署实例 ID" width="130" class-name="mono" />
        <el-table-column prop="tenantId" label="租户 ID" width="100" class-name="mono" />
        <el-table-column prop="instanceCode" label="实例代码" width="150" class-name="mono" />
        <el-table-column prop="deploymentMode" label="部署模式" width="120" />
        <el-table-column prop="environment" label="运行环境" width="110" />
        <el-table-column prop="regionCode" label="区域代码" width="110" class-name="mono" />
        <el-table-column label="能力配置" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ JSON.stringify(row.capabilities || {}) }}</template>
        </el-table-column>
        <el-table-column label="运行状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
        <el-table-column prop="version" label="配置版本" width="110" class-name="mono" />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="登记部署实例" width="560px">
      <el-form :model="form" label-position="top">
        <el-form-item label="实例代码" required><el-input v-model="form.instanceCode" /></el-form-item>
        <el-form-item label="部署模式" required>
          <el-select v-model="form.deploymentMode" style="width: 100%">
            <el-option label="SAAS" value="SAAS" /><el-option label="DEDICATED" value="DEDICATED" />
            <el-option label="HYBRID" value="HYBRID" /><el-option label="EDGE_ONLY" value="EDGE_ONLY" />
          </el-select>
        </el-form-item>
        <el-form-item label="运行环境" required><el-input v-model="form.environment" /></el-form-item>
        <el-form-item label="区域代码" required><el-input v-model="form.regionCode" /></el-form-item>
        <el-form-item label="能力配置 JSON" required>
          <el-input v-model="capabilitiesText" type="textarea" :rows="5" />
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
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { settingsApi, type DeploymentInstanceCreateRequest, type DeploymentInstanceResponse } from '@/api/settings';
import { apiErrorMessage } from '@/api/client';

const instanceId = ref<number | undefined>(1);
const instances = ref<DeploymentInstanceResponse[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const capabilitiesText = ref('{\n  "offlineCache": true,\n  "edgeRuleValidation": true\n}');
const form = ref<DeploymentInstanceCreateRequest>({
  instanceCode: '', deploymentMode: 'HYBRID', environment: 'PROD', regionCode: '', capabilities: {}
});

const loadNode = async () => {
  if (!instanceId.value) {
    instances.value = [];
    return;
  }
  loading.value = true;
  try {
    instances.value = [await settingsApi.getDeploymentInstanceById(instanceId.value)];
  } catch (err) {
    console.error('Failed to load deployment instance', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadNode();
});

const handleReset = () => {
  instanceId.value = undefined;
  instances.value = [];
};

const createInstance = async () => {
  if (!form.value.instanceCode || !form.value.environment || !form.value.regionCode) {
    ElMessage.warning('请填写完整的部署实例信息');
    return;
  }
  let capabilities: Record<string, any>;
  try {
    capabilities = JSON.parse(capabilitiesText.value);
  } catch {
    ElMessage.warning('能力配置必须是有效 JSON');
    return;
  }
  saving.value = true;
  try {
    const created = await settingsApi.createDeploymentInstance({ ...form.value, capabilities });
    instances.value = [created];
    instanceId.value = Number(created.deploymentInstanceId) || undefined;
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
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
