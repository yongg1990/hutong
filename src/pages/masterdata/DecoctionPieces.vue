<template>
  <div class="master-data-page piece-page">
    <PageHeader title="饮片品种管理" subtitle="统一维护饮片品种、炮制规格及医保和药监编码">
      <template #actions>
        <el-button :icon="Refresh" :loading="loading" @click="loadPieces">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增饮片品种</el-button>
      </template>
    </PageHeader>

    <div class="summary-strip">
      <div class="summary-item"><span>饮片品种总数</span><strong>{{ total }}</strong></div>
      <div class="summary-item"><span>本页启用</span><strong class="active-number">{{ activeCount }}</strong></div>
      <div class="summary-item"><span>本页停用</span><strong class="inactive-number">{{ inactiveCount }}</strong></div>
    </div>

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="filters.productName" clearable placeholder="品种名称" style="width: 170px" @keyup.enter="handleSearch" />
      <el-input v-model="filters.materialName" clearable placeholder="药材名称" style="width: 160px" @keyup.enter="handleSearch" />
      <el-input v-model="filters.processingMethod" clearable placeholder="炮制方法" style="width: 150px" @keyup.enter="handleSearch" />
      <el-input v-model="filters.medicalInsuranceCode" clearable class="mono-input" placeholder="医保饮片编码" style="width: 180px" @keyup.enter="handleSearch" />
      <el-input v-model="filters.nmpaPieceCode" clearable class="mono-input" placeholder="药监饮片标识码" style="width: 180px" @keyup.enter="handleSearch" />
      <el-select v-model="filters.status" clearable placeholder="状态" style="width: 120px">
        <el-option label="启用" value="ACTIVE" />
        <el-option label="停用" value="INACTIVE" />
      </el-select>
    </FilterBar>

    <section class="panel table-panel">
      <div class="panel-header"><div><h2>饮片品种列表</h2><span class="panel-hint">共 {{ total }} 条记录</span></div></div>
      <div class="panel-body">
        <el-table :data="pieces" v-loading="loading" row-key="productId" empty-text="暂无饮片品种记录" style="width: 100%">
          <el-table-column prop="productId" label="品种 ID" width="170">
            <template #default="{ row }"><span class="mono product-id">{{ row.productId }}</span></template>
          </el-table-column>
          <el-table-column prop="productName" label="品种名称" min-width="160" show-overflow-tooltip>
            <template #default="{ row }"><strong>{{ row.productName }}</strong></template>
          </el-table-column>
          <el-table-column prop="materialName" label="药材名称" min-width="130" show-overflow-tooltip />
          <el-table-column prop="processingMethod" label="炮制方法" min-width="130" show-overflow-tooltip />
          <el-table-column prop="specification" label="规格" min-width="130" show-overflow-tooltip>
            <template #default="{ row }">{{ row.specification || '-' }}</template>
          </el-table-column>
          <el-table-column label="医保饮片编码" min-width="180" show-overflow-tooltip>
            <template #default="{ row }"><span class="mono code-value">{{ row.medicalInsuranceCode || '-' }}</span></template>
          </el-table-column>
          <el-table-column label="药监饮片标识码" min-width="180" show-overflow-tooltip>
            <template #default="{ row }"><span class="mono code-value nmpa-code">{{ row.nmpaPieceCode || '-' }}</span></template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }"><StatusTag :code="row.status" :label="statusLabel(row.status)" /></template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="175">
            <template #default="{ row }">{{ row.updatedAt || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.status === 'ACTIVE'" link type="danger" size="small" @click="disablePiece(row)">停用</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-row">
          <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next" @current-change="loadPieces" @size-change="handleSizeChange" />
        </div>
      </div>
    </section>

    <el-dialog v-model="formVisible" :title="editing ? '编辑饮片品种' : '新增饮片品种'" width="860px" destroy-on-close :close-on-click-modal="false">
      <div v-loading="formLoading">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <div class="form-grid three">
            <el-form-item label="品种名称" prop="productName"><el-input v-model="form.productName" maxlength="200" placeholder="请输入品种名称" /></el-form-item>
            <el-form-item label="药材名称" prop="materialName"><el-input v-model="form.materialName" maxlength="200" placeholder="请输入药材名称" /></el-form-item>
            <el-form-item label="炮制方法" prop="processingMethod"><el-input v-model="form.processingMethod" maxlength="200" placeholder="请输入炮制方法" /></el-form-item>
          </div>
          <div class="form-grid">
            <el-form-item label="规格"><el-input v-model="form.specification" maxlength="200" placeholder="请输入规格" /></el-form-item>
            <el-form-item label="执行标准"><el-input v-model="form.executiveStandard" maxlength="300" placeholder="请输入执行标准" /></el-form-item>
          </div>

          <div class="section-heading">
            <div><strong>外部监管编码</strong><span>至少填写一条编码</span></div>
            <el-button type="primary" link :icon="Plus" @click="addCode">添加编码</el-button>
          </div>
          <div v-for="(code, index) in form.codes" :key="index" class="code-row">
            <el-form-item label="编码体系"><el-input v-model="code.schemeCode" maxlength="128" placeholder="编码体系代码" /></el-form-item>
            <el-form-item label="编码值"><el-input v-model="code.code" class="mono-input" maxlength="256" placeholder="请输入编码值" /></el-form-item>
            <el-form-item label="来源权威机构"><el-input v-model="code.sourceAuthority" maxlength="200" placeholder="请输入来源机构" /></el-form-item>
            <el-form-item label="生效时间">
              <el-date-picker v-model="code.validFrom" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择生效时间" style="width: 100%" />
            </el-form-item>
            <el-form-item label="失效时间">
              <el-date-picker v-model="code.validTo" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可选" style="width: 100%" />
            </el-form-item>
            <el-tooltip content="移除编码" placement="top">
              <el-button v-if="form.codes.length > 1" class="remove-code" circle plain type="danger" :icon="Delete" @click="removeCode(index)" />
            </el-tooltip>
          </div>

          <template v-if="editing">
            <div class="form-grid three">
              <el-form-item label="药监编码版本"><el-input v-model="form.nmpaCodeVersion" maxlength="100" placeholder="可选" /></el-form-item>
              <el-form-item label="状态" prop="status">
                <el-radio-group v-model="form.status"><el-radio-button label="ACTIVE">启用</el-radio-button><el-radio-button label="INACTIVE">停用</el-radio-button></el-radio-group>
              </el-form-item>
              <el-form-item label="品种生效时间" prop="validFrom">
                <el-date-picker v-model="form.validFrom" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择生效时间" style="width: 100%" />
              </el-form-item>
            </div>
            <div class="form-grid">
              <el-form-item label="品种失效时间">
                <el-date-picker v-model="form.validTo" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可选" style="width: 100%" />
              </el-form-item>
              <el-form-item label="监管扩展属性 JSON" prop="regulatoryAttributes">
                <el-input v-model="form.regulatoryAttributes" type="textarea" :rows="3" class="json-input" placeholder="可选，请输入 JSON 对象" />
              </el-form-item>
            </div>
          </template>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="formLoading" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="饮片品种详情" size="560px">
      <el-skeleton v-if="detailLoading" :rows="10" animated />
      <template v-else-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="品种 ID"><span class="mono">{{ detail.productId }}</span></el-descriptions-item>
          <el-descriptions-item label="租户 ID"><span class="mono">{{ detail.tenantId || '-' }}</span></el-descriptions-item>
          <el-descriptions-item label="品种名称">{{ detail.productName }}</el-descriptions-item>
          <el-descriptions-item label="药材名称">{{ detail.materialName }}</el-descriptions-item>
          <el-descriptions-item label="炮制方法">{{ detail.processingMethod }}</el-descriptions-item>
          <el-descriptions-item label="规格">{{ detail.specification || '-' }}</el-descriptions-item>
          <el-descriptions-item label="执行标准">{{ detail.executiveStandard || '-' }}</el-descriptions-item>
          <el-descriptions-item label="医保饮片编码"><span class="mono">{{ detail.medicalInsuranceCode || '-' }}</span></el-descriptions-item>
          <el-descriptions-item label="药监饮片标识码"><span class="mono">{{ detail.nmpaPieceCode || '-' }}</span></el-descriptions-item>
          <el-descriptions-item label="药监编码版本">{{ detail.nmpaCodeVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态"><StatusTag :code="detail.status" :label="statusLabel(detail.status)" /></el-descriptions-item>
          <el-descriptions-item label="生效时间">{{ detail.validFrom || '-' }}</el-descriptions-item>
          <el-descriptions-item label="失效时间">{{ detail.validTo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.createdAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.updatedAt || '-' }}</el-descriptions-item>
        </el-descriptions>
        <section class="attribute-section"><div class="attribute-title">监管扩展属性</div><pre class="attribute-json mono">{{ prettyJson(detail.regulatoryAttributes) }}</pre></section>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Plus, Refresh } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { apiErrorMessage } from '@/api/client';
import { masterDataApi, type PieceProductCodeItem, type PieceProductDetailResponse } from '@/api/masterData';

type ProductStatus = 'ACTIVE' | 'INACTIVE';
type PieceCodeForm = PieceProductCodeItem & { validTo: string };

const pieces = ref<PieceProductDetailResponse[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const filters = reactive({ productName: '', materialName: '', processingMethod: '', medicalInsuranceCode: '', nmpaPieceCode: '', status: '' });
const activeCount = computed(() => pieces.value.filter(item => item.status === 'ACTIVE').length);
const inactiveCount = computed(() => pieces.value.filter(item => item.status === 'INACTIVE').length);
const formVisible = ref(false);
const formLoading = ref(false);
const submitting = ref(false);
const editing = ref(false);
const editingId = ref('');
const formRef = ref<FormInstance>();
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<PieceProductDetailResponse | null>(null);

const nowText = () => {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const blankCode = (): PieceCodeForm => ({ schemeCode: 'NATIONAL_MEDICAL_INSURANCE_16', code: '', sourceAuthority: '国家医疗保障局', validFrom: nowText(), validTo: '' });
const blankForm = () => ({
  productName: '', materialName: '', processingMethod: '', specification: '', executiveStandard: '',
  codes: [blankCode()] as PieceCodeForm[], regulatoryAttributes: '', nmpaCodeVersion: '',
  status: 'ACTIVE' as ProductStatus, validFrom: nowText(), validTo: ''
});
const form = reactive(blankForm());

const validJsonObject = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value.trim()) { callback(); return; }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
    callback();
  } catch { callback(new Error('请输入合法的 JSON 对象字符串')); }
};
const rules: FormRules = {
  productName: [{ required: true, message: '请输入品种名称', trigger: 'blur' }],
  materialName: [{ required: true, message: '请输入药材名称', trigger: 'blur' }],
  processingMethod: [{ required: true, message: '请输入炮制方法', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  validFrom: [{ required: true, message: '请选择品种生效时间', trigger: 'change' }],
  regulatoryAttributes: [{ validator: validJsonObject, trigger: 'blur' }]
};
const statusLabel = (value?: string) => value === 'ACTIVE' ? '启用' : value === 'INACTIVE' ? '停用' : value || '-';
const prettyJson = (value?: string) => { if (!value) return '-'; try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } };
const buildCodes = (piece: PieceProductDetailResponse): PieceCodeForm[] => {
  const codes: PieceCodeForm[] = [];
  const validFrom = piece.validFrom || nowText();
  const validTo = piece.validTo || '';
  if (piece.medicalInsuranceCode) codes.push({ schemeCode: 'NATIONAL_MEDICAL_INSURANCE_16', code: piece.medicalInsuranceCode, sourceAuthority: '国家医疗保障局', validFrom, validTo });
  if (piece.nmpaPieceCode) codes.push({ schemeCode: 'NMPA_DRUG_TRACE', code: piece.nmpaPieceCode, sourceAuthority: '国家药品监督管理局', validFrom, validTo });
  return codes.length ? codes : [blankCode()];
};

const loadPieces = async () => {
  loading.value = true;
  try {
    const result = await masterDataApi.getPieceProductPage({
      productName: filters.productName.trim() || undefined, materialName: filters.materialName.trim() || undefined,
      processingMethod: filters.processingMethod.trim() || undefined, medicalInsuranceCode: filters.medicalInsuranceCode.trim() || undefined,
      nmpaPieceCode: filters.nmpaPieceCode.trim() || undefined, status: filters.status || undefined, page: page.value, size: pageSize.value
    });
    pieces.value = result.records; total.value = result.total; page.value = result.page; pageSize.value = result.size;
  } catch (error) {
    pieces.value = []; total.value = 0; ElMessage.error(apiErrorMessage(error, '饮片品种列表加载失败'));
  } finally { loading.value = false; }
};
const handleSearch = () => { page.value = 1; loadPieces(); };
const handleReset = () => {
  Object.assign(filters, { productName: '', materialName: '', processingMethod: '', medicalInsuranceCode: '', nmpaPieceCode: '', status: '' });
  page.value = 1; loadPieces();
};
const handleSizeChange = () => { page.value = 1; loadPieces(); };

const openCreate = () => {
  editing.value = false; editingId.value = ''; Object.assign(form, blankForm()); formRef.value?.clearValidate(); formVisible.value = true;
};
const openEdit = async (row: PieceProductDetailResponse) => {
  editing.value = true; editingId.value = String(row.productId); Object.assign(form, blankForm(), { ...row, codes: buildCodes(row) });
  formVisible.value = true; formLoading.value = true;
  try {
    const result = await masterDataApi.getPieceProductById(editingId.value);
    const regulatoryAttributes = prettyJson(result.regulatoryAttributes);
    Object.assign(form, { ...blankForm(), ...result, status: result.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE', regulatoryAttributes: regulatoryAttributes === '-' ? '' : regulatoryAttributes, codes: buildCodes(result) });
    formRef.value?.clearValidate();
  } catch (error) { formVisible.value = false; ElMessage.error(apiErrorMessage(error, '饮片品种详情加载失败')); }
  finally { formLoading.value = false; }
};
const addCode = () => { form.codes.push({ schemeCode: '', code: '', sourceAuthority: '', validFrom: nowText(), validTo: '' }); };
const removeCode = (index: number) => { form.codes.splice(index, 1); };
const normalizedCodes = (): PieceProductCodeItem[] | null => {
  const codes: PieceProductCodeItem[] = [];
  for (const item of form.codes) {
    if (!item.schemeCode.trim() || !item.code.trim() || !item.sourceAuthority.trim() || !item.validFrom) { ElMessage.warning('请完整填写每条外部监管编码'); return null; }
    if (item.validTo && item.validTo < item.validFrom) { ElMessage.warning('编码失效时间不能早于生效时间'); return null; }
    codes.push({ schemeCode: item.schemeCode.trim(), code: item.code.trim(), sourceAuthority: item.sourceAuthority.trim(), validFrom: item.validFrom, validTo: item.validTo || undefined });
  }
  return codes;
};
const submit = async () => {
  if (!await formRef.value?.validate().catch(() => false)) return;
  const codes = normalizedCodes();
  if (!codes) return;
  if (form.validTo && form.validTo < form.validFrom) { ElMessage.warning('品种失效时间不能早于生效时间'); return; }
  submitting.value = true;
  try {
    if (editing.value) {
      const regulatoryAttributes = form.regulatoryAttributes.trim() ? JSON.stringify(JSON.parse(form.regulatoryAttributes)) : undefined;
      await masterDataApi.updatePieceProduct(editingId.value, {
        productName: form.productName.trim(), materialName: form.materialName.trim(), processingMethod: form.processingMethod.trim(),
        specification: form.specification.trim() || undefined, executiveStandard: form.executiveStandard.trim() || undefined, codes,
        regulatoryAttributes, nmpaCodeVersion: form.nmpaCodeVersion.trim() || undefined, status: form.status,
        validFrom: form.validFrom, validTo: form.validTo || undefined
      });
      ElMessage.success('饮片品种更新成功');
    } else {
      await masterDataApi.createPieceProduct({
        productName: form.productName.trim(), materialName: form.materialName.trim(), processingMethod: form.processingMethod.trim(),
        specification: form.specification.trim() || undefined, executiveStandard: form.executiveStandard.trim() || undefined, codes
      });
      ElMessage.success('饮片品种创建成功');
    }
    formVisible.value = false; await loadPieces();
  } catch (error) { ElMessage.error(apiErrorMessage(error, editing.value ? '饮片品种更新失败' : '饮片品种创建失败')); }
  finally { submitting.value = false; }
};

const openDetail = async (row: PieceProductDetailResponse) => {
  detailVisible.value = true; detailLoading.value = true; detail.value = null;
  try { detail.value = await masterDataApi.getPieceProductById(String(row.productId)); }
  catch (error) { ElMessage.error(apiErrorMessage(error, '饮片品种详情加载失败')); }
  finally { detailLoading.value = false; }
};
const disablePiece = async (row: PieceProductDetailResponse) => {
  try {
    await ElMessageBox.confirm(`确定停用“${row.productName}”吗？`, '停用饮片品种', { type: 'warning' });
    await masterDataApi.disablePieceProduct(String(row.productId)); ElMessage.success('饮片品种已停用'); await loadPieces();
  } catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(apiErrorMessage(error, '饮片品种停用失败')); }
};

onMounted(loadPieces);
</script>

<style scoped>
.piece-page { padding-bottom: 24px; }
.summary-strip { display: flex; gap: 1px; margin-bottom: 14px; overflow: hidden; background: var(--color-border); border: 1px solid var(--color-border); border-radius: 6px; }
.summary-item { display: flex; flex: 1; align-items: baseline; gap: 12px; padding: 12px 16px; background: var(--color-surface); }
.summary-item span { color: var(--color-muted); font-size: 12px; }
.summary-item strong { color: var(--color-ink); font-size: 20px; font-weight: 700; }
.summary-item .active-number { color: #15803d; }
.summary-item .inactive-number { color: #b45309; }
.panel-header > div { display: flex; align-items: baseline; gap: 10px; }
.panel-hint { color: var(--color-muted); font-size: 12px; }
.product-id { color: var(--color-brand); font-weight: 700; }
.code-value { color: #176b47; font-weight: 650; }
.nmpa-code { color: #245f91; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
.form-grid.three { grid-template-columns: repeat(3, 1fr); }
.section-heading { display: flex; align-items: center; justify-content: space-between; margin: 4px 0 10px; padding-top: 12px; border-top: 1px solid var(--color-border); }
.section-heading strong { display: block; color: var(--color-ink); font-size: 13px; }
.section-heading span { color: var(--color-muted); font-size: 11px; }
.code-row { display: grid; grid-template-columns: 1.1fr 1.1fr 1.1fr 1.2fr 1.2fr auto; gap: 10px; margin-bottom: 10px; padding: 12px 10px 2px; background: #fbfdfc; border: 1px solid var(--color-border); border-radius: 6px; }
.code-row :deep(.el-form-item) { margin-bottom: 12px; }
.remove-code { align-self: center; margin-top: 5px; }
.attribute-section { margin-top: 18px; }
.attribute-title { margin-bottom: 8px; color: var(--color-ink); font-size: 13px; font-weight: 700; }
.attribute-json { max-height: 280px; margin: 0; padding: 14px; overflow: auto; white-space: pre-wrap; word-break: break-word; background: #f4f9f7; border: 1px solid var(--color-border); border-radius: 6px; color: #294342; font-size: 12px; line-height: 1.65; }
:deep(.mono-input input), :deep(.json-input textarea) { font-family: "JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
@media (max-width: 1100px) { .code-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 760px) { .summary-strip { flex-direction: column; } .form-grid, .form-grid.three, .code-row { grid-template-columns: 1fr; } }
</style>
