<template>
  <div class="master-data-page">
    <PageHeader title="业务对象登记" subtitle="登记项目空间内的批次、包装、订单等业务对象" />

    <div class="workspace-grid">
      <section class="panel">
        <div class="panel-header"><h2>对象信息</h2></div>
        <div class="panel-body">
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <div class="form-grid">
              <el-form-item label="项目空间 ID" prop="projectSpaceId">
                <el-input v-model="form.projectSpaceId" class="mono" placeholder="请输入数字字符串 ID" />
              </el-form-item>
              <el-form-item label="对象类型" prop="objectType">
                <el-select v-model="form.objectType" allow-create filterable style="width: 100%">
                  <el-option v-for="type in objectTypes" :key="type" :label="type" :value="type" />
                </el-select>
              </el-form-item>
              <el-form-item label="来源业务键" prop="sourceBusinessKey">
                <el-input v-model="form.sourceBusinessKey" placeholder="来源系统内唯一业务键" />
              </el-form-item>
              <el-form-item label="所有者主体 ID" prop="ownerPartyId">
                <el-input v-model="form.ownerPartyId" class="mono" placeholder="可选，数字字符串 ID" />
              </el-form-item>
            </div>
            <el-form-item label="对象动态属性 JSON" prop="attributes">
              <el-input v-model="form.attributes" type="textarea" :rows="9" placeholder='{"displayName":"2026 年三七春播批次","batchNo":"CROP-2026-001"}' />
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
          <el-empty v-if="!result" description="提交后显示对象 ID 与版本号" :image-size="72" />
          <el-descriptions v-else :column="1" border>
            <el-descriptions-item label="对象 ID"><span class="mono">{{ result.objectId }}</span></el-descriptions-item>
            <el-descriptions-item label="当前版本号"><span class="mono">{{ result.versionNo }}</span></el-descriptions-item>
            <el-descriptions-item label="来源业务键">{{ submittedBusinessKey }}</el-descriptions-item>
            <el-descriptions-item label="对象类型">{{ submittedObjectType }}</el-descriptions-item>
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
import { masterDataApi, type BusinessObjectResponse } from '@/api/masterData';
import { apiErrorMessage } from '@/api/client';

const objectTypes = ['CROP_BATCH', 'PROCESS_BATCH', 'HERB_PACKAGE', 'ORDER'];
const storedProjectSpaceId = localStorage.getItem('tcmirp_project_space_id') || localStorage.getItem('tcmirp_project_id') || '';
const initialForm = () => ({
  projectSpaceId: storedProjectSpaceId,
  objectType: 'CROP_BATCH',
  sourceBusinessKey: '',
  ownerPartyId: '',
  attributes: JSON.stringify({ displayName: '', batchNo: '' }, null, 2)
});

const formRef = ref<FormInstance>();
const form = reactive(initialForm());
const submitting = ref(false);
const result = ref<BusinessObjectResponse | null>(null);
const submittedBusinessKey = ref('');
const submittedObjectType = ref('');

const numericId = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value || /^-?[0-9]+$/.test(value)) callback();
  else callback(new Error('请输入数字字符串 ID'));
};

const validJson = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
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
  attributes: [{ required: true, message: '请输入动态属性', trigger: 'blur' }, { validator: validJson, trigger: 'blur' }]
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
    result.value = await masterDataApi.registerBusinessObject({
      projectSpaceId: form.projectSpaceId.trim(),
      objectType: form.objectType.trim(),
      ownerPartyId: form.ownerPartyId.trim() || undefined,
      attributes: form.attributes.trim(),
      sourceBusinessKey: form.sourceBusinessKey.trim()
    });
    submittedBusinessKey.value = form.sourceBusinessKey.trim();
    submittedObjectType.value = form.objectType.trim();
    ElMessage.success('业务对象登记成功');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '业务对象登记失败'));
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
