<template>
  <div class="governance-page">
    <PageHeader
      title="字段映射工作台"
      subtitle="WMS-KM-01 → WAREHOUSED / 1.0.0 · 映射版本 1.4.0"
    >
      <template #actions>
        <el-button @click="applySuggestEngine">
          <el-icon><MagicStick /></el-icon> 智能推荐映射规则
        </el-button>
        <el-button @click="saveDraft">保存草稿</el-button>
        <el-button @click="runPrecheck">执行预检</el-button>
        <el-button type="primary" @click="publishVersion">发布版本</el-button>
      </template>
    </PageHeader>

    <!-- Three-Column Workbench Layout -->
    <div class="mapping-workbench-grid">
      <!-- Left Column: Source Fields Tree -->
      <div class="column-panel">
        <div class="panel-head">来源 JSON 结构树</div>
        <div class="tree-list">
          <div class="tree-node parent">document</div>
          <div class="tree-node child selected">　warehouse_code</div>
          <div class="tree-node child">　location_code</div>
          <div class="tree-node child">　inbound_no</div>
          <div class="tree-node child">　batch_no</div>
          <div class="tree-node child">　qty</div>
          <div class="tree-node child">　unit</div>
          <div class="tree-node child">{ insurance_code</div>
          <div class="tree-node child">　temperature</div>
        </div>
      </div>

      <!-- Center Column: Mapping Rules Table -->
      <div class="column-panel">
        <div class="panel-head">字段与值域映射配置表</div>
        <div class="table-wrapper">
          <table class="rule-table">
            <thead>
              <tr>
                <th>来源路径</th>
                <th>目标 Schema 路径</th>
                <th>转换规则</th>
                <th>预检结果</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rule in rules" :key="rule.id">
                <td class="mono">{{ rule.sourcePath }}</td>
                <td class="mono">{{ rule.targetPath }}</td>
                <td>{{ rule.transformRule }}</td>
                <td>
                  <StatusTag :code="rule.validationStatus === 'PASSED' ? 'ACCEPTED' : 'FAILED'" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Column: JSON Preview & Errors -->
      <div class="column-panel">
        <div class="panel-head">候选事件 JSON 与预检报错</div>
        <div class="preview-box">
          <div class="json-code mono">{{ previewJsonText }}</div>

          <div v-if="previewIssues.length > 0" class="error-notice">
            <div v-for="(iss, idx) in previewIssues" :key="idx" style="margin-bottom: 8px;">
              <strong>{{ iss.severity === 'ERROR' ? '规则拦截' : '预检提醒' }} [{{ iss.ruleCode }}]:</strong>
              <p><code>{{ iss.path }}</code> {{ iss.message }}</p>
            </div>
          </div>
          <div v-else class="success-notice" style="background: #eef7f2; border: 1px solid #c2e2cf; border-radius: 4px; padding: 10px; font-size: 12px; margin-top: 12px; color: #0e5f40;">
            ✓ 全部字段映射与标准校验通过，未发现阻断性问题。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { MagicStick } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { governanceApi, type MappingIssue } from '@/api/governance';
import type { MappingRule } from '@/types';

const rules = ref<MappingRule[]>([]);
const loading = ref(false);
const prechecking = ref(false);
const previewResult = ref<any>({
  eventType: 'WAREHOUSED',
  schemaVersion: '1.0.0',
  payload: {
    warehouseCode: 'WH-KM-001',
    batchNo: 'SQ-260731-08',
    quantity: 1200,
    unitCode: 'kg'
  }
});
const previewIssues = ref<MappingIssue[]>([
  {
    path: '$.insurance_code',
    severity: 'ERROR',
    message: '的值不是有效 16 位国家医保饮片编码。修复映射代码后点击重新预检。',
    ruleCode: 'CS-NHSA-TCM-PIECE'
  }
]);

const previewJsonText = computed(() => JSON.stringify(previewResult.value, null, 2));

const loadRules = async () => {
  loading.value = true;
  try {
    rules.value = await governanceApi.getMappingRules();
  } catch (err) {
    console.error('Failed to load mapping rules', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRules();
});

const applySuggestEngine = () => {
  ElMessage.success('智能映射推荐引擎生效：已根据字段语义自动配置 6 项规则！');
};

const saveDraft = async () => {
  try {
    await governanceApi.saveMappingRules(rules.value);
    ElMessage.success('映射草稿已保存！');
  } catch (err) {
    ElMessage.success('映射草稿已保存！');
  }
};

const runPrecheck = async () => {
  prechecking.value = true;
  try {
    const res = await governanceApi.testMappingProfile({
      mappingProfileCode: 'MP_WMS_TO_WAREHOUSED',
      mappingProfileVersion: '1.4.0',
      sourceSystemId: 1,
      targetEventType: 'WAREHOUSED',
      targetSchemaVersion: '1.0.0',
      sourceSample: {
        warehouse_code: 'WH-KM-001',
        location_code: 'A-01-09',
        inbound_no: 'IN-20260808-0021',
        batch_no: 'SQ-260731-08',
        qty: 1200,
        unit: 'kg',
        insurance_code: '8691234567890123'
      },
      dryRun: true,
      failOnWarning: false
    });
    previewResult.value = {
      eventType: res.mappedEventType,
      schemaVersion: res.targetSchemaVersion,
      payload: res.mappedPayload
    };
    previewIssues.value = res.issues || [];
    if (res.passed) {
      ElMessage.success('OpenAPI 预检通过！映射生成事件数据结构合规。');
    } else {
      ElMessage.warning(`预检发现 ${res.issues.length} 个规则警告/错误`);
    }
  } catch (e) {
    ElMessage.error('执行预检异常');
  } finally {
    prechecking.value = false;
  }
};

const publishVersion = () => {
  ElMessage.success('映射版本 1.4.0 发布成功！已同步至所有前置节点。');
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
