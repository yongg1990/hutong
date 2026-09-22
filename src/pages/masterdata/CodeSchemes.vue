<template>
  <div class="master-data-page scheme-page">
    <PageHeader title="监管编码主数据" subtitle="统一维护监管编码体系、编码段规则并试校验编码">
      <template #actions>
        <el-button :icon="Refresh" :loading="loading" @click="loadSchemes">刷新</el-button>
        <el-button :icon="CircleCheck" @click="openValidation">编码试校验</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增编码体系</el-button>
      </template>
    </PageHeader>

    <div class="summary-strip">
      <div class="summary-item"><span>编码体系总数</span><strong>{{ total }}</strong></div>
      <div class="summary-item"><span>本页启用</span><strong class="active-number">{{ activeCount }}</strong></div>
      <div class="summary-item"><span>本页停用</span><strong class="inactive-number">{{ inactiveCount }}</strong></div>
      <div class="summary-item"><span>发布机构类型</span><strong>{{ issuerTypeCount }}</strong></div>
    </div>

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="filters.schemeCode" clearable placeholder="编码体系代码" style="width:210px" @keyup.enter="handleSearch" />
      <el-input v-model="filters.schemeName" clearable placeholder="编码体系名称" style="width:190px" @keyup.enter="handleSearch" />
      <el-input v-model="filters.issuerType" clearable placeholder="发布机构类型" style="width:170px" @keyup.enter="handleSearch" />
      <el-select v-model="filters.status" clearable placeholder="状态" style="width:130px">
        <el-option label="启用" value="ACTIVE" />
        <el-option label="停用" value="INACTIVE" />
      </el-select>
    </FilterBar>

    <section class="panel table-panel">
      <div class="panel-header"><div><h2>监管编码体系列表</h2><span class="panel-hint">共 {{ total }} 条记录</span></div></div>
      <div class="panel-body">
        <el-table :data="schemes" v-loading="loading" row-key="schemeId" empty-text="暂无监管编码体系" style="width:100%">
          <el-table-column prop="schemeId" label="体系 ID" width="170"><template #default="{ row }"><span class="mono scheme-id">{{ row.schemeId }}</span></template></el-table-column>
          <el-table-column prop="schemeCode" label="体系代码" min-width="200" show-overflow-tooltip><template #default="{ row }"><span class="mono code-text">{{ row.schemeCode }}</span></template></el-table-column>
          <el-table-column prop="schemeName" label="体系名称" min-width="190" show-overflow-tooltip />
          <el-table-column prop="issuerType" label="发布机构类型" min-width="150" show-overflow-tooltip><template #default="{ row }"><el-tag size="small" effect="plain">{{ row.issuerType }}</el-tag></template></el-table-column>
          <el-table-column prop="validationJson" label="整码校验规则" min-width="220" show-overflow-tooltip><template #default="{ row }"><span class="mono rule-preview">{{ compactJson(row.validationJson) }}</span></template></el-table-column>
          <el-table-column label="状态" width="90"><template #default="{ row }"><StatusTag :code="row.status" :label="statusLabel(row.status)" /></template></el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="175"><template #default="{ row }">{{ row.updatedAt || '-' }}</template></el-table-column>
          <el-table-column label="操作" width="225" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="primary" size="small" @click="openSegments(row)">编码段</el-button>
              <el-button v-if="row.status === 'ACTIVE'" link type="danger" size="small" @click="disableScheme(row)">停用</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-row"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10,20,50,100,200]" :total="total" layout="total, sizes, prev, pager, next" @current-change="loadSchemes" @size-change="handleSizeChange" /></div>
      </div>
    </section>

    <el-dialog v-model="formVisible" :title="editing ? '编辑监管编码体系' : '新增监管编码体系'" width="720px" destroy-on-close :close-on-click-modal="false">
      <div v-loading="formLoading">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <div class="form-grid">
            <el-form-item label="编码体系代码" prop="schemeCode"><el-input v-model="form.schemeCode" maxlength="128" :disabled="editing" placeholder="例如 NATIONAL_MEDICAL_INSURANCE_16" @input="normalizeSchemeCode" /></el-form-item>
            <el-form-item label="编码体系名称" prop="schemeName"><el-input v-model="form.schemeName" maxlength="200" placeholder="请输入编码体系名称" /></el-form-item>
            <el-form-item label="发布机构类型" prop="issuerType">
              <el-select v-model="form.issuerType" filterable allow-create default-first-option placeholder="选择或输入机构类型" style="width:100%">
                <el-option v-for="item in issuerTypes" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="editing" label="状态" prop="status"><el-radio-group v-model="form.status"><el-radio-button label="ACTIVE">启用</el-radio-button><el-radio-button label="INACTIVE">停用</el-radio-button></el-radio-group></el-form-item>
          </div>
          <el-form-item label="整码校验规则 JSON" prop="validationJson"><el-input v-model="form.validationJson" class="json-input" type="textarea" :rows="9" placeholder='{"pattern":"^[0-9]{16}$"}' /></el-form-item>
          <div class="json-actions"><span>校验规则将以 JSON 字符串提交</span><el-button text type="primary" @click="formatSchemeRule">格式化 JSON</el-button></div>
        </el-form>
      </div>
      <template #footer><el-button @click="formVisible=false">取消</el-button><el-button type="primary" :loading="submitting" :disabled="formLoading" @click="submitScheme">保存</el-button></template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="监管编码体系详情" size="560px">
      <el-skeleton v-if="detailLoading" :rows="8" animated />
      <template v-else-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="体系 ID"><span class="mono">{{ detail.schemeId }}</span></el-descriptions-item>
          <el-descriptions-item label="体系代码"><span class="mono code-text">{{ detail.schemeCode }}</span></el-descriptions-item>
          <el-descriptions-item label="体系名称">{{ detail.schemeName }}</el-descriptions-item>
          <el-descriptions-item label="发布机构类型">{{ detail.issuerType }}</el-descriptions-item>
          <el-descriptions-item label="状态"><StatusTag :code="detail.status" :label="statusLabel(detail.status)" /></el-descriptions-item>
          <el-descriptions-item label="乐观锁版本"><span class="mono">{{ detail.lockVersion ?? '-' }}</span></el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.createdAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.updatedAt || '-' }}</el-descriptions-item>
        </el-descriptions>
        <section class="rule-section"><div class="rule-title">整码校验规则</div><pre class="rule-json mono">{{ prettyJson(detail.validationJson) }}</pre></section>
      </template>
    </el-drawer>

    <el-drawer v-model="segmentsVisible" size="760px" destroy-on-close>
      <template #header>
        <div class="drawer-heading">
          <div><strong>监管编码段</strong><span>{{ currentScheme?.schemeName }} / {{ currentScheme?.schemeCode }}</span></div>
          <el-button type="primary" :icon="Plus" @click="openSegmentCreate">新增编码段</el-button>
        </div>
      </template>
      <el-table :data="segments" v-loading="segmentsLoading" row-key="segmentId" empty-text="暂无编码段" style="width:100%">
        <el-table-column prop="segmentNo" label="序号" width="70" />
        <el-table-column label="位置" width="110"><template #default="{ row }"><span class="mono">{{ row.startPos }} - {{ row.startPos + row.segmentLength - 1 }}</span></template></el-table-column>
        <el-table-column prop="segmentLength" label="长度" width="75" />
        <el-table-column prop="semanticCode" label="语义代码" min-width="150" show-overflow-tooltip><template #default="{ row }"><span class="mono semantic-code">{{ row.semanticCode }}</span></template></el-table-column>
        <el-table-column prop="ruleJson" label="段校验规则" min-width="180" show-overflow-tooltip><template #default="{ row }"><span class="mono rule-preview">{{ compactJson(row.ruleJson) }}</span></template></el-table-column>
        <el-table-column label="操作" width="115" fixed="right"><template #default="{ row }"><el-button link type="primary" size="small" @click="openSegmentEdit(row)">编辑</el-button><el-button link type="danger" size="small" @click="deleteSegment(row)">删除</el-button></template></el-table-column>
      </el-table>
    </el-drawer>

    <el-dialog v-model="segmentFormVisible" :title="segmentEditing ? '编辑监管编码段' : '新增监管编码段'" width="660px" destroy-on-close :close-on-click-modal="false" append-to-body>
      <div v-loading="segmentFormLoading">
        <el-form ref="segmentFormRef" :model="segmentForm" :rules="segmentRules" label-position="top">
          <div class="segment-grid">
            <el-form-item label="编码段序号" prop="segmentNo"><el-input-number v-model="segmentForm.segmentNo" :min="1" :max="2147483647" controls-position="right" style="width:100%" /></el-form-item>
            <el-form-item label="起始位置" prop="startPos"><el-input-number v-model="segmentForm.startPos" :min="1" :max="2147483647" controls-position="right" style="width:100%" /></el-form-item>
            <el-form-item label="编码段长度" prop="segmentLength"><el-input-number v-model="segmentForm.segmentLength" :min="1" :max="2147483647" controls-position="right" style="width:100%" /></el-form-item>
          </div>
          <el-form-item label="编码段语义代码" prop="semanticCode"><el-input v-model="segmentForm.semanticCode" maxlength="128" placeholder="例如 REGION_CODE" @input="normalizeSemanticCode" /></el-form-item>
          <el-form-item label="编码段校验规则 JSON" prop="ruleJson"><el-input v-model="segmentForm.ruleJson" class="json-input" type="textarea" :rows="7" placeholder='{"pattern":"^[0-9]+$"}' /></el-form-item>
          <div class="json-actions"><span>起始位置从 1 开始</span><el-button text type="primary" @click="formatSegmentRule">格式化 JSON</el-button></div>
        </el-form>
      </div>
      <template #footer><el-button @click="segmentFormVisible=false">取消</el-button><el-button type="primary" :loading="segmentSubmitting" :disabled="segmentFormLoading" @click="submitSegment">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="validationVisible" title="监管编码试校验" width="720px" destroy-on-close :close-on-click-modal="false">
      <el-form ref="validationFormRef" :model="validationForm" :rules="validationRules" label-position="top">
        <div class="form-grid">
          <el-form-item label="编码体系代码" prop="schemeCode">
            <el-select v-model="validationForm.schemeCode" filterable allow-create default-first-option placeholder="选择或输入体系代码" style="width:100%">
              <el-option v-for="item in schemes" :key="item.schemeId" :label="item.schemeName + ' (' + item.schemeCode + ')'" :value="item.schemeCode" />
            </el-select>
          </el-form-item>
          <el-form-item label="业务生效时间"><el-date-picker v-model="validationForm.effectiveAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可选" style="width:100%" /></el-form-item>
        </div>
        <el-form-item label="待校验编码" prop="rawCode"><el-input v-model="validationForm.rawCode" class="mono-input" placeholder="请输入监管编码原值" /></el-form-item>
      </el-form>
      <section v-if="validationResult" class="validation-result" :class="validationResult.valid ? 'is-valid' : 'is-invalid'">
        <div class="validation-summary">
          <div><el-icon><CircleCheck v-if="validationResult.valid" /><CircleClose v-else /></el-icon><strong>{{ validationResult.valid ? '校验通过' : '校验未通过' }}</strong></div>
          <span v-if="validationResult.errorCode" class="mono">{{ validationResult.errorCode }}</span>
        </div>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="编码体系"><span class="mono">{{ validationResult.schemeCode }}</span></el-descriptions-item>
          <el-descriptions-item label="标准化编码"><span class="mono">{{ validationResult.normalizedCode || '-' }}</span></el-descriptions-item>
        </el-descriptions>
        <el-table v-if="validationResult.segments?.length" :data="validationResult.segments" size="small" class="segment-result-table">
          <el-table-column prop="segmentNo" label="段序号" width="80" />
          <el-table-column prop="semanticCode" label="语义代码" min-width="150"><template #default="{ row }"><span class="mono">{{ row.semanticCode || '-' }}</span></template></el-table-column>
          <el-table-column prop="value" label="解析值" min-width="150"><template #default="{ row }"><span class="mono">{{ row.value || '-' }}</span></template></el-table-column>
          <el-table-column label="结果" width="90"><template #default="{ row }"><el-tag :type="row.valid === false ? 'danger' : 'success'" size="small">{{ row.valid === false ? '未通过' : '通过' }}</el-tag></template></el-table-column>
          <el-table-column prop="errorCode" label="错误码" min-width="120"><template #default="{ row }"><span class="mono">{{ row.errorCode || '-' }}</span></template></el-table-column>
        </el-table>
      </section>
      <template #footer><el-button @click="validationVisible=false">关闭</el-button><el-button type="primary" :loading="validating" @click="validateCode">开始校验</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { CircleCheck, CircleClose, Plus, Refresh } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { apiErrorMessage } from '@/api/client';
import { masterDataApi, type CodeSchemeResponse, type CodeSchemeSegment, type CodeValidationResponse } from '@/api/masterData';

type SchemeStatus = 'ACTIVE' | 'INACTIVE';
const issuerTypes = ['GOVERNMENT', 'REGULATOR', 'INDUSTRY_ASSOCIATION', 'ENTERPRISE'];
const schemes = ref<CodeSchemeResponse[]>([]);
const loading = ref(false); const page = ref(1); const pageSize = ref(20); const total = ref(0);
const filters = reactive({ schemeCode: '', schemeName: '', issuerType: '', status: '' });
const activeCount = computed(() => schemes.value.filter(item => item.status === 'ACTIVE').length);
const inactiveCount = computed(() => schemes.value.filter(item => item.status === 'INACTIVE').length);
const issuerTypeCount = computed(() => new Set(schemes.value.map(item => item.issuerType).filter(Boolean)).size);

const formVisible = ref(false); const formLoading = ref(false); const submitting = ref(false); const editing = ref(false); const editingId = ref(''); const formRef = ref<FormInstance>();
const blankForm = () => ({ schemeCode: '', schemeName: '', issuerType: '', validationJson: JSON.stringify({ pattern: '' }, null, 2), status: 'ACTIVE' as SchemeStatus, lockVersion: 0 });
const form = reactive(blankForm());
const detailVisible = ref(false); const detailLoading = ref(false); const detail = ref<CodeSchemeResponse | null>(null);
const currentScheme = ref<CodeSchemeResponse | null>(null); const segmentsVisible = ref(false); const segmentsLoading = ref(false); const segments = ref<CodeSchemeSegment[]>([]);
const segmentFormVisible = ref(false); const segmentFormLoading = ref(false); const segmentSubmitting = ref(false); const segmentEditing = ref(false); const segmentEditingId = ref(''); const segmentFormRef = ref<FormInstance>();
const blankSegmentForm = () => ({ segmentNo: 1, startPos: 1, segmentLength: 1, semanticCode: '', ruleJson: JSON.stringify({ pattern: '' }, null, 2) });
const segmentForm = reactive(blankSegmentForm());
const validationVisible = ref(false); const validating = ref(false); const validationFormRef = ref<FormInstance>();
const validationForm = reactive({ schemeCode: '', rawCode: '', effectiveAt: '' }); const validationResult = ref<CodeValidationResponse | null>(null);

const validJson = (_rule: unknown, value: string, callback: (error?: Error) => void) => { if (!value?.trim()) return callback(new Error('请输入 JSON 校验规则')); try { JSON.parse(value); callback(); } catch { callback(new Error('请输入合法的 JSON')); } };
const rules: FormRules = { schemeCode: [{ required: true, message: '请输入编码体系代码', trigger: 'blur' }], schemeName: [{ required: true, message: '请输入编码体系名称', trigger: 'blur' }], issuerType: [{ required: true, message: '请输入发布机构类型', trigger: 'change' }], validationJson: [{ required: true, message: '请输入整码校验规则', trigger: 'blur' }, { validator: validJson, trigger: 'blur' }], status: [{ required: true, message: '请选择状态', trigger: 'change' }] };
const segmentRules: FormRules = { segmentNo: [{ required: true, message: '请输入编码段序号', trigger: 'change' }], startPos: [{ required: true, message: '请输入起始位置', trigger: 'change' }], segmentLength: [{ required: true, message: '请输入编码段长度', trigger: 'change' }], semanticCode: [{ required: true, message: '请输入编码段语义代码', trigger: 'blur' }], ruleJson: [{ required: true, message: '请输入编码段校验规则', trigger: 'blur' }, { validator: validJson, trigger: 'blur' }] };
const validationRules: FormRules = { schemeCode: [{ required: true, message: '请输入编码体系代码', trigger: 'change' }], rawCode: [{ required: true, message: '请输入待校验编码', trigger: 'blur' }] };
const statusLabel = (value?: string) => value === 'ACTIVE' ? '启用' : value === 'INACTIVE' ? '停用' : value || '-';
const prettyJson = (value?: string) => { if (!value) return '-'; try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } };
const compactJson = (value?: string) => { if (!value) return '-'; try { return JSON.stringify(JSON.parse(value)); } catch { return value; } };
const normalizeSchemeCode = (value: string) => { form.schemeCode = value.trimStart().toUpperCase().replace(/\s+/g, '_'); };
const normalizeSemanticCode = (value: string) => { segmentForm.semanticCode = value.trimStart().toUpperCase().replace(/\s+/g, '_'); };
const formatJsonValue = (value: string, assign: (formatted: string) => void) => { try { assign(JSON.stringify(JSON.parse(value), null, 2)); } catch { ElMessage.warning('请先输入合法的 JSON'); } };
const formatSchemeRule = () => formatJsonValue(form.validationJson, value => { form.validationJson = value; });
const formatSegmentRule = () => formatJsonValue(segmentForm.ruleJson, value => { segmentForm.ruleJson = value; });

const loadSchemes = async () => { loading.value = true; try { const result = await masterDataApi.getCodeSchemePage({ schemeCode: filters.schemeCode.trim() || undefined, schemeName: filters.schemeName.trim() || undefined, issuerType: filters.issuerType.trim() || undefined, status: filters.status || undefined, page: page.value, size: pageSize.value }); schemes.value = result.records; total.value = result.total; page.value = result.page; pageSize.value = result.size; } catch (error) { schemes.value = []; total.value = 0; ElMessage.error(apiErrorMessage(error, '监管编码体系列表加载失败')); } finally { loading.value = false; } };
const handleSearch = () => { page.value = 1; loadSchemes(); };
const handleReset = () => { Object.assign(filters, { schemeCode: '', schemeName: '', issuerType: '', status: '' }); page.value = 1; loadSchemes(); };
const handleSizeChange = () => { page.value = 1; loadSchemes(); };
const openCreate = () => { editing.value = false; editingId.value = ''; Object.assign(form, blankForm()); formRef.value?.clearValidate(); formVisible.value = true; };
const openEdit = async (row: CodeSchemeResponse) => { editing.value = true; editingId.value = String(row.schemeId); Object.assign(form, blankForm(), row, { validationJson: prettyJson(row.validationJson), status: row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }); formVisible.value = true; formLoading.value = true; try { const result = await masterDataApi.getCodeSchemeById(editingId.value); Object.assign(form, result, { validationJson: prettyJson(result.validationJson), status: result.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE', lockVersion: result.lockVersion ?? 0 }); formRef.value?.clearValidate(); } catch (error) { formVisible.value = false; ElMessage.error(apiErrorMessage(error, '监管编码体系详情加载失败')); } finally { formLoading.value = false; } };
const submitScheme = async () => { if (!await formRef.value?.validate().catch(() => false)) return; submitting.value = true; try { const validationJson = JSON.stringify(JSON.parse(form.validationJson)); if (editing.value) { await masterDataApi.updateCodeScheme(editingId.value, { schemeName: form.schemeName.trim(), issuerType: form.issuerType.trim(), validationJson, status: form.status, lockVersion: form.lockVersion }); ElMessage.success('监管编码体系更新成功'); } else { await masterDataApi.createCodeScheme({ schemeCode: form.schemeCode.trim(), schemeName: form.schemeName.trim(), issuerType: form.issuerType.trim(), validationJson }); ElMessage.success('监管编码体系创建成功'); } formVisible.value = false; await loadSchemes(); } catch (error) { ElMessage.error(apiErrorMessage(error, editing.value ? '监管编码体系更新失败' : '监管编码体系创建失败')); } finally { submitting.value = false; } };
const openDetail = async (row: CodeSchemeResponse) => { detailVisible.value = true; detailLoading.value = true; detail.value = null; try { detail.value = await masterDataApi.getCodeSchemeById(String(row.schemeId)); } catch (error) { ElMessage.error(apiErrorMessage(error, '监管编码体系详情加载失败')); } finally { detailLoading.value = false; } };
const disableScheme = async (row: CodeSchemeResponse) => { try { await ElMessageBox.confirm('确定停用“' + row.schemeName + '”吗？', '停用监管编码体系', { type: 'warning' }); await masterDataApi.disableCodeScheme(String(row.schemeId)); ElMessage.success('监管编码体系已停用'); await loadSchemes(); } catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(apiErrorMessage(error, '监管编码体系停用失败')); } };

const loadSegments = async () => { if (!currentScheme.value) return; segmentsLoading.value = true; try { segments.value = await masterDataApi.getCodeSchemeSegments(String(currentScheme.value.schemeId)); } catch (error) { segments.value = []; ElMessage.error(apiErrorMessage(error, '监管编码段加载失败')); } finally { segmentsLoading.value = false; } };
const openSegments = (row: CodeSchemeResponse) => { currentScheme.value = row; segments.value = []; segmentsVisible.value = true; loadSegments(); };
const openSegmentCreate = () => { segmentEditing.value = false; segmentEditingId.value = ''; const nextNo = segments.value.length ? Math.max(...segments.value.map(item => item.segmentNo)) + 1 : 1; const nextStart = segments.value.length ? Math.max(...segments.value.map(item => item.startPos + item.segmentLength)) : 1; Object.assign(segmentForm, blankSegmentForm(), { segmentNo: nextNo, startPos: nextStart }); segmentFormRef.value?.clearValidate(); segmentFormVisible.value = true; };
const openSegmentEdit = async (row: CodeSchemeSegment) => { if (!currentScheme.value) return; segmentEditing.value = true; segmentEditingId.value = String(row.segmentId); Object.assign(segmentForm, row, { ruleJson: prettyJson(row.ruleJson) }); segmentFormVisible.value = true; segmentFormLoading.value = true; try { const result = await masterDataApi.getCodeSchemeSegment(String(currentScheme.value.schemeId), segmentEditingId.value); Object.assign(segmentForm, result, { ruleJson: prettyJson(result.ruleJson) }); segmentFormRef.value?.clearValidate(); } catch (error) { segmentFormVisible.value = false; ElMessage.error(apiErrorMessage(error, '监管编码段详情加载失败')); } finally { segmentFormLoading.value = false; } };
const submitSegment = async () => { if (!currentScheme.value || !await segmentFormRef.value?.validate().catch(() => false)) return; segmentSubmitting.value = true; try { const payload = { segmentNo: segmentForm.segmentNo, startPos: segmentForm.startPos, segmentLength: segmentForm.segmentLength, semanticCode: segmentForm.semanticCode.trim(), ruleJson: JSON.stringify(JSON.parse(segmentForm.ruleJson)) }; if (segmentEditing.value) { await masterDataApi.updateCodeSchemeSegment(String(currentScheme.value.schemeId), segmentEditingId.value, payload); ElMessage.success('监管编码段更新成功'); } else { await masterDataApi.createCodeSchemeSegment(String(currentScheme.value.schemeId), payload); ElMessage.success('监管编码段创建成功'); } segmentFormVisible.value = false; await loadSegments(); } catch (error) { ElMessage.error(apiErrorMessage(error, segmentEditing.value ? '监管编码段更新失败' : '监管编码段创建失败')); } finally { segmentSubmitting.value = false; } };
const deleteSegment = async (row: CodeSchemeSegment) => { if (!currentScheme.value) return; try { await ElMessageBox.confirm('确定删除编码段“' + row.semanticCode + '”吗？', '删除监管编码段', { type: 'warning' }); await masterDataApi.deleteCodeSchemeSegment(String(currentScheme.value.schemeId), String(row.segmentId)); ElMessage.success('监管编码段已删除'); await loadSegments(); } catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(apiErrorMessage(error, '监管编码段删除失败')); } };

const openValidation = () => { Object.assign(validationForm, { schemeCode: '', rawCode: '', effectiveAt: '' }); validationResult.value = null; validationFormRef.value?.clearValidate(); validationVisible.value = true; };
const validateCode = async () => { if (!await validationFormRef.value?.validate().catch(() => false)) return; validating.value = true; validationResult.value = null; try { validationResult.value = await masterDataApi.validateCode({ schemeCode: validationForm.schemeCode.trim(), rawCode: validationForm.rawCode.trim(), effectiveAt: validationForm.effectiveAt || undefined }); } catch (error) { ElMessage.error(apiErrorMessage(error, '监管编码校验失败')); } finally { validating.value = false; } };
onMounted(loadSchemes);
</script>

<style scoped>
.scheme-page{padding-bottom:24px}.summary-strip{display:flex;gap:1px;margin-bottom:14px;overflow:hidden;background:var(--color-border);border:1px solid var(--color-border);border-radius:6px}.summary-item{display:flex;flex:1;align-items:baseline;gap:12px;padding:12px 16px;background:var(--color-surface)}.summary-item span{color:var(--color-muted);font-size:12px}.summary-item strong{color:var(--color-ink);font-size:20px;font-weight:700}.summary-item .active-number{color:#15803d}.summary-item .inactive-number{color:#b45309}.panel-header>div{display:flex;align-items:baseline;gap:10px}.panel-hint{color:var(--color-muted);font-size:12px}.scheme-id,.code-text{color:var(--color-brand);font-weight:700}.rule-preview{color:#475569;font-size:12px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.segment-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0 16px}.json-actions{display:flex;align-items:center;justify-content:space-between;margin-top:-12px;color:var(--color-muted);font-size:12px}.rule-section{margin-top:18px}.rule-title{margin-bottom:8px;color:var(--color-ink);font-size:13px;font-weight:700}.rule-json{max-height:320px;margin:0;padding:14px;overflow:auto;white-space:pre-wrap;word-break:break-word;background:#f4f9f7;border:1px solid var(--color-border);border-radius:6px;color:#294342;font-size:12px;line-height:1.65}.drawer-heading{display:flex;width:100%;align-items:center;justify-content:space-between;padding-right:12px}.drawer-heading strong{display:block;color:var(--color-ink);font-size:16px}.drawer-heading span{display:block;margin-top:4px;color:var(--color-muted);font-size:12px}.semantic-code{color:#245f91;font-weight:700}.validation-result{margin-top:8px;padding:14px;border:1px solid;border-radius:6px}.validation-result.is-valid{background:#f0fdf4;border-color:#bbf7d0}.validation-result.is-invalid{background:#fff7ed;border-color:#fed7aa}.validation-summary{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.validation-summary>div{display:flex;align-items:center;gap:8px}.validation-summary .el-icon{font-size:20px}.is-valid .validation-summary{color:#15803d}.is-invalid .validation-summary{color:#c2410c}.segment-result-table{margin-top:12px}:deep(.json-input textarea),:deep(.mono-input input){font-family:"JetBrains Mono",SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.6}@media(max-width:800px){.summary-strip{flex-direction:column}.form-grid,.segment-grid{grid-template-columns:1fr}}
</style>
