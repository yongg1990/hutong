<template>
  <div class="master-data-page object-page">
    <PageHeader title="业务对象登记" subtitle="统一登记项目空间内的业务实体，维护归属关系与动态属性版本">
      <template #actions>
        <el-button :icon="Refresh" :loading="loading" @click="loadObjects">刷新数据</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">登记业务对象</el-button>
      </template>
    </PageHeader>

    <section class="overview-band" aria-label="业务对象概览">
      <div class="overview-primary">
        <span class="overview-icon"><el-icon><Box /></el-icon></span>
        <div>
          <span class="metric-label">业务对象总数</span>
          <strong>{{ total }}</strong>
        </div>
      </div>
      <div class="overview-metrics">
        <div class="metric-item">
          <span class="metric-dot active"></span>
          <div><span>本页启用</span><strong>{{ activeCount }}</strong></div>
        </div>
        <div class="metric-item">
          <span class="metric-dot inactive"></span>
          <div><span>本页停用</span><strong>{{ inactiveCount }}</strong></div>
        </div>
        <div class="metric-item">
          <span class="metric-dot type"></span>
          <div><span>对象类型</span><strong>{{ typeCount }}</strong></div>
        </div>
      </div>
      <div class="context-info">
        <span>当前项目空间</span>
        <strong class="mono">{{ filters.projectSpaceId || '全部空间' }}</strong>
      </div>
    </section>

    <section class="query-panel">
      <div class="section-heading">
        <div>
          <h2>筛选对象</h2>
          <span>按空间、类型、归属主体和状态定位业务对象</span>
        </div>
      </div>
      <div class="query-grid">
        <label class="query-field">
          <span>项目空间 ID</span>
          <el-input v-model="filters.projectSpaceId" clearable placeholder="请输入项目空间 ID" @keyup.enter="handleSearch" />
        </label>
        <label class="query-field">
          <span>对象类型</span>
          <el-select v-model="filters.objectType" clearable filterable allow-create placeholder="全部对象类型">
            <el-option v-for="item in objectTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </label>
        <label class="query-field">
          <span>所有者主体 ID</span>
          <el-input v-model="filters.ownerPartyId" clearable placeholder="请输入主体 ID" @keyup.enter="handleSearch" />
        </label>
        <label class="query-field status-field">
          <span>对象状态</span>
          <el-select v-model="filters.status" clearable placeholder="全部状态">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="INACTIVE" />
          </el-select>
        </label>
        <div class="query-actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </div>
      </div>
    </section>

    <section class="object-list">
      <div class="list-header">
        <div>
          <h2>对象清单</h2>
          <span>共 {{ total }} 条记录，本页展示 {{ objects.length }} 条</span>
        </div>
        <div class="list-legend">
          <span><i class="legend-dot active"></i>启用</span>
          <span><i class="legend-dot inactive"></i>停用</span>
        </div>
      </div>
      <div class="table-wrap">
        <el-table
          :data="objects"
          v-loading="loading"
          row-key="objectId"
          empty-text="暂无业务对象记录"
          style="width: 100%"
          class="object-table"
        >
          <el-table-column label="业务对象" min-width="250" fixed="left">
            <template #default="{ row }">
              <div class="object-cell">
                <span class="object-type-icon"><el-icon><Box /></el-icon></span>
                <div>
                  <strong>{{ objectTypeLabel(row.objectType) }}</strong>
                  <span class="mono">ID {{ row.objectId }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="projectSpaceId" label="项目空间" min-width="150">
            <template #default="{ row }"><span class="mono id-text">{{ row.projectSpaceId }}</span></template>
          </el-table-column>
          <el-table-column prop="ownerPartyId" label="所有者主体" min-width="150">
            <template #default="{ row }"><span :class="['mono', 'id-text', { muted: !row.ownerPartyId }]">{{ row.ownerPartyId || '未关联' }}</span></template>
          </el-table-column>
          <el-table-column prop="currentVersionNo" label="当前版本" width="110" align="center">
            <template #default="{ row }"><span class="version-chip mono">V{{ row.currentVersionNo }}</span></template>
          </el-table-column>
          <el-table-column label="状态" width="96">
            <template #default="{ row }"><StatusTag :code="row.status" :label="statusLabel(row.status)" /></template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="最近更新" width="176"><template #default="{ row }"><span class="time-text">{{ row.updatedAt || row.createdAt || '-' }}</span></template></el-table-column>
          <el-table-column label="操作" width="104" fixed="right" align="center">
            <template #default="{ row }">
              <div class="row-actions">
                <el-tooltip content="查看详情" placement="top"><el-button circle :icon="View" @click="openDetail(row)" /></el-tooltip>
                <el-tooltip content="编辑对象" placement="top"><el-button circle :icon="EditPen" @click="openEdit(row)" /></el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-row">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next"
            @current-change="loadObjects"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </section>

    <el-dialog
      v-model="formVisible"
      width="800px"
      destroy-on-close
      :close-on-click-modal="false"
      class="object-form-dialog"
    >
      <template #header>
        <div class="dialog-heading">
          <span class="heading-icon"><el-icon><EditPen v-if="editing" /><Plus v-else /></el-icon></span>
          <div>
            <h2>{{ editing ? '编辑业务对象' : '登记业务对象' }}</h2>
            <p>{{ editing ? '修改对象归属与状态，保存后生成新的属性版本' : '建立业务对象主记录并录入首个属性版本' }}</p>
          </div>
        </div>
      </template>
      <div v-loading="formLoading">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <div class="form-section">
            <div class="form-section-heading"><span>基础信息</span><small>用于识别对象及其业务归属</small></div>
            <div class="form-grid">
            <el-form-item label="项目空间 ID" prop="projectSpaceId">
              <el-input v-model="form.projectSpaceId" class="mono" :disabled="editing" placeholder="请输入数字字符串 ID" />
            </el-form-item>
            <el-form-item label="对象类型" prop="objectType">
              <el-select v-model="form.objectType" :disabled="editing" allow-create filterable style="width: 100%">
                <el-option v-for="item in objectTypes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="!editing" label="来源业务键" prop="sourceBusinessKey">
              <el-input v-model="form.sourceBusinessKey" maxlength="200" placeholder="来源系统内唯一业务键" />
            </el-form-item>
            <el-form-item label="所有者主体 ID" prop="ownerPartyId">
              <el-input v-model="form.ownerPartyId" class="mono" placeholder="可选，数字字符串 ID" />
            </el-form-item>
            <el-form-item v-if="editing" label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio-button label="ACTIVE">启用</el-radio-button>
                <el-radio-button label="INACTIVE">停用</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="editing" label="当前属性版本">
              <el-input :model-value="`V${form.currentVersionNo}`" class="mono" disabled />
            </el-form-item>
            </div>
          </div>
          <div class="form-section attribute-form-section">
            <div class="form-section-heading">
              <div><span>动态属性</span><small>{{ editing ? '保存后创建完整属性快照' : '使用 JSON 描述不同类型对象的扩展字段' }}</small></div>
              <el-button text type="primary" @click="formatAttributes">格式化 JSON</el-button>
            </div>
            <el-form-item prop="attributes">
              <el-input v-model="form.attributes" class="json-input" type="textarea" :rows="10" placeholder='{"displayName":"2026 年三七春播批次","batchNo":"CROP-2026-001"}' />
            </el-form-item>
          </div>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="formLoading" @click="submit">
          {{ editing ? '保存并创建新版本' : '提交登记' }}
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" size="600px" class="object-detail-drawer">
      <template #header>
        <div class="drawer-heading">
          <span class="heading-icon"><el-icon><Box /></el-icon></span>
          <div><h2>业务对象详情</h2><p>对象主记录与当前生效的属性版本</p></div>
        </div>
      </template>
      <el-skeleton v-if="detailLoading" :rows="8" animated />
      <template v-else-if="detail">
        <div class="detail-identity">
          <span class="object-type-icon large"><el-icon><Box /></el-icon></span>
          <div><span>{{ objectTypeLabel(detail.objectType) }}</span><strong class="mono">{{ detail.objectId }}</strong></div>
          <StatusTag :code="detail.status" :label="statusLabel(detail.status)" />
        </div>
        <section class="detail-section">
          <h3>归属信息</h3>
          <div class="detail-grid">
            <div><span>租户 ID</span><strong class="mono">{{ detail.tenantId || '-' }}</strong></div>
            <div><span>项目空间 ID</span><strong class="mono">{{ detail.projectSpaceId }}</strong></div>
            <div><span>所有者主体 ID</span><strong class="mono">{{ detail.ownerPartyId || '未关联' }}</strong></div>
            <div><span>当前属性版本</span><strong class="mono version-text">V{{ detail.currentVersionNo }}</strong></div>
          </div>
        </section>
        <section class="detail-section">
          <h3>版本时间</h3>
          <div class="timeline-list">
            <div><span>版本生效</span><strong>{{ detail.effectiveFrom || '-' }}</strong></div>
            <div><span>首次创建</span><strong>{{ detail.createdAt || '-' }}</strong></div>
            <div><span>最近更新</span><strong>{{ detail.updatedAt || '-' }}</strong></div>
          </div>
        </section>
        <section class="attribute-section">
          <div class="attribute-title"><span>当前版本动态属性</span><small>V{{ detail.currentVersionNo }}</small></div>
          <pre class="attribute-json mono">{{ prettyJson(detail.attributes) }}</pre>
        </section>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Box, EditPen, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import {
  masterDataApi,
  type BusinessObjectDetailResponse,
  type BusinessObjectSummaryResponse
} from '@/api/masterData';
import { apiErrorMessage } from '@/api/client';

const objectTypes = [
  { label: 'CROP_BATCH - 种植批次', value: 'CROP_BATCH' },
  { label: 'PROCESS_BATCH - 加工批次', value: 'PROCESS_BATCH' },
  { label: 'HERB_PACKAGE - 药材包装', value: 'HERB_PACKAGE' },
  { label: 'ORDER - 业务订单', value: 'ORDER' },
  { label: 'STOCK - 库存单元', value: 'STOCK' },
  { label: 'PRESCRIPTION - 处方', value: 'PRESCRIPTION' }
];
const storedProjectSpaceId = localStorage.getItem('tcmirp_project_space_id') || localStorage.getItem('tcmirp_project_id') || '';
const objects = ref<BusinessObjectSummaryResponse[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const filters = reactive({ projectSpaceId: storedProjectSpaceId, objectType: '', ownerPartyId: '', status: '' });
const activeCount = computed(() => objects.value.filter(item => item.status === 'ACTIVE').length);
const inactiveCount = computed(() => objects.value.filter(item => item.status === 'INACTIVE').length);
const typeCount = computed(() => new Set(objects.value.map(item => item.objectType).filter(Boolean)).size);

const formVisible = ref(false);
const formLoading = ref(false);
const submitting = ref(false);
const editing = ref(false);
const editingId = ref('');
const formRef = ref<FormInstance>();
const blankForm = () => ({
  projectSpaceId: storedProjectSpaceId,
  objectType: 'CROP_BATCH',
  sourceBusinessKey: '',
  ownerPartyId: '',
  attributes: JSON.stringify({ displayName: '', batchNo: '' }, null, 2),
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  currentVersionNo: ''
});
const form = reactive(blankForm());
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<BusinessObjectDetailResponse | null>(null);

const numericId = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value || /^-?[0-9]+$/.test(value)) callback();
  else callback(new Error('请输入数字字符串 ID'));
};
const validJsonObject = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
    callback();
  } catch {
    callback(new Error('请输入合法的 JSON 对象字符串'));
  }
};
const rules: FormRules = {
  projectSpaceId: [{ required: true, message: '请输入项目空间 ID', trigger: 'blur' }, { validator: numericId, trigger: 'blur' }],
  objectType: [{ required: true, message: '请输入对象类型', trigger: 'change' }],
  sourceBusinessKey: [{ required: true, message: '请输入来源业务键', trigger: 'blur' }],
  ownerPartyId: [{ validator: numericId, trigger: 'blur' }],
  attributes: [{ required: true, message: '请输入动态属性', trigger: 'blur' }, { validator: validJsonObject, trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const objectTypeLabel = (value?: string) => objectTypes.find(item => item.value === value)?.label || value || '-';
const statusLabel = (value?: string) => value === 'ACTIVE' ? '启用' : value === 'INACTIVE' ? '停用' : value || '-';
const prettyJson = (value?: string) => {
  if (!value) return '{}';
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
};

const loadObjects = async () => {
  loading.value = true;
  try {
    const result = await masterDataApi.getBusinessObjectPage({
      projectSpaceId: filters.projectSpaceId.trim() || undefined,
      objectType: filters.objectType.trim() || undefined,
      ownerPartyId: filters.ownerPartyId.trim() || undefined,
      status: filters.status || undefined,
      page: page.value,
      size: pageSize.value
    });
    objects.value = result.records;
    total.value = result.total;
    page.value = result.page;
    pageSize.value = result.size;
  } catch (error) {
    objects.value = [];
    total.value = 0;
    ElMessage.error(apiErrorMessage(error, '业务对象列表加载失败'));
  } finally {
    loading.value = false;
  }
};
const handleSearch = () => { page.value = 1; loadObjects(); };
const handleReset = () => {
  Object.assign(filters, { projectSpaceId: storedProjectSpaceId, objectType: '', ownerPartyId: '', status: '' });
  page.value = 1;
  loadObjects();
};
const handleSizeChange = () => { page.value = 1; loadObjects(); };

const openCreate = () => {
  editing.value = false;
  editingId.value = '';
  Object.assign(form, blankForm());
  formRef.value?.clearValidate();
  formVisible.value = true;
};
const openEdit = async (row: BusinessObjectSummaryResponse) => {
  editing.value = true;
  editingId.value = String(row.objectId);
  Object.assign(form, blankForm(), {
    projectSpaceId: row.projectSpaceId,
    objectType: row.objectType,
    ownerPartyId: row.ownerPartyId || '',
    status: row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    currentVersionNo: row.currentVersionNo,
    attributes: '{}'
  });
  formVisible.value = true;
  formLoading.value = true;
  try {
    const result = await masterDataApi.getBusinessObjectById(editingId.value);
    Object.assign(form, {
      projectSpaceId: result.projectSpaceId,
      objectType: result.objectType,
      ownerPartyId: result.ownerPartyId || '',
      attributes: prettyJson(result.attributes),
      status: result.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      currentVersionNo: result.currentVersionNo
    });
    formRef.value?.clearValidate();
  } catch (error) {
    formVisible.value = false;
    ElMessage.error(apiErrorMessage(error, '业务对象详情加载失败'));
  } finally {
    formLoading.value = false;
  }
};
const openDetail = async (row: BusinessObjectSummaryResponse) => {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    detail.value = await masterDataApi.getBusinessObjectById(String(row.objectId));
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '业务对象详情加载失败'));
  } finally {
    detailLoading.value = false;
  }
};
const formatAttributes = () => {
  try {
    const parsed = JSON.parse(form.attributes);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
    form.attributes = JSON.stringify(parsed, null, 2);
  } catch {
    ElMessage.warning('请先输入合法的 JSON 对象');
  }
};
const submit = async () => {
  if (!await formRef.value?.validate().catch(() => false)) return;
  submitting.value = true;
  try {
    const attributes = JSON.stringify(JSON.parse(form.attributes));
    if (editing.value) {
      await masterDataApi.updateBusinessObject(editingId.value, {
        ownerPartyId: form.ownerPartyId.trim() || undefined,
        attributes,
        status: form.status,
        currentVersionNo: form.currentVersionNo
      });
      ElMessage.success('业务对象更新成功，已创建新属性版本');
    } else {
      await masterDataApi.registerBusinessObject({
        projectSpaceId: form.projectSpaceId.trim(),
        objectType: form.objectType.trim(),
        ownerPartyId: form.ownerPartyId.trim() || undefined,
        attributes,
        sourceBusinessKey: form.sourceBusinessKey.trim()
      });
      ElMessage.success('业务对象登记成功');
    }
    formVisible.value = false;
    await loadObjects();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, editing.value ? '业务对象更新失败' : '业务对象登记失败'));
  } finally {
    submitting.value = false;
  }
};

onMounted(loadObjects);
</script>

<style scoped>
.object-page { padding-bottom: 28px; }
.overview-band { display: grid; grid-template-columns: minmax(220px, 1.1fr) minmax(420px, 2fr) minmax(190px, auto); align-items: stretch; min-height: 100px; margin-bottom: 16px; overflow: hidden; background: #fff; border: 1px solid #dce7e3; border-radius: 8px; box-shadow: 0 3px 12px rgba(23, 67, 63, 0.05); }
.overview-primary { display: flex; align-items: center; gap: 16px; padding: 20px 22px; background: #f0f8f5; border-right: 1px solid #dce7e3; }
.overview-icon, .heading-icon { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; color: #fff; background: #176f63; }
.overview-icon { width: 44px; height: 44px; border-radius: 8px; font-size: 22px; }
.overview-primary > div { display: flex; flex-direction: column; }
.metric-label, .metric-item span:not(.metric-dot), .context-info span { color: #6b7f7b; font-size: 12px; line-height: 18px; }
.overview-primary strong { color: #173f3b; font-size: 30px; font-weight: 700; line-height: 34px; }
.overview-metrics { display: grid; grid-template-columns: repeat(3, minmax(110px, 1fr)); align-items: center; padding: 14px 4px; }
.metric-item { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 4px 22px; border-right: 1px solid #e6eeeb; }
.metric-item:last-child { border-right: 0; }
.metric-item > div { display: flex; min-width: 0; flex-direction: column; }
.metric-item strong { color: #233c39; font-size: 21px; font-weight: 700; line-height: 26px; }
.metric-dot, .legend-dot { display: inline-block; flex: 0 0 auto; border-radius: 50%; }
.metric-dot { width: 9px; height: 9px; }
.metric-dot.active, .legend-dot.active { background: #22a06b; }
.metric-dot.inactive, .legend-dot.inactive { background: #d8902f; }
.metric-dot.type { background: #367ea5; }
.context-info { display: flex; min-width: 190px; flex-direction: column; justify-content: center; padding: 18px 22px; background: #fbfcfc; border-left: 1px solid #e6eeeb; }
.context-info strong { max-width: 220px; overflow: hidden; color: #294d48; font-size: 13px; line-height: 24px; text-overflow: ellipsis; white-space: nowrap; }
.query-panel, .object-list { background: #fff; border: 1px solid #dce7e3; border-radius: 8px; box-shadow: 0 3px 12px rgba(23, 67, 63, 0.04); }
.query-panel { margin-bottom: 16px; padding: 16px 18px 18px; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
.section-heading h2, .list-header h2, .dialog-heading h2, .drawer-heading h2 { margin: 0; color: #1d3834; letter-spacing: 0; }
.section-heading h2, .list-header h2 { font-size: 15px; line-height: 22px; }
.section-heading span, .list-header > div > span { display: block; margin-top: 2px; color: #7a8e8a; font-size: 12px; line-height: 18px; }
.query-grid { display: grid; grid-template-columns: minmax(155px, 1fr) minmax(200px, 1.25fr) minmax(155px, 1fr) minmax(130px, .72fr) auto; align-items: end; gap: 14px; }
.query-field { display: flex; min-width: 0; flex-direction: column; gap: 7px; }
.query-field > span { color: #4d625e; font-size: 12px; font-weight: 600; line-height: 18px; }
.query-field :deep(.el-select), .query-field :deep(.el-input) { width: 100%; }
.query-actions { display: flex; gap: 8px; justify-content: flex-end; }
.query-actions .el-button { min-width: 72px; margin-left: 0; }
.object-list { overflow: hidden; }
.list-header { display: flex; align-items: center; justify-content: space-between; min-height: 66px; padding: 12px 18px; border-bottom: 1px solid #e5eeeb; }
.list-legend { display: flex; align-items: center; gap: 18px; color: #667a76; font-size: 12px; }
.list-legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend-dot { width: 7px; height: 7px; }
.table-wrap { padding: 0 18px; }
.object-table :deep(th.el-table__cell) { height: 44px; background: #f6f9f8; color: #526762; font-size: 12px; font-weight: 600; }
.object-table :deep(td.el-table__cell) { height: 64px; border-bottom-color: #edf2f0; }
.object-table :deep(.el-table__row:hover > td.el-table__cell) { background: #f5faf8; }
.object-table :deep(.cell) { line-height: 20px; }
.object-cell { display: flex; min-width: 0; align-items: center; gap: 11px; }
.object-type-icon { display: inline-flex; flex: 0 0 auto; width: 34px; height: 34px; align-items: center; justify-content: center; color: #176f63; background: #eaf5f1; border: 1px solid #d3e9e1; border-radius: 7px; font-size: 17px; }
.object-type-icon.large { width: 42px; height: 42px; font-size: 20px; }
.object-cell > div { display: flex; min-width: 0; flex-direction: column; }
.object-cell strong { overflow: hidden; color: #24423e; font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.object-cell span { color: #7b8f8b; font-size: 11px; }
.id-text { color: #405f5a; font-size: 12px; }
.id-text.muted { color: #9aa9a6; }
.version-chip { display: inline-flex; min-width: 38px; height: 24px; align-items: center; justify-content: center; color: #246b91; background: #edf6fb; border: 1px solid #d5e8f3; border-radius: 4px; font-size: 11px; font-weight: 700; }
.time-text { color: #617570; font-size: 12px; }
.row-actions { display: flex; align-items: center; justify-content: center; gap: 6px; }
.row-actions .el-button { width: 28px; height: 28px; margin-left: 0; color: #45625d; background: #fff; border-color: #dbe6e2; }
.row-actions .el-button:hover { color: #176f63; background: #edf7f4; border-color: #a9cec4; }
.pagination-row { padding: 16px 0 18px; }
.dialog-heading, .drawer-heading { display: flex; align-items: center; gap: 12px; }
.heading-icon { width: 38px; height: 38px; border-radius: 7px; font-size: 18px; }
.dialog-heading h2, .drawer-heading h2 { font-size: 17px; line-height: 24px; }
.dialog-heading p, .drawer-heading p { margin: 2px 0 0; color: #738682; font-size: 12px; line-height: 18px; }
.form-section { padding: 2px 0 4px; }
.form-section + .form-section { margin-top: 12px; padding-top: 18px; border-top: 1px solid #e4ece9; }
.form-section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
.form-section-heading > span, .form-section-heading > div > span { color: #29433f; font-size: 14px; font-weight: 700; }
.form-section-heading small { display: block; margin-top: 2px; color: #81918e; font-size: 11px; font-weight: 400; }
.form-section-heading > span + small { margin: 0 0 0 10px; flex: 1; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
.attribute-form-section :deep(.el-form-item) { margin-bottom: 0; }
:deep(.json-input textarea) { padding: 14px 16px; color: #2e4945; background: #f8fbfa; font-family: "JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 1.65; }
.detail-identity { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 16px; background: #f1f8f6; border: 1px solid #d6e9e3; border-radius: 8px; }
.detail-identity > div { display: flex; min-width: 0; flex-direction: column; }
.detail-identity > div span { color: #294843; font-size: 13px; font-weight: 600; }
.detail-identity > div strong { overflow: hidden; color: #748783; font-size: 12px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.detail-section, .attribute-section { margin-top: 22px; }
.detail-section h3, .attribute-title { margin: 0 0 10px; color: #29433f; font-size: 13px; font-weight: 700; line-height: 20px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; border: 1px solid #e0e9e6; border-radius: 7px; }
.detail-grid > div { display: flex; min-width: 0; min-height: 68px; flex-direction: column; justify-content: center; padding: 10px 14px; border-right: 1px solid #e8efed; border-bottom: 1px solid #e8efed; }
.detail-grid > div:nth-child(2n) { border-right: 0; }
.detail-grid > div:nth-last-child(-n + 2) { border-bottom: 0; }
.detail-grid span, .timeline-list span { color: #7c8d89; font-size: 11px; line-height: 18px; }
.detail-grid strong { overflow: hidden; color: #334f4a; font-size: 12px; line-height: 22px; text-overflow: ellipsis; white-space: nowrap; }
.detail-grid .version-text { color: #246b91; }
.timeline-list { border-top: 1px solid #e4ece9; }
.timeline-list > div { display: grid; grid-template-columns: 100px 1fr; gap: 14px; padding: 10px 4px; border-bottom: 1px solid #edf2f0; }
.timeline-list strong { color: #465e59; font-size: 12px; font-weight: 500; text-align: right; }
.attribute-title { display: flex; align-items: center; justify-content: space-between; }
.attribute-title small { padding: 2px 7px; color: #246b91; background: #edf6fb; border-radius: 4px; font-size: 10px; }
.attribute-json { max-height: 360px; margin: 0; padding: 15px 16px; overflow: auto; white-space: pre-wrap; word-break: break-word; color: #294342; background: #f5f9f8; border: 1px solid #dfe9e6; border-radius: 7px; font-size: 12px; line-height: 1.7; }
:deep(.object-form-dialog .el-dialog__header) { margin-right: 0; padding: 20px 22px 16px; border-bottom: 1px solid #e5ecea; }
:deep(.object-form-dialog .el-dialog__body) { padding: 20px 22px 22px; }
:deep(.object-form-dialog .el-dialog__footer) { padding: 14px 22px; background: #f8faf9; border-top: 1px solid #e5ecea; }
:deep(.object-detail-drawer .el-drawer__header) { margin-bottom: 0; padding: 20px 22px 16px; border-bottom: 1px solid #e5ecea; }
:deep(.object-detail-drawer .el-drawer__body) { padding: 20px 22px; }
@media (max-width: 1100px) {
  .overview-band { grid-template-columns: minmax(200px, .8fr) minmax(400px, 2fr); }
  .context-info { display: none; }
  .query-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .query-actions { grid-column: 2; }
}
@media (max-width: 720px) {
  .overview-band { grid-template-columns: 1fr; }
  .overview-primary { border-right: 0; border-bottom: 1px solid #dce7e3; }
  .overview-metrics { grid-template-columns: repeat(3, 1fr); }
  .metric-item { padding: 4px 12px; }
  .query-grid, .form-grid { grid-template-columns: 1fr; }
  .query-actions { grid-column: auto; }
  .list-legend { display: none; }
  .table-wrap { padding: 0 10px; }
  .detail-grid { grid-template-columns: 1fr; }
  .detail-grid > div, .detail-grid > div:nth-child(2n), .detail-grid > div:nth-last-child(-n + 2) { border-right: 0; border-bottom: 1px solid #e8efed; }
  .detail-grid > div:last-child { border-bottom: 0; }
}
</style>
