<template>
  <div class="master-data-page">
    <PageHeader title="标识绑定" subtitle="解析外部系统标识，并将标识绑定到主体或业务对象" />
    <div class="panel" style="padding:12px; margin-bottom:16px">
      <div class="form-actions"><el-select v-model="filters.targetType" clearable placeholder="目标类型" style="width:140px"><el-option label="主体" value="PARTY" /><el-option label="对象" value="OBJECT" /></el-select><el-input v-model="filters.targetId" placeholder="目标 ID" clearable style="width:150px" /><el-input v-model="filters.sourceSystemId" placeholder="来源系统 ID" clearable style="width:160px" /><el-input v-model="filters.namespaceCode" placeholder="命名空间" clearable style="width:160px" /><el-select v-model="filters.status" clearable placeholder="状态" style="width:130px"><el-option label="生效" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /><el-option label="已替代" value="REPLACED" /></el-select><el-button type="primary" @click="page = 1; loadBindings()">查询</el-button><el-button @click="resetFilters">重置</el-button></div>
      <el-table :data="rows" v-loading="listLoading" style="margin-top:12px" empty-text="暂无绑定记录"><el-table-column prop="bindingId" label="绑定 ID" min-width="130" /><el-table-column prop="targetType" label="目标类型" width="110" /><el-table-column prop="targetId" label="目标 ID" min-width="130" /><el-table-column prop="identifierDisplay" label="外部标识" min-width="170" /><el-table-column prop="namespaceCode" label="命名空间" min-width="140" /><el-table-column prop="status" label="状态" width="100" /><el-table-column label="操作" width="130"><template #default="{ row }"><el-button link type="primary" @click="showBinding(row.bindingId)">详情</el-button><el-button link @click="editBinding(row.bindingId)">编辑</el-button></template></el-table-column></el-table>
      <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total" layout="total, prev, pager, next" @current-change="loadBindings" />
    </div>
    <el-drawer v-model="detailVisible" title="标识绑定详情" size="520px"><el-descriptions v-if="detail" :column="1" border><el-descriptions-item v-for="key in detailKeys" :key="key" :label="key">{{ detail[key] ?? '-' }}</el-descriptions-item></el-descriptions><template #footer><el-button v-if="detail" type="primary" @click="editBinding(detail.bindingId)">编辑</el-button></template></el-drawer>
    <el-dialog v-model="editVisible" title="编辑绑定" width="480px"><el-form label-position="top"><el-form-item label="状态" required><el-select v-model="editForm.status" style="width:100%"><el-option label="生效" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /><el-option label="已替代" value="REPLACED" /></el-select></el-form-item><el-form-item label="失效时间"><el-date-picker v-model="editForm.validTo" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-form><template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="editSaving" @click="saveBinding">保存</el-button></template></el-dialog>

    <div class="workspace-grid">
      <section class="panel">
        <div class="panel-header"><h2>绑定信息</h2></div>
        <div class="panel-body">
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <div class="form-grid">
              <el-form-item label="来源系统 ID" prop="sourceSystemId">
                <el-input v-model="form.sourceSystemId" class="mono" placeholder="请输入数字字符串 ID" />
              </el-form-item>
              <el-form-item label="目标类型" prop="targetType">
                <el-select v-model="form.targetType" style="width: 100%" @change="clearResolution">
                  <el-option label="PARTY - 主体" value="PARTY" />
                  <el-option label="OBJECT - 业务对象" value="OBJECT" />
                </el-select>
              </el-form-item>
              <el-form-item label="命名空间编码" prop="namespaceCode">
                <el-input v-model="form.namespaceCode" placeholder="例如：CREDIT_CODE" @input="normalizeNamespace" />
              </el-form-item>
              <el-form-item label="外部标识原值" prop="identifierValue">
                <el-input v-model="form.identifierValue" placeholder="请输入待绑定的标识值" @input="clearResolution" />
              </el-form-item>
              <el-form-item label="目标 ID" prop="targetId">
                <el-input v-model="form.targetId" class="mono" placeholder="解析成功后自动填入，也可手工输入" />
              </el-form-item>
              <el-form-item label="生效时间" prop="validFrom">
                <el-date-picker
                  v-model="form.validFrom"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                  placeholder="请选择生效时间"
                />
              </el-form-item>
            </div>
            <div class="form-actions">
              <el-button @click="resetForm">重置</el-button>
              <el-button :loading="resolving" @click="resolve">解析标识</el-button>
              <el-button type="primary" :loading="binding" @click="bind">确认绑定</el-button>
            </div>
          </el-form>
        </div>
      </section>

      <aside class="result-stack">
        <section class="panel result-panel">
          <div class="panel-header"><h2>解析结果</h2></div>
          <div class="panel-body compact-body">
            <el-empty v-if="!resolution" description="可先解析标识以确认目标" :image-size="64" />
            <el-descriptions v-else :column="1" border>
              <el-descriptions-item label="解析状态">
                <el-tag :type="resolutionTagType">{{ resolution.resolutionStatus }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item v-if="resolution.targetId" label="目标 ID">
                <span class="mono">{{ resolution.targetId }}</span>
              </el-descriptions-item>
              <el-descriptions-item v-if="resolution.candidateIds?.length" label="候选目标">
                <div class="candidate-list">
                  <el-button
                    v-for="candidateId in resolution.candidateIds"
                    :key="candidateId"
                    size="small"
                    @click="selectCandidate(candidateId)"
                  >{{ candidateId }}</el-button>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </section>

        <section class="panel result-panel">
          <div class="panel-header"><h2>绑定结果</h2></div>
          <div class="panel-body compact-body">
            <el-empty v-if="!bindingResult" description="绑定后显示接口返回结果" :image-size="64" />
            <el-descriptions v-else :column="1" border>
              <el-descriptions-item label="绑定 ID"><span class="mono">{{ bindingResult.bindingId }}</span></el-descriptions-item>
              <el-descriptions-item label="绑定状态"><StatusTag :code="bindingResult.status" /></el-descriptions-item>
              <el-descriptions-item label="目标 ID"><span class="mono">{{ boundTargetId }}</span></el-descriptions-item>
            </el-descriptions>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import {
  masterDataApi,
  type IdentifierBindingResponse,
  type IdentifierBindingManagement,
  type IdentifierResolutionResponse
} from '@/api/masterData';
import { apiErrorMessage } from '@/api/client';

const nowText = () => {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-')
    + ' ' + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(':');
};
const storedSourceSystemId = localStorage.getItem('tcmirp_source_system_id') || '';
const initialForm = () => ({
  sourceSystemId: storedSourceSystemId,
  targetType: 'PARTY',
  namespaceCode: '',
  identifierValue: '',
  targetId: '',
  validFrom: nowText()
});

const formRef = ref<FormInstance>();
const form = reactive(initialForm());
const resolving = ref(false);
const binding = ref(false);
const resolution = ref<IdentifierResolutionResponse | null>(null);
const bindingResult = ref<IdentifierBindingResponse | null>(null);
const boundTargetId = ref('');
const filters = reactive({ targetType:'', targetId:'', sourceSystemId:'', namespaceCode:'', status:'' });
const rows = ref<IdentifierBindingManagement[]>([]), detail = ref<IdentifierBindingManagement | null>(null);
const page = ref(1), size = ref(20), total = ref(0), listLoading = ref(false), detailVisible = ref(false), editVisible = ref(false), editSaving = ref(false), editingId = ref('');
const editForm = reactive({ status:'ACTIVE', validTo:'' });
const detailKeys: (keyof IdentifierBindingManagement)[] = ['bindingId','targetType','targetId','sourceSystemId','namespaceCode','identifierDisplay','validFrom','validTo','status','createdAt','updatedAt'];
async function loadBindings() { listLoading.value=true; try { const res=await masterDataApi.getBindingPage({...filters,page:page.value,size:size.value}); rows.value=res.records || []; total.value=Number(res.total || 0); } catch(e) { ElMessage.error(apiErrorMessage(e,'绑定查询失败')); } finally { listLoading.value=false; } }
function resetFilters() { Object.assign(filters,{targetType:'',targetId:'',sourceSystemId:'',namespaceCode:'',status:''}); page.value=1; void loadBindings(); }
async function showBinding(id:string) { try { detail.value=await masterDataApi.getBindingById(String(id)); detailVisible.value=true; } catch(e) { ElMessage.error(apiErrorMessage(e,'绑定详情查询失败')); } }
async function editBinding(id:string) { try { const item=await masterDataApi.getBindingById(String(id)); editingId.value=String(id); editForm.status=item.status; editForm.validTo=item.validTo || ''; detailVisible.value=false; editVisible.value=true; } catch(e) { ElMessage.error(apiErrorMessage(e,'绑定详情查询失败')); } }
async function saveBinding() { editSaving.value=true; try { await masterDataApi.updateBinding(editingId.value,{status:editForm.status,validTo:editForm.validTo || undefined}); editVisible.value=false; ElMessage.success('保存成功'); await loadBindings(); } catch(e) { ElMessage.error(apiErrorMessage(e,'更新绑定失败')); } finally { editSaving.value=false; } }
onMounted(loadBindings);

const numericId = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (/^-?[0-9]+$/.test(value)) callback();
  else callback(new Error('请输入数字字符串 ID'));
};
const rules: FormRules = {
  sourceSystemId: [{ required: true, message: '请输入来源系统 ID', trigger: 'blur' }, { validator: numericId, trigger: 'blur' }],
  targetType: [{ required: true, message: '请选择目标类型', trigger: 'change' }],
  namespaceCode: [{ required: true, message: '请输入命名空间编码', trigger: 'blur' }],
  identifierValue: [{ required: true, message: '请输入外部标识原值', trigger: 'blur' }],
  targetId: [{ required: true, message: '请输入或解析目标 ID', trigger: 'blur' }, { validator: numericId, trigger: 'blur' }],
  validFrom: [{ required: true, message: '请选择生效时间', trigger: 'change' }]
};

const resolutionTagType = computed(() => {
  if (resolution.value?.resolutionStatus === 'RESOLVED') return 'success';
  if (resolution.value?.resolutionStatus === 'NOT_FOUND') return 'info';
  return 'warning';
});

const normalizeNamespace = (value: string) => {
  form.namespaceCode = value.trimStart().toUpperCase().replace(/\s+/g, '_');
  clearResolution();
};
const clearResolution = () => {
  resolution.value = null;
  bindingResult.value = null;
};
const resetForm = () => {
  Object.assign(form, initialForm());
  formRef.value?.clearValidate();
  resolution.value = null;
  bindingResult.value = null;
};
const selectCandidate = (candidateId: string) => {
  form.targetId = candidateId;
  formRef.value?.clearValidate('targetId');
};

const resolve = async () => {
  const validFields = ['sourceSystemId', 'targetType', 'namespaceCode', 'identifierValue'];
  const valid = await Promise.all(validFields.map(field => formRef.value?.validateField(field).then(() => true).catch(() => false)));
  if (valid.some(item => !item)) return;
  resolving.value = true;
  try {
    resolution.value = await masterDataApi.resolveIdentifier({
      sourceSystemId: form.sourceSystemId.trim(),
      namespaceCode: form.namespaceCode.trim(),
      identifierValue: form.identifierValue.trim(),
      targetType: form.targetType
    });
    if (resolution.value.targetId) form.targetId = String(resolution.value.targetId);
    ElMessage.success('标识解析完成');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '标识解析失败'));
  } finally {
    resolving.value = false;
  }
};

const bind = async () => {
  if (!await formRef.value?.validate().catch(() => false)) return;
  binding.value = true;
  try {
    bindingResult.value = await masterDataApi.bindIdentifier({
      targetType: form.targetType,
      targetId: form.targetId.trim(),
      sourceSystemId: form.sourceSystemId.trim(),
      namespaceCode: form.namespaceCode.trim(),
      identifierValue: form.identifierValue.trim(),
      validFrom: form.validFrom
    });
    boundTargetId.value = form.targetId.trim();
    ElMessage.success('标识绑定成功');
    await loadBindings();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '标识绑定失败'));
  } finally {
    binding.value = false;
  }
};
</script>

<style scoped>
.workspace-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr); gap: 16px; align-items: start; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.result-stack { display: grid; gap: 16px; }
.result-panel { min-height: 210px; }
.compact-body { min-height: 158px; }
.candidate-list { display: flex; flex-wrap: wrap; gap: 6px; }
@media (max-width: 960px) { .workspace-grid, .form-grid { grid-template-columns: 1fr; } }
</style>
