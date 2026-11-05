<template>
  <div>
    <PageHeader title="来源系统密钥管理" />
    <el-form label-position="top" class="scope-form" :disabled="busy">
      <el-form-item label="目标租户" required><el-select v-model="tenantId" clearable filterable placeholder="请选择目标租户" @change="changeTenant"><el-option v-for="tenant in tenants" :key="tenant.id" :value="String(tenant.id)" :label="tenant.tenantName" /></el-select></el-form-item>
      <el-form-item label="来源系统" required><el-select v-model="sourceSystemId" clearable filterable :disabled="!tenantId || sourcesLoading" :loading="sourcesLoading" placeholder="请选择来源系统"><el-option v-for="source in sources" :key="source.sourceSystemId" :value="source.sourceSystemId" :label="source.sourceSystemName" /></el-select></el-form-item>
      <el-form-item label="状态"><el-select v-model="status"><el-option :value="0" label="启用" /><el-option :value="1" label="停用" /></el-select></el-form-item>
      <div class="actions">
        <el-button type="primary" :icon="Search" :loading="loading" @click="load()">查询</el-button>
        <el-button :icon="RefreshRight" @click="reset">重置</el-button>
      </div>
    </el-form>
    <el-table :data="rows" empty-text="暂无来源系统密钥数据" v-loading="loading">
      <el-table-column prop="id" label="密钥 ID" min-width="200"><template #default="{ row }">{{ row.id || '未生成密钥' }}</template></el-table-column>
      <el-table-column prop="tenantId" label="租户 ID" min-width="190" />
      <el-table-column prop="sourceSystemId" label="来源系统 ID" min-width="190" />
      <el-table-column prop="sourceSystemName" label="来源系统名称" min-width="160" />
      <el-table-column prop="keyAlgorithm" label="密钥算法" width="100"><template #default="{ row }">{{ row.keyAlgorithm || '-' }}</template></el-table-column>
      <el-table-column prop="dataAlgorithm" label="数据算法" width="100"><template #default="{ row }">{{ row.dataAlgorithm || '-' }}</template></el-table-column>
      <el-table-column label="状态" width="90"><template #default="{ row }"><StatusTag v-if="row.status" :code="row.status" /><span v-else>-</span></template></el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column prop="updatedAt" label="更新时间" width="180" />
      <el-table-column label="操作" width="320" fixed="right"><template #default="{ row }">
        <el-button link type="primary" :icon="Plus" :disabled="busy" @click="openCreate(row)">登记公钥并生成密钥</el-button>
        <el-button v-if="row.id" link :disabled="busy" @click="detail = row">查看公钥</el-button>
        <el-button v-if="row.id && row.tenantId === sessionTenantId" link :disabled="busy" @click="changeStatus(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button>
      </template></el-table-column>
    </el-table>
    <el-dialog v-model="createVisible" title="登记对接方公钥" width="min(640px, 94vw)" :close-on-click-modal="false" :show-close="!saving">
      <el-form label-position="top" :disabled="saving">
        <el-form-item label="目标租户"><el-input :model-value="createTarget?.tenantName || createTarget?.tenantId" disabled /></el-form-item>
        <el-form-item label="来源系统"><el-input :model-value="createTarget?.sourceSystemName + ' (' + createTarget?.sourceSystemId + ')'" disabled /></el-form-item>
        <el-form-item label="密钥算法" required><el-select v-model="form.keyAlgorithm"><el-option v-for="value in ['RSA', 'SM2']" :key="value" :value="value" :label="value" /></el-select></el-form-item>
        <el-form-item label="数据加密算法" required><el-select v-model="form.dataAlgorithm"><el-option v-for="value in ['SM4', 'AES']" :key="value" :value="value" :label="value" /></el-select></el-form-item>
        <el-form-item label="对接方公钥（Base64 X.509）" required><el-input v-model="form.clientPublicKey" type="textarea" :rows="8" :maxlength="4096" /></el-form-item>
      </el-form>
      <template #footer><el-button :disabled="saving" @click="createVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="create">生成密钥</el-button></template>
    </el-dialog>
    <el-dialog :model-value="!!detail" title="密钥公开信息" width="min(760px, 94vw)" @close="detail = null">
      <template v-if="detail">
        <el-descriptions :column="1" border><el-descriptions-item label="密钥 ID">{{ detail.id }}</el-descriptions-item><el-descriptions-item label="算法">{{ detail.keyAlgorithm }} / {{ detail.dataAlgorithm }}</el-descriptions-item></el-descriptions>
        <h3>平台公钥</h3><el-input :model-value="detail.publicKey" type="textarea" :rows="6" readonly />
        <h3>对接方公钥</h3><el-input :model-value="detail.clientPublicKey" type="textarea" :rows="6" readonly />
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, RefreshRight } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { sourceKeysApi, type SourceSystemKey, type KeyCreateRequest } from '@/api/integration';
import { apiErrorMessage } from '@/api/client';
import { rbacApi, type TenantItem } from '@/api/rbac';
import { governanceApi, type SourceSystemManagement } from '@/api/governance';

const route = useRoute();
const sessionTenantId = localStorage.getItem('tcmirp_tenant_id') || '';
const tenantId = ref('');
const tenants = ref<TenantItem[]>([]);
const sourceSystemId = ref(String(route.query.sourceSystemId || ''));
const keys = ref<SourceSystemKey[]>([]), detail = ref<SourceSystemKey | null>(null);
type SourceKeyRow = Partial<SourceSystemKey> & { tenantId: string; sourceSystemId: string; sourceSystemName: string; tenantName: string };
const sources = ref<SourceSystemManagement[]>([]);
const sourcesLoading = ref(false);
const status = ref<0 | 1>(0);
const createTarget = ref<SourceKeyRow | null>(null);
const rows = computed<SourceKeyRow[]>(() => keys.value.map(key => ({
  ...key,
  tenantName: tenants.value.find(tenant => String(tenant.id) === key.tenantId)?.tenantName || '',
  sourceSystemName: sources.value.find(source => source.sourceSystemId === key.sourceSystemId)?.sourceSystemName || key.sourceSystemId
})));
const loading = ref(false), saving = ref(false), updating = ref(false), createVisible = ref(false);
const busy = computed(() => loading.value || saving.value || updating.value || sourcesLoading.value);
const form = ref<KeyCreateRequest>({ keyAlgorithm: 'RSA', dataAlgorithm: 'AES', clientPublicKey: '' });
function clearResults() { keys.value = []; detail.value = null; }
async function loadSources() {
  sources.value = [];
  if (!tenantId.value) return;
  sourcesLoading.value = true;
  try { sources.value = await governanceApi.listSelectableSources(tenantId.value); }
  catch (cause) { ElMessage.error(apiErrorMessage(cause, '加载来源系统选项失败')); }
  finally { sourcesLoading.value = false; }
}
async function changeTenant() {
  sourceSystemId.value = '';
  await loadSources();
}
function reset() {
  tenantId.value = ''; sourceSystemId.value = ''; status.value = 0; sources.value = [];
  clearResults();
}
onMounted(async () => {
  try {
    tenants.value = await rbacApi.getPermittedTenants();
    tenantId.value = tenants.value.find(tenant => String(tenant.id) === sessionTenantId)
      ? sessionTenantId : tenants.value.length === 1 ? String(tenants.value[0].id) : '';
    await loadSources();
    if (!sources.value.some(source => source.sourceSystemId === sourceSystemId.value)) sourceSystemId.value = '';
    if (tenantId.value && sourceSystemId.value) await load();
  } catch (cause) { ElMessage.error(apiErrorMessage(cause, '加载租户选项失败')); }
});
async function load() {
  if (busy.value) return;
  if (!tenantId.value) { ElMessage.warning('请选择目标租户'); return; }
  if (!sourceSystemId.value) { ElMessage.warning('请选择来源系统'); return; }
  loading.value = true; clearResults();
  try {
    keys.value = await sourceKeysApi.list({
      tenantId: tenantId.value,
      sourceSystemId: sourceSystemId.value,
      status: status.value === 0 ? 'ACTIVE' : 'INACTIVE'
    });
  }
  catch (cause) { ElMessage.error(apiErrorMessage(cause, '查询密钥失败')); }
  finally { loading.value = false; }
}
function openCreate(row: SourceKeyRow) {
  if (busy.value) return;
  createTarget.value = { ...row };
  form.value = { keyAlgorithm: 'RSA', dataAlgorithm: 'AES', clientPublicKey: '' }; createVisible.value = true;
}
async function create() {
  if (saving.value || !createTarget.value) return;
  const target = createTarget.value;
  const clientPublicKey = form.value.clientPublicKey.trim();
  if (!clientPublicKey || clientPublicKey.length > 4096) { ElMessage.warning('请填写不超过 4096 字符的对接方公钥'); return; }
  saving.value = true;
  try {
    const data = { ...form.value, clientPublicKey };
    const result = target.tenantId !== sessionTenantId
      ? await sourceKeysApi.createForTenant(target.tenantId, target.sourceSystemId, data)
      : await sourceKeysApi.create(target.sourceSystemId, data);
    createVisible.value = false; form.value.clientPublicKey = '';
    keys.value = [result.key, ...keys.value.filter(key => key.id !== result.key.id)]; detail.value = result.key;
    ElMessage.success('密钥生成成功');
  } catch (cause) { ElMessage.error(apiErrorMessage(cause, '密钥生成失败')); }
  finally { saving.value = false; }
}
async function changeStatus(key: SourceSystemKey) {
  if (busy.value) return;
  const status = key.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  updating.value = true;
  try {
    await ElMessageBox.confirm(`确认${status === 'ACTIVE' ? '启用' : '停用'}密钥 ${key.id}？`, '密钥状态', { type: 'warning' });
    const result = await sourceKeysApi.changeStatus(key.sourceSystemId, key.id, status);
    keys.value = keys.value.map(item => item.id === result.id ? result : item);
    ElMessage.success('密钥状态已更新');
  } catch (cause) { if (cause !== 'cancel' && cause !== 'close') ElMessage.error(apiErrorMessage(cause, '更新密钥状态失败')); }
  finally { updating.value = false; }
}
</script>

<style scoped>
.scope-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; gap: 16px; align-items: end; margin-bottom: 20px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.actions .el-button + .el-button { margin-left: 0; }
h3 { margin: 18px 0 8px; font-size: 14px; }
@media (max-width: 720px) { .scope-form { grid-template-columns: minmax(0, 1fr); gap: 0; } }
</style>
