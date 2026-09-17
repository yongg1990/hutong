<template>
  <div class="governance-page">
    <PageHeader
      title="字段映射工作台"
      subtitle="映射配置预检与来源样例试算"
    >
      <template #actions>
        <el-button type="primary" :loading="prechecking" @click="runPrecheck">执行预检</el-button>
      </template>
    </PageHeader>
    <el-alert type="info" :closable="false" title="APP-03 仅提供映射预检接口，不提供映射规则查询、保存或发布接口。" style="margin-bottom: 12px" />
    <el-form :model="form" label-position="top" class="precheck-form">
      <el-form-item label="映射配置代码" required><el-input v-model="form.mappingProfileCode" /></el-form-item>
      <el-form-item label="映射配置版本" required><el-input v-model="form.mappingProfileVersion" /></el-form-item>
      <el-form-item label="来源系统 ID" required><el-input-number v-model="form.sourceSystemId" :min="1" style="width: 100%" /></el-form-item>
      <el-form-item label="目标事件类型" required><el-input v-model="form.targetEventType" /></el-form-item>
      <el-form-item label="目标 Schema 版本" required><el-input v-model="form.targetSchemaVersion" /></el-form-item>
      <el-form-item label="警告阻断"><el-switch v-model="form.failOnWarning" /></el-form-item>
      <el-form-item label="来源 JSON 样例" required class="sample-input"><el-input v-model="sampleJson" type="textarea" :rows="8" /></el-form-item>
    </el-form>

    <div v-if="previewResult" class="mapping-workbench-grid">
      <!-- Left Column: Source Fields Tree -->
      <div class="column-panel">
        <div class="panel-head">来源 JSON 结构树</div>
        <div class="tree-list"><div v-for="key in sampleKeys" :key="key" class="tree-node">{{ key }}</div></div>
      </div>

      <!-- Center Column: Mapping Rules Table -->
      <div class="column-panel">
        <div class="panel-head">预检问题 ({{ previewIssues.length }})</div>
        <div class="table-wrapper">
          <table class="rule-table">
            <thead>
              <tr>
                <th>字段路径</th>
                <th>规则码</th>
                <th>级别</th>
                <th>消息</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(issue, idx) in previewIssues" :key="idx"><td>{{ issue.path }}</td><td>{{ issue.ruleCode }}</td><td>{{ issue.severity }}</td><td>{{ issue.message }}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Column: JSON Preview & Errors -->
      <div class="column-panel">
        <div class="panel-head">预检响应</div>
        <div class="preview-box">
          <div class="json-code mono">{{ previewJsonText }}</div>

          <div v-if="previewIssues.length > 0" class="error-notice">
            <div v-for="(iss, idx) in previewIssues" :key="idx" style="margin-bottom: 8px;">
              <strong>{{ iss.severity === 'ERROR' ? '规则拦截' : '预检提醒' }} [{{ iss.ruleCode }}]:</strong>
              <p><code>{{ iss.path }}</code> {{ iss.message }}</p>
            </div>
          </div>
          <div v-else class="success-notice" style="background: #eef7f2; border: 1px solid #c2e2cf; border-radius: 4px; padding: 10px; font-size: 12px; margin-top: 12px; color: #0e5f40;">
            {{ previewResult.passed ? '预检通过' : '预检未通过' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import { governanceApi, type MappingIssue } from '@/api/governance';
import { apiErrorMessage } from '@/api/client';
const form = ref({ mappingProfileCode: '', mappingProfileVersion: '', sourceSystemId: Number(localStorage.getItem('tcmirp_source_system_id')) || 0, targetEventType: '', targetSchemaVersion: '', failOnWarning: false });
const sampleJson = ref('{}');
const sampleKeys = ref<string[]>([]);
const prechecking = ref(false);
const previewResult = ref<any>(null);
const previewIssues = ref<MappingIssue[]>([]);

const previewJsonText = computed(() => JSON.stringify(previewResult.value, null, 2));

const runPrecheck = async () => {
  if (!form.value.mappingProfileCode || !form.value.mappingProfileVersion || !form.value.sourceSystemId || !form.value.targetEventType || !form.value.targetSchemaVersion) {
    ElMessage.warning('请填写映射和目标事件信息');
    return;
  }
  let sample: Record<string, any>;
  try { sample = JSON.parse(sampleJson.value); if (!sample || Array.isArray(sample) || typeof sample !== 'object') throw new Error(); }
  catch { ElMessage.warning('来源样例必须是 JSON 对象'); return; }
  sampleKeys.value = Object.keys(sample);
  prechecking.value = true;
  try {
    const res = await governanceApi.testMappingProfile({
      ...form.value, sourceSample: sample,
      dryRun: true
    });
    previewResult.value = res;
    previewIssues.value = res.issues || [];
    if (res.passed) {
      ElMessage.success('OpenAPI 预检通过！映射生成事件数据结构合规。');
    } else {
      ElMessage.warning(`预检未通过，发现 ${res.issues?.length || 0} 项问题`);
    }
  } catch (e) {
    ElMessage.error(apiErrorMessage(e, '执行预检失败'));
  } finally {
    prechecking.value = false;
  }
};

</script>

<style scoped>
.mapping-workbench-grid {
  display: grid;
  grid-template-columns: 210px 1fr 320px;
  height: calc(100vh - 170px);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 6px;
  overflow: hidden;
}
.precheck-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 12px; }
.sample-input { grid-column: 1 / -1; }
@media (max-width: 900px) { .precheck-form { grid-template-columns: 1fr; } .mapping-workbench-grid { grid-template-columns: 1fr; height: auto; } }

.column-panel {
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.column-panel:last-child {
  border-right: 0;
}

.panel-head {
  padding: 10px 14px;
  font-weight: 600;
  font-size: 13px;
  background: #f7f9f8;
  border-bottom: 1px solid var(--color-border);
}

.tree-list {
  padding: 8px 0;
  overflow-y: auto;
}

.tree-node {
  padding: 8px 14px;
  font-size: 13px;
  font-family: Consolas, monospace;
}

.tree-node.selected {
  background: var(--color-brand-soft);
  color: var(--color-brand);
  font-weight: 700;
}

.table-wrapper {
  flex: 1;
  overflow-y: auto;
}

.rule-table {
  width: 100%;
  border-collapse: collapse;
}

.rule-table th {
  background: #f6f8f7;
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.rule-table td {
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid #edf0ee;
}

.preview-box {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.json-code {
  background: #202823;
  color: #dce9e2;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.error-notice {
  border-left: 3px solid var(--color-danger);
  background: #fff5f4;
  padding: 10px;
  font-size: 12px;
  border-radius: 0 4px 4px 0;
}

.error-notice p {
  margin: 4px 0 0;
  color: var(--color-danger);
}
</style>
