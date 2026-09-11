<template>
  <div class="governance-page">
    <PageHeader
      title="事件与 Schema 配置"
      subtitle="业务事件定义、JSON Schema 结构模型与版本管理"
    >
      <template #actions>
        <el-button type="primary" @click="openDiffModal">
          <el-icon><DocumentCopy /></el-icon> Schema 版本 Diff 对比
        </el-button>
      </template>
    </PageHeader>

    <div class="panel">
      <el-table :data="schemas">
        <el-table-column prop="eventType" label="事件类型" width="180" class-name="mono" />
        <el-table-column prop="eventTypeName" label="事件中文名" min-width="160" />
        <el-table-column prop="schemaVersion" label="Schema 版本" width="110" class-name="mono" />
        <el-table-column prop="scenarioCode" label="归属场景" width="130" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewSchema(row)">查看Schema</el-button>
            <el-button size="small" link @click="openDiffModal">对比Diff</el-button>
            <el-button size="small" link @click="router.push('/business/events/new/' + row.eventType)">
              表单测试
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Schema View Drawer -->
    <el-drawer v-model="schemaDrawerVisible" :title="'事件契约定义: ' + (selectedSchema?.eventTypeName || '')" size="48%">
      <div v-if="selectedSchema" class="schema-drawer-content">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="事件代码">{{ selectedSchema.eventType }}</el-descriptions-item>
          <el-descriptions-item label="版本号">{{ selectedSchema.schemaVersion }}</el-descriptions-item>
          <el-descriptions-item label="协同场景">{{ selectedSchema.scenarioCode }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <StatusTag :code="selectedSchema.status" />
          </el-descriptions-item>
        </el-descriptions>

        <h3 style="font-size: 14px; margin-bottom: 8px; font-weight: 600;">JSON Schema 结构规范 (Draft-07)</h3>
        <pre class="json-code mono">{{ schemaJsonText }}</pre>
      </div>
    </el-drawer>

    <!-- Schema Diff Modal Component -->
    <SchemaDiffModal ref="diffModalRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { DocumentCopy } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import SchemaDiffModal from '@/components/common/SchemaDiffModal.vue';
import { useMetadataStore } from '@/stores/metadataStore';
import { eventsApi } from '@/api/events';

const router = useRouter();
const metadataStore = useMetadataStore();
const schemas = ref(metadataStore.schemas);

const diffModalRef = ref<InstanceType<typeof SchemaDiffModal> | null>(null);
const schemaDrawerVisible = ref(false);
const selectedSchema = ref<any>(null);

const openDiffModal = () => {
  if (diffModalRef.value) {
    diffModalRef.value.open();
  }
};

const viewSchema = async (row: any) => {
  selectedSchema.value = row;
  schemaDrawerVisible.value = true;
  try {
    const published = await eventsApi.getEventSchema(row.eventType, row.schemaVersion);
    if (published) {
      const raw = published.schemaJson || published.fieldsJson;
      if (raw) {
        row.fieldsJson = typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
    }
  } catch {
    // Keep the local schema snapshot visible when the backend has no published version.
  }
};

const generateSampleSchema = (schema: any) => {
  if (!schema) return {};
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: schema.eventTypeName || schema.eventType || '事件规范',
    type: "object",
    required: ["batchNo", "occurredAt", "operator"],
    properties: {
      batchNo: { type: "string", description: "中药生产/加工/入库批次号" },
      occurredAt: { type: "string", format: "date-time", description: "业务事件发生时间" },
      operator: { type: "string", description: "操作责任人" },
      quantity: { type: "number", minimum: 0, description: "数量" },
      unitCode: { type: "string", enum: ["kg", "g", "bag", "box"], description: "单位代码" },
      proofHash: { type: "string", pattern: "^0x[0-9a-fA-F]{64}$", description: "区块链上链哈希" }
    }
  };
};

const schemaJsonText = computed(() => {
  if (!selectedSchema.value) return '{}';
  try {
    const raw = selectedSchema.value.fieldsJson || generateSampleSchema(selectedSchema.value);
    return JSON.stringify(raw, null, 2);
  } catch (err) {
    return '{}';
  }
});
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.json-code {
  background: #202823;
  color: #dce9e2;
  border-radius: 6px;
  padding: 14px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  max-height: 500px;
  overflow-y: auto;
}
</style>
