<template>
  <div class="master-data-page">
    <PageHeader title="标识绑定" subtitle="解析外部系统标识，并将标识绑定到主体或业务对象" />

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
import { computed, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import {
  masterDataApi,
  type IdentifierBindingResponse,
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
