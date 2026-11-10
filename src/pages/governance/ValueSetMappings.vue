<template>
  <div><PageHeader title="系统自有码值映射" />
    <ResourceWorkbench list-path="/openapi/v1/source-systems/{sourceSystemId}/value-set-mappings" :required-filters="['sourceSystemId']" :filters="filters" :columns="columns" :fields="fields" editable create-label="新增映射" />
    <el-divider />
    <el-form inline class="query-surface" :disabled="bulkBusy"><el-form-item><el-input v-model="sourceId" aria-label="来源系统 ID" placeholder="来源系统 ID" @input="clearBulk" /></el-form-item><el-form-item><el-input v-model="valueSetId" aria-label="标准值域 ID" placeholder="标准值域 ID" @input="clearBulk" /></el-form-item><el-form-item><el-button :loading="bulkBusy" @click="loadBulk">加载全部标准项</el-button><el-button type="primary" :disabled="!bulkLoaded" :loading="bulkBusy" @click="saveBulk">整体保存</el-button></el-form-item></el-form>
    <div class="table-surface" v-if="bulkLoaded || bulkBusy">
      <LocalPaginatedTable v-if="bulkLoaded || bulkBusy" :data="bulkRows" v-loading="bulkBusy"><el-table-column prop="standardItemId" label="标准项 ID" min-width="190" /><el-table-column prop="itemCode" label="标准代码" min-width="140" /><el-table-column prop="itemName" label="标准名称" min-width="160" /><el-table-column prop="status" label="标准项状态" width="120" /><el-table-column label="系统码值" min-width="170"><template #default="{ row }"><el-input v-model="row.systemItemCode" :disabled="bulkBusy" /></template></el-table-column><el-table-column label="系统码值名称" min-width="180"><template #default="{ row }"><el-input v-model="row.systemItemName" :disabled="bulkBusy" /></template></el-table-column><el-table-column label="映射状态" width="140"><template #default="{ row }"><el-select v-model="row.mappingStatus" :disabled="bulkBusy"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select></template></el-table-column></LocalPaginatedTable>
    </div>
  </div>
</template>
<script setup lang="ts">
import LocalPaginatedTable from '@/components/common/LocalPaginatedTable.vue';
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { request, apiErrorMessage } from '@/api/client';
import PageHeader from '@/components/common/PageHeader.vue';
import ResourceWorkbench from '@/components/common/ResourceWorkbench.vue';
const sourceId = ref(''), valueSetId = ref(''), bulkRows = ref<any[]>([]), bulkBusy = ref(false), bulkLoaded = ref(false);
let revision = 0;
function clearBulk() { ++revision; bulkLoaded.value = false; bulkRows.value = []; }
function bulkPath() { return `/openapi/v1/source-systems/${sourceId.value.trim()}/value-set-mappings/${valueSetId.value.trim()}`; }
async function loadBulk() {
  if (bulkBusy.value) return;
  if (![sourceId.value.trim(), valueSetId.value.trim()].every(v => /^\d+$/.test(v))) return ElMessage.warning('请填写有效来源系统和标准值域 ID');
  clearBulk(); const current = revision; bulkBusy.value = true;
  try { const data: any = await request.get(`${bulkPath()}/items`); if (current !== revision) return; bulkRows.value = data.map((row: any) => ({ ...row, systemItemCode: row.mapping?.systemItemCode || '', systemItemName: row.mapping?.systemItemName || '', mappingStatus: row.mapping?.status || 'ACTIVE' })); bulkLoaded.value = true; }
  catch (e) { ElMessage.error(apiErrorMessage(e, '加载标准项失败')); } finally { bulkBusy.value = false; }
}
async function saveBulk() {
  if (!bulkLoaded.value || bulkBusy.value) return;
  const items = bulkRows.value.map(row => ({ standardItemId: row.standardItemId, systemItemCode: row.systemItemCode.trim(), systemItemName: row.systemItemName.trim(), status: row.mappingStatus }));
  if (items.some(row => Boolean(row.systemItemCode) !== Boolean(row.systemItemName))) return ElMessage.warning('系统码值和名称须同时填写或同时留空');
  const path = bulkPath(); bulkBusy.value = true;
  try { await ElMessageBox.confirm('确认整体保存？码值和名称均留空的项会清除已有映射。', '整体保存映射', { type: 'warning' }); await request.post(`${path}/save`, { items }); ElMessage.success('映射已整体保存'); }
  catch (e) { if (e !== 'cancel' && e !== 'close') ElMessage.error(apiErrorMessage(e, '整体保存失败')); } finally { bulkBusy.value = false; }
}
const filters = [{ key: 'sourceSystemId', label: '来源系统 ID' }, { key: 'valueSetId', label: '标准值域 ID' }, { key: 'systemItemCode', label: '系统自有码值' }, { key: 'status', label: '状态', options: ['ACTIVE', 'INACTIVE'] }];
const columns = [{ key: 'id', label: '映射 ID' }, { key: 'sourceSystemId', label: '来源系统 ID' }, { key: 'valueSetId', label: '标准值域 ID' }, { key: 'standardItemId', label: '标准代码项 ID' }, { key: 'systemItemCode', label: '系统自有码值' }, { key: 'systemItemName', label: '系统码值名称' }, { key: 'status', label: '状态' }];
const fields = [{ key: 'valueSetId', label: '标准值域 ID', required: true }, { key: 'standardItemId', label: '标准代码项 ID', required: true }, { key: 'systemItemCode', label: '系统自有码值', required: true }, { key: 'systemItemName', label: '系统码值名称', required: true }, { key: 'status', label: '状态', required: true, options: ['ACTIVE', 'INACTIVE'], initial: 'ACTIVE' }];
</script>
