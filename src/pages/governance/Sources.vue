<template>
  <div class="governance-page">
    <PageHeader
      title="来源系统"
      subtitle="来源系统注册与配置"
    >
    </PageHeader>

    <FilterBar @search="searchSources" @reset="resetSources">
      <el-input v-model="filters.sourceSystemCode" placeholder="系统标识" clearable style="width: 160px" />
      <el-input v-model="filters.sourceSystemName" placeholder="系统名称" clearable style="width: 180px" />
      <el-input v-model="filters.sourceSystemType" placeholder="来源类型" clearable style="width: 140px" />
      <el-input v-model="filters.ownerPartyId" placeholder="所属主体 ID" clearable style="width: 160px" />
      <el-select v-model="filters.endpointType" placeholder="接入方式" clearable style="width: 130px"><el-option v-for="item in ['API', 'FILE', 'MESSAGE', 'DATABASE']" :key="item" :label="enumLabel(item)" :value="item" /></el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select>
      <template #actions><el-button type="primary" @click="openRegister"><el-icon><Plus /></el-icon>新增</el-button></template>
    </FilterBar>

    <div class="panel">
      <el-table :data="sources" v-loading="loading" empty-text="暂无来源系统">
        <el-table-column prop="id" label="来源系统 ID" width="130" class-name="mono" />
        <el-table-column prop="code" label="系统标识" width="140" class-name="mono" />
        <el-table-column prop="name" label="系统名称" min-width="180" />
        <el-table-column prop="systemType" label="来源类型" width="120" />
        <el-table-column prop="endpointType" label="接入方式" width="110" />
        <el-table-column prop="ownerPartyId" label="所属主体 ID" width="150" class-name="mono" />
        <el-table-column prop="purposeCodes" label="默认用途代码" min-width="160" class-name="mono" />
        <el-table-column prop="version" label="配置版本" width="110" class-name="mono" />
        <el-table-column prop="registeredAt" label="注册时间" width="170" />
        <el-table-column label="操作" width="210" fixed="right"><template #default="{ row }"><el-button link @click="viewSource(row.id)">详情</el-button><el-button link @click="openEdit(row.id)">编辑</el-button><el-button link @click="$router.push({ path: '/governance/source-keys', query: { sourceSystemId: row.id } })">密钥管理</el-button></template></el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-row"><el-pagination v-model:current-page="page" :page-size="10" :total="total" layout="total, prev, pager, next" @current-change="loadSources" /></div>
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑来源系统' : '注册新接入来源系统'" width="600px" :close-on-click-modal="false">
      <el-form :model="regForm" label-position="right" label-width="168px" class="source-form">
        <el-form-item v-if="!editingId" label="租户 ID" required>
          <el-input v-model="regForm.tenantId" maxlength="128" placeholder="请输入数字租户 ID" />
        </el-form-item>
        <el-form-item label="系统标识 (Source Code)" required>
          <el-input v-model="regForm.systemCode" :disabled="!!editingId" placeholder="如: WMS-KM-02" />
        </el-form-item>
        <el-form-item label="系统名称" required>
          <el-input v-model="regForm.systemName" placeholder="如: 昆明二号仓储管理系统" />
        </el-form-item>
        <el-form-item label="来源系统类型" required><el-input v-model="regForm.systemType" placeholder="如 WMS、LIMS、ERP" /></el-form-item>
        <el-form-item label="所属主体 ID" :required="!!editingId"><el-input v-model="regForm.ownerPartyId" placeholder="数字 ID 字符串" /></el-form-item>
        <el-form-item label="接入方式">
          <el-select v-model="regForm.endpointType" style="width: 100%">
            <el-option v-for="item in ['API', 'FILE', 'MESSAGE', 'DATABASE']" :key="item" :label="enumLabel(item)" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="API 基础地址"><el-input v-model="regForm.baseUrl" placeholder="https://example.com/api" /></el-form-item>
        <el-form-item label="信任级别">
          <ApiOptionSelect v-if="dialogVisible" v-model="regForm.trustLevel" :loader="loadTrustLevels" value-key="itemCode" :label="trustLevelLabel" placeholder="请选择信任级别" cache-key="dictionary:TRUST_LEVEL" />
        </el-form-item>
        <el-form-item label="初始状态" required><el-select v-model="regForm.status" style="width: 100%"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmRegister">保存</el-button>
      </template>
    </el-dialog>
    <el-drawer v-model="detailVisible" title="来源系统详情" size="min(760px,94vw)"><el-descriptions v-if="sourceDetail" :column="1" border><el-descriptions-item v-for="(value, key) in sourceDetail" :key="key" :label="String(key)"><pre style="white-space:pre-wrap;overflow-wrap:anywhere;margin:0">{{ typeof value === 'object' ? JSON.stringify(value, null, 2) : value }}</pre></el-descriptions-item></el-descriptions></el-drawer>

  </div>
</template>

<script setup lang="ts">
import { enumLabel } from '@/utils/enumLabels';
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import ApiOptionSelect from '@/components/common/ApiOptionSelect.vue';
import { dictionaryApi, type DictionaryItem } from '@/api/dictionary';
import { governanceApi, type SourceSystemRequest, type SourceSystemManagement } from '@/api/governance';
import { apiErrorMessage } from '@/api/client';

const dialogVisible = ref(false);
const trustLevelLabel = (item: DictionaryItem) => item.itemName;
async function loadTrustLevels() {
  const records = await dictionaryApi.listActiveItems('TRUST_LEVEL');
  return { records, total: String(records.length) };
}
const detailVisible = ref(false), sourceDetail = ref<SourceSystemManagement | null>(null);
async function viewSource(id: string) { try { sourceDetail.value = await governanceApi.getSourceSystem(id); detailVisible.value = true; } catch (error) { ElMessage.error(apiErrorMessage(error, '查询来源系统详情失败')); } }
const saving = ref(false);
const emptyForm = () => ({
  tenantId: '',
  systemCode: '',
  systemName: '',
  systemType: '', ownerPartyId: '', endpointType: 'API', baseUrl: '',
  trustLevel: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
});
const regForm = ref(emptyForm());
const sources = ref<any[]>([]);
const loading = ref(false);
let sourceRequests = 0;
const page = ref(1), total = ref(0);
const emptyFilters = () => ({ sourceSystemCode: '', sourceSystemName: '', sourceSystemType: '', ownerPartyId: '', endpointType: '', status: '' });
const filters = ref(emptyFilters());
const appliedFilters = ref(emptyFilters());
const searchSources = () => { appliedFilters.value = { ...filters.value }; page.value = 1; void loadSources(); };
const resetSources = () => { filters.value = emptyFilters(); appliedFilters.value = emptyFilters(); page.value = 1; void loadSources(); };
const editingId = ref(''), lockVersion = ref(0);
const toRow = (item: SourceSystemManagement) => ({ id: item.sourceSystemId, code: item.sourceSystemCode, name: item.sourceSystemName, systemType: item.sourceSystemType, endpointType: item.endpointType, ownerPartyId: item.ownerPartyId, purposeCodes: (item.defaultPurposeCodes || []).join(', '), version: item.version, registeredAt: item.createdAt, status: item.status });
async function loadSources() {
  ++sourceRequests;
  loading.value = true;
  try {
    const params = Object.fromEntries(Object.entries(appliedFilters.value).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
    const result = await governanceApi.listSourceSystems({ ...params, page: page.value, size: 10 });
    sources.value = (result.records || []).map(toRow); total.value = Number(result.total || 0);
  }
  catch (error) { ElMessage.error(apiErrorMessage(error, '查询来源系统失败')); }
  finally { loading.value = --sourceRequests > 0; }
}
onMounted(loadSources);
async function openEdit(id: string) {
  try {
    const item = await governanceApi.getSourceSystem(id);
    editingId.value = id; lockVersion.value = item.lockVersion;
    regForm.value = { tenantId: item.tenantId || '', systemCode: item.sourceSystemCode, systemName: item.sourceSystemName, systemType: item.sourceSystemType, ownerPartyId: item.ownerPartyId || '', endpointType: item.endpointType || '', baseUrl: item.baseUrl || '', trustLevel: item.trustLevel || '', status: item.status };
    dialogVisible.value = true;
  } catch (error) { ElMessage.error(apiErrorMessage(error, '查询来源系统失败')); }
}

const openRegister = () => {
  editingId.value = ''; regForm.value = emptyForm();
  dialogVisible.value = true;
};

const confirmRegister = async () => {
  const form = regForm.value;
  if (!editingId.value && !form.tenantId.trim()) {
    ElMessage.warning('请填写租户 ID');
    return;
  }
  if (!editingId.value && !/^-?\d+$/.test(form.tenantId.trim())) {
    ElMessage.warning('租户 ID 必须是数字字符串');
    return;
  }
  if (form.ownerPartyId && !/^-?\d+$/.test(form.ownerPartyId)) {
    ElMessage.warning('所属主体 ID 必须是数字字符串');
    return;
  }
  if (!form.systemCode.trim() || !form.systemName.trim() || !form.systemType.trim() || (editingId.value && !form.ownerPartyId.trim())) {
    ElMessage.warning('请填写所有必填字段');
    return;
  }
  saving.value = true;
  try {
    const payload: SourceSystemRequest = {
      tenantId: form.tenantId.trim(),
      sourceSystemCode: form.systemCode, sourceSystemName: form.systemName, sourceSystemType: form.systemType,
      ownerPartyId: form.ownerPartyId.trim() || undefined, endpointType: form.endpointType || undefined,
      ...(form.baseUrl ? { baseUrl: form.baseUrl } : {}),
      trustLevel: form.trustLevel, status: form.status
    };
    const created = editingId.value
      ? await governanceApi.updateSourceSystem(editingId.value, {
          sourceSystemName: payload.sourceSystemName, sourceSystemType: payload.sourceSystemType,
          ownerPartyId: form.ownerPartyId.trim(), endpointType: payload.endpointType,
          baseUrl: payload.baseUrl, trustLevel: payload.trustLevel,
          status: payload.status, lockVersion: lockVersion.value
        })
      : await governanceApi.registerSourceSystem(payload);
    await loadSources();
    dialogVisible.value = false;
    localStorage.setItem('tcmirp_source_system_id', String(created.sourceSystemId));
    ElMessage.success(editingId.value ? '来源系统更新成功' : '来源系统注册成功');
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '注册失败，请稍后重试'));
  } finally {
    saving.value = false;
  }
};

</script>

<style scoped>
.source-form :deep(.el-form-item__content) {
  min-width: 0;
}
@media (max-width: 560px) {
  .source-form :deep(.el-form-item__label) {
    width: 116px !important;
    white-space: normal;
  }
}
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
