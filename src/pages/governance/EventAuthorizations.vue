<template>
  <div>
    <PageHeader title="事件类型授权" />
    <el-form inline :disabled="loading || saving" class="scope-form">
      <el-form-item label="租户 ID" required><el-input v-model="tenantId" @input="clear" /></el-form-item>
      <el-form-item label="项目空间 ID" required><el-input v-model="projectSpaceId" @input="clear" /></el-form-item>
      <el-form-item><el-button :icon="Search" type="primary" :loading="loading" @click="load">查询</el-button></el-form-item>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <div v-if="loaded" class="toolbar"><span>已选 {{ selectedCount }} / {{ rows.length }}</span><el-button type="primary" :icon="Check" :loading="saving" @click="save">保存授权集合</el-button></div>
    <el-table :data="rows" v-loading="loading" empty-text="暂无事件类型授权状态">
      <el-table-column label="保持启用" width="100"><template #default="{ row }"><el-checkbox v-model="row.selected" :disabled="saving" :aria-label="`授权 ${row.eventName}`" /></template></el-table-column>
      <el-table-column prop="eventType" label="事件类型" min-width="190" />
      <el-table-column prop="eventName" label="名称" min-width="160" />
      <el-table-column label="事件状态" width="100"><template #default="{ row }"><StatusTag :code="row.eventTypeStatus" /></template></el-table-column>
      <el-table-column label="项目状态" width="100"><template #default="{ row }"><StatusTag :code="row.projectStatus" /></template></el-table-column>
      <el-table-column label="当前有效" width="100"><template #default="{ row }"><el-tag :type="row.authorized ? 'success' : 'info'">{{ row.authorized ? '是' : '否' }}</el-tag></template></el-table-column>
      <el-table-column label="授权记录" width="110"><template #default="{ row }"><StatusTag v-if="row.authorizationStatus" :code="row.authorizationStatus" /><span v-else>未授权</span></template></el-table-column>
      <el-table-column label="生效时间" width="220"><template #default="{ row }"><el-date-picker v-model="row.validFrom" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="立即生效" :disabled="!row.selected || saving || row.authorizationStatus === 'ACTIVE'" style="width: 195px" /></template></el-table-column>
      <el-table-column label="失效时间" width="220"><template #default="{ row }"><el-date-picker v-model="row.validTo" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="长期有效" :disabled="!row.selected || saving || row.authorizationStatus === 'ACTIVE'" style="width: 195px" /></template></el-table-column>
      <el-table-column prop="lockVersion" label="锁版本" width="90" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Check } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { eventAuthorizationsApi, type EventAuthorization } from '@/api/integration';
import { apiErrorMessage } from '@/api/client';

const tenantId = ref(localStorage.getItem('tcmirp_tenant_id') || '');
const projectSpaceId = ref(localStorage.getItem('tcmirp_project_space_id') || '');
const rows = ref<(EventAuthorization & { selected: boolean })[]>([]);
const loading = ref(false), saving = ref(false), loaded = ref(false), error = ref('');
const selectedCount = computed(() => rows.value.filter(row => row.selected).length);
function clear() { rows.value = []; loaded.value = false; error.value = ''; }
function setRows(result: EventAuthorization[]) {
  // Preserve scheduled and expired ACTIVE records as well as currently effective grants.
  rows.value = result.map(row => ({ ...row, selected: row.authorizationStatus === 'ACTIVE' })); loaded.value = true;
}
async function load() {
  if (!/^[1-9]\d*$/.test(tenantId.value.trim()) || !/^[1-9]\d*$/.test(projectSpaceId.value.trim())) { ElMessage.warning('请填写有效的租户和项目空间数字 ID'); return; }
  loading.value = true; clear();
  try { setRows(await eventAuthorizationsApi.list(tenantId.value.trim(), projectSpaceId.value.trim())); }
  catch (cause) { error.value = apiErrorMessage(cause, '查询授权状态失败'); }
  finally { loading.value = false; }
}
async function save() {
  if (!loaded.value || saving.value) return;
  const selected = rows.value.filter(row => row.selected);
  if (selected.length > 200) { ElMessage.warning('一次最多保存 200 个事件类型授权'); return; }
  if (selected.some(row => row.validFrom && row.validTo && row.validTo <= row.validFrom)) { ElMessage.warning('失效时间必须晚于生效时间'); return; }
  saving.value = true;
  try {
    await ElMessageBox.confirm(`确认保存 ${selected.length} 个事件类型授权？未选中的已有授权将停用。`, '保存授权集合', { type: 'warning' });
    const result = await eventAuthorizationsApi.save(tenantId.value.trim(), projectSpaceId.value.trim(), selected.map(row => ({
      eventType: row.eventType, ...(row.validFrom ? { validFrom: row.validFrom } : {}), ...(row.validTo ? { validTo: row.validTo } : {})
    })));
    setRows(result); ElMessage.success('授权集合已保存');
  } catch (cause) { if (cause !== 'cancel' && cause !== 'close') ElMessage.error(apiErrorMessage(cause, '保存授权失败')); }
  finally { saving.value = false; }
}
</script>

<style scoped>
.scope-form { display: flex; flex-wrap: wrap; gap: 8px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
</style>
