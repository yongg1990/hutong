<template>
  <div>
    <PageHeader title="来源系统密钥管理" />
    <el-form label-position="top" class="scope-form" :disabled="busy">
      <el-form-item label="管理范围"><el-radio-group v-model="mode" @change="clearResults"><el-radio-button value="current">当前租户</el-radio-button><el-radio-button value="admin">平台管理员代生成</el-radio-button></el-radio-group></el-form-item>
      <el-form-item v-if="mode === 'admin'" label="目标租户 ID" required><el-input v-model="tenantId" @input="clearResults" /></el-form-item>
      <el-form-item label="来源系统 ID" required><el-input v-model="sourceSystemId" @input="clearResults" /></el-form-item>
      <div class="actions">
        <el-button v-if="mode === 'current'" :icon="Search" :loading="loading" @click="load">查询</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">登记公钥并生成密钥</el-button>
      </div>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-table :data="keys" empty-text="暂无密钥" v-loading="loading">
      <el-table-column prop="id" label="密钥 ID" min-width="200" />
      <el-table-column prop="tenantId" label="租户 ID" min-width="190" />
      <el-table-column prop="sourceSystemId" label="来源系统 ID" min-width="190" />
      <el-table-column prop="keyAlgorithm" label="密钥算法" width="100" />
      <el-table-column prop="dataAlgorithm" label="数据算法" width="100" />
      <el-table-column label="状态" width="90"><template #default="{ row }"><StatusTag :code="row.status" /></template></el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column prop="updatedAt" label="更新时间" width="180" />
      <el-table-column label="操作" width="160" fixed="right"><template #default="{ row }">
        <el-button link @click="detail = row">查看公钥</el-button>
        <el-button v-if="mode === 'current'" link :disabled="busy" @click="changeStatus(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button>
      </template></el-table-column>
    </el-table>
    <el-dialog v-model="createVisible" title="登记对接方公钥" width="min(640px, 94vw)" :close-on-click-modal="false" :show-close="!saving">
      <el-form label-position="top" :disabled="saving">
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
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { sourceKeysApi, type SourceSystemKey, type KeyCreateRequest } from '@/api/integration';
import { apiErrorMessage } from '@/api/client';

const route = useRoute();
const mode = ref('current'), tenantId = ref('');
const sourceSystemId = ref(String(route.query.sourceSystemId || localStorage.getItem('tcmirp_source_system_id') || ''));
const keys = ref<SourceSystemKey[]>([]), detail = ref<SourceSystemKey | null>(null);
const loading = ref(false), saving = ref(false), updating = ref(false), error = ref(''), createVisible = ref(false);
const busy = computed(() => loading.value || saving.value || updating.value);
const form = ref<KeyCreateRequest>({ keyAlgorithm: 'RSA', dataAlgorithm: 'AES', clientPublicKey: '' });
function clearResults() { keys.value = []; detail.value = null; error.value = ''; }
function validScope() {
  if (!/^[1-9]\d*$/.test(sourceSystemId.value.trim()) || (mode.value === 'admin' && !/^[1-9]\d*$/.test(tenantId.value.trim()))) {
    ElMessage.warning('请填写有效的数字 ID'); return false;
  }
  return true;
}
async function load() {
  if (!validScope()) return;
  loading.value = true; error.value = ''; keys.value = [];
  try { keys.value = await sourceKeysApi.list(sourceSystemId.value.trim()); }
  catch (cause) { error.value = apiErrorMessage(cause, '查询密钥失败'); }
  finally { loading.value = false; }
}
function openCreate() {
  if (!validScope()) return;
  form.value = { keyAlgorithm: 'RSA', dataAlgorithm: 'AES', clientPublicKey: '' }; createVisible.value = true;
}
async function create() {
  if (saving.value || !validScope()) return;
  const clientPublicKey = form.value.clientPublicKey.trim();
  if (!clientPublicKey || clientPublicKey.length > 4096) { ElMessage.warning('请填写不超过 4096 字符的对接方公钥'); return; }
  saving.value = true;
  try {
    const data = { ...form.value, clientPublicKey };
    const result = mode.value === 'admin'
      ? await sourceKeysApi.createForTenant(tenantId.value.trim(), sourceSystemId.value.trim(), data)
      : await sourceKeysApi.create(sourceSystemId.value.trim(), data);
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
.scope-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; align-items: end; margin-bottom: 20px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.actions .el-button + .el-button { margin-left: 0; }
h3 { margin: 18px 0 8px; font-size: 14px; }
</style>
