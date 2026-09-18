<template>
  <div class="master-data-page">
    <PageHeader title="标识命名空间" subtitle="登记全局唯一的标识规则，并限定可绑定的主数据类型" />

    <div class="workspace-grid">
      <section class="panel">
        <div class="panel-header"><h2>命名空间定义</h2></div>
        <div class="panel-body">
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <div class="form-grid">
              <el-form-item label="命名空间编码" prop="namespaceCode">
                <el-input v-model="form.namespaceCode" maxlength="128" placeholder="例如：CREDIT_CODE" @input="normalizeCode" />
              </el-form-item>
              <el-form-item label="命名空间名称" prop="namespaceName">
                <el-input v-model="form.namespaceName" maxlength="200" placeholder="例如：统一社会信用代码" />
              </el-form-item>
            </div>
            <el-form-item label="允许绑定的目标类型" prop="targetType">
              <el-segmented v-model="form.targetType" :options="targetTypeOptions" />
            </el-form-item>
            <el-form-item label="标识值正则表达式" prop="valuePattern">
              <el-input v-model="form.valuePattern" maxlength="512" placeholder="可选，例如：^[0-9A-Z]{18}$" />
            </el-form-item>
            <el-alert
              title="标识值会去除首尾空格并转为大写后再匹配正则表达式"
              type="info"
              show-icon
              :closable="false"
              class="rule-alert"
            />
            <div class="form-actions">
              <el-button @click="resetForm">重置</el-button>
              <el-button type="primary" :loading="submitting" @click="submit">登记命名空间</el-button>
            </div>
          </el-form>
        </div>
      </section>

      <aside class="panel result-panel">
        <div class="panel-header"><h2>登记结果</h2></div>
        <div class="panel-body">
          <el-empty v-if="!result" description="登记后显示命名空间定义" :image-size="72" />
          <el-descriptions v-else :column="1" border>
            <el-descriptions-item label="命名空间 ID"><span class="mono">{{ result.namespaceId }}</span></el-descriptions-item>
            <el-descriptions-item label="编码"><span class="mono">{{ result.namespaceCode }}</span></el-descriptions-item>
            <el-descriptions-item label="名称">{{ result.namespaceName }}</el-descriptions-item>
            <el-descriptions-item label="目标类型">{{ result.targetType }}</el-descriptions-item>
            <el-descriptions-item label="值格式"><span class="mono break-all">{{ result.valuePattern || '不限制' }}</span></el-descriptions-item>
            <el-descriptions-item label="状态"><StatusTag :code="result.status" /></el-descriptions-item>
            <el-descriptions-item v-if="result.createdAt" label="创建时间">{{ result.createdAt }}</el-descriptions-item>
            <el-descriptions-item v-if="result.updatedAt" label="更新时间">{{ result.updatedAt }}</el-descriptions-item>
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
import { masterDataApi, type NamespaceDefResponse } from '@/api/masterData';
import { apiErrorMessage } from '@/api/client';

const targetTypeOptions = [
  { label: '主体 PARTY', value: 'PARTY' },
  { label: '业务对象 OBJECT', value: 'OBJECT' }
];
const initialForm = () => ({ namespaceCode: '', namespaceName: '', targetType: 'PARTY' as 'PARTY' | 'OBJECT', valuePattern: '' });
const formRef = ref<FormInstance>();
const form = reactive(initialForm());
const submitting = ref(false);
const result = ref<NamespaceDefResponse | null>(null);

const rules: FormRules = {
  namespaceCode: [{ required: true, message: '请输入命名空间编码', trigger: 'blur' }],
  namespaceName: [{ required: true, message: '请输入命名空间名称', trigger: 'blur' }],
  targetType: [{ required: true, message: '请选择目标类型', trigger: 'change' }]
};

const normalizeCode = (value: string) => {
  form.namespaceCode = value.trimStart().toUpperCase().replace(/\s+/g, '_');
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
    result.value = await masterDataApi.registerNamespace({
      namespaceCode: form.namespaceCode.trim(),
      namespaceName: form.namespaceName.trim(),
      targetType: form.targetType,
      valuePattern: form.valuePattern.trim() || undefined
    });
    ElMessage.success('标识命名空间登记成功');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '标识命名空间登记失败'));
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.workspace-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr); gap: 16px; align-items: start; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.rule-alert { margin-bottom: 18px; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.result-panel { min-height: 300px; }
.break-all { word-break: break-all; }
@media (max-width: 960px) { .workspace-grid, .form-grid { grid-template-columns: 1fr; } }
</style>
