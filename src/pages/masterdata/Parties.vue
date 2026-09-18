<template>
  <div class="master-data-page">
    <PageHeader title="主体登记" subtitle="登记生产、加工、仓储、物流及医疗机构主体主数据" />

    <div class="workspace-grid">
      <section class="panel form-panel">
        <div class="panel-header"><h2>登记信息</h2></div>
        <div class="panel-body">
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <div class="form-grid">
              <el-form-item label="主体名称" prop="partyName">
                <el-input v-model="form.partyName" maxlength="200" placeholder="请输入主体全称" />
              </el-form-item>
              <el-form-item label="主体类型" prop="partyType">
                <el-select v-model="form.partyType" style="width: 100%">
                  <el-option v-for="item in partyTypes" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item label="行政区划编码" prop="regionCode">
              <el-input v-model="form.regionCode" maxlength="12" placeholder="例如：532601" />
            </el-form-item>
            <el-form-item label="扩展属性 JSON" prop="attributes">
              <el-input
                v-model="form.attributes"
                type="textarea"
                :rows="8"
                placeholder='{"creditCode":"91532600XXXXXXXXXX","contactName":"张三"}'
              />
            </el-form-item>
            <div class="form-actions">
              <el-button @click="resetForm">重置</el-button>
              <el-button type="primary" :loading="submitting" @click="submit">提交登记</el-button>
            </div>
          </el-form>
        </div>
      </section>

      <aside class="panel result-panel">
        <div class="panel-header"><h2>登记结果</h2></div>
        <div class="panel-body">
          <el-empty v-if="!result" description="提交后显示接口返回结果" :image-size="72" />
          <el-descriptions v-else :column="1" border>
            <el-descriptions-item label="主体 ID"><span class="mono">{{ result.partyId }}</span></el-descriptions-item>
            <el-descriptions-item label="主体状态"><StatusTag :code="result.status" /></el-descriptions-item>
            <el-descriptions-item label="主体名称">{{ submittedName }}</el-descriptions-item>
            <el-descriptions-item label="主体类型">{{ submittedType }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { masterDataApi, type PartyResponse } from '@/api/masterData';
import { apiErrorMessage } from '@/api/client';

const partyTypes = [
  { label: 'PRODUCER - 生产主体', value: 'PRODUCER' },
  { label: 'PROCESSOR - 加工企业', value: 'PROCESSOR' },
  { label: 'WAREHOUSE - 仓储主体', value: 'WAREHOUSE' },
  { label: 'LOGISTICS - 物流主体', value: 'LOGISTICS' },
  { label: 'HOSPITAL - 医疗机构', value: 'HOSPITAL' }
];

const initialForm = () => ({ partyName: '', partyType: 'PRODUCER', regionCode: '', attributes: '' });
const formRef = ref<FormInstance>();
const form = reactive(initialForm());
const submitting = ref(false);
const result = ref<PartyResponse | null>(null);
const submittedName = ref('');
const submittedType = ref('');

const validateJson = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value.trim()) return callback();
  try {
    JSON.parse(value);
    callback();
  } catch {
    callback(new Error('请输入合法的 JSON 字符串'));
  }
};

const rules: FormRules = {
  partyName: [{ required: true, message: '请输入主体名称', trigger: 'blur' }],
  partyType: [{ required: true, message: '请选择主体类型', trigger: 'change' }],
  attributes: [{ validator: validateJson, trigger: 'blur' }]
};

const resetForm = () => {
  Object.assign(form, initialForm());
  formRef.value?.clearValidate();
  result.value = null;
};

const submit = async () => {
  if (!await formRef.value?.validate().catch(() => false)) return;
  submitting.value = true;
  try {
    result.value = await masterDataApi.registerParty({
      partyName: form.partyName.trim(),
      partyType: form.partyType,
      regionCode: form.regionCode.trim() || undefined,
      attributes: form.attributes.trim() || undefined
    });
    submittedName.value = form.partyName.trim();
    submittedType.value = form.partyType;
    ElMessage.success('主体登记成功');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '主体登记失败'));
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.workspace-grid { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.75fr); gap: 16px; align-items: start; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.result-panel { min-height: 260px; }
@media (max-width: 960px) { .workspace-grid, .form-grid { grid-template-columns: 1fr; } }
</style>
