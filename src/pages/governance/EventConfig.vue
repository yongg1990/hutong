<template>
  <div class="governance-page">
    <PageHeader title="事件与 Schema 配置" subtitle="事件类型定义、Schema 草稿、测试与发布">
      <template #actions>
        <el-button @click="eventTypeVisible = true">创建事件类型</el-button>
        <el-button type="primary" @click="openSchemaDialog">创建 Schema 草稿</el-button>
      </template>
    </PageHeader>

    <el-alert
      type="info"
      :closable="false"
      title="接口未提供事件类型或 Schema 列表。请按事件类型和版本查询；下方仅显示本次页面操作结果。"
      style="margin-bottom: 12px"
    />

    <div class="query-bar">
      <el-input v-model="queryForm.eventType" placeholder="事件类型" clearable />
      <el-input v-model="queryForm.schemaVersion" placeholder="Schema 版本" clearable />
      <el-button type="primary" :loading="querying" @click="querySchema">查询已发布 Schema</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </div>

    <div class="panel">
      <div class="panel-header">本次页面 Schema 记录</div>
      <el-table :data="schemas" empty-text="暂无 Schema 操作记录">
        <el-table-column prop="eventType" label="事件类型" min-width="180" class-name="mono" />
        <el-table-column prop="schemaVersion" label="Schema 版本" width="130" class-name="mono" />
        <el-table-column prop="contentDigest" label="内容摘要" min-width="220" class-name="mono" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewSchema(row)">查看</el-button>
            <el-button size="small" link @click="openTestDialog(row)">测试</el-button>
            <el-button v-if="row.status !== 'PUBLISHED'" size="small" link :loading="publishingKey === schemaKey(row)" @click="publishSchema(row)">发布</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="panel result-panel">
      <div class="panel-header">本次页面事件类型记录</div>
      <el-table :data="eventTypes" empty-text="暂无事件类型创建记录">
        <el-table-column prop="id" label="定义 ID" width="150" class-name="mono" />
        <el-table-column prop="eventType" label="事件类型" min-width="180" class-name="mono" />
        <el-table-column prop="name" label="名称（提交值）" min-width="180" />
        <el-table-column prop="scenarioCode" label="场景代码（提交值）" min-width="160" class-name="mono" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="eventTypeVisible" title="创建事件类型" width="520px" :close-on-click-modal="false">
      <el-form :model="eventTypeForm" label-position="top">
        <el-form-item label="事件类型代码" required><el-input v-model="eventTypeForm.eventType" /></el-form-item>
        <el-form-item label="事件类型名称" required><el-input v-model="eventTypeForm.eventName" /></el-form-item>
        <el-form-item label="场景代码" required><el-input v-model="eventTypeForm.scenarioCode" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="eventTypeForm.description" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="eventTypeVisible = false">取消</el-button>
        <el-button type="primary" :loading="creatingEventType" @click="createEventType">确认创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="schemaVisible" title="创建 Schema 草稿" width="680px" :close-on-click-modal="false">
      <el-form :model="schemaForm" label-position="top">
        <div class="form-grid">
          <el-form-item label="事件类型" required><el-input v-model="schemaForm.eventType" /></el-form-item>
          <el-form-item label="Schema 版本" required><el-input v-model="schemaForm.schemaVersion" /></el-form-item>
        </div>
        <el-form-item label="JSON Schema" required><el-input v-model="schemaForm.schemaJson" type="textarea" :rows="12" class="mono-input" /></el-form-item>
        <el-form-item label="引用提取规则 JSON"><el-input v-model="schemaForm.referenceRulesJson" type="textarea" :rows="4" class="mono-input" /></el-form-item>
        <el-form-item label="值域引用 JSON"><el-input v-model="schemaForm.valueSetRefsJson" type="textarea" :rows="4" class="mono-input" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="schemaVisible = false">取消</el-button>
        <el-button type="primary" :loading="creatingSchema" @click="createSchemaDraft">保存草稿</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testVisible" title="测试 Schema" width="620px" :close-on-click-modal="false">
      <el-descriptions :column="2" border size="small" style="margin-bottom: 14px">
        <el-descriptions-item label="事件类型">{{ testForm.eventType }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ testForm.schemaVersion }}</el-descriptions-item>
      </el-descriptions>
      <el-form label-position="top">
        <el-form-item label="测试 Payload JSON" required><el-input v-model="testForm.payloadJson" type="textarea" :rows="12" class="mono-input" /></el-form-item>
      </el-form>
      <el-alert v-if="testResult" :type="testResult.valid ? 'success' : 'error'" :closable="false" :title="testResult.valid ? '校验通过' : '校验失败，共 ' + testResult.errors.length + ' 项'">
        <template v-if="!testResult.valid" #default>
          <div v-for="(item, index) in testResult.errors" :key="index">{{ item }}</div>
        </template>
      </el-alert>
      <template #footer>
        <el-button @click="testVisible = false">关闭</el-button>
        <el-button type="primary" :loading="testing" @click="testSchema">执行测试</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" title="Schema 内容" size="50%" :close-on-click-modal="false">
      <el-descriptions v-if="selectedSchema" :column="2" border size="small" style="margin-bottom: 14px">
        <el-descriptions-item label="事件类型">{{ selectedSchema.eventType }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ selectedSchema.schemaVersion }}</el-descriptions-item>
        <el-descriptions-item label="状态"><StatusTag :code="selectedSchema.status" /></el-descriptions-item>
        <el-descriptions-item label="摘要">{{ selectedSchema.contentDigest || '-' }}</el-descriptions-item>
      </el-descriptions>
      <pre class="json-code mono">{{ formattedSchema }}</pre>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { apiErrorMessage } from '@/api/client';
import { eventsApi, type SchemaSnapshot, type SchemaTestResult } from '@/api/events';

type EventTypeRow = { id: string; eventType: string; status: string; name: string; scenarioCode: string };

const queryForm = ref({ eventType: '', schemaVersion: '' });
const schemas = ref<SchemaSnapshot[]>([]);
const eventTypes = ref<EventTypeRow[]>([]);
const querying = ref(false);
const publishingKey = ref('');

const eventTypeVisible = ref(false);
const creatingEventType = ref(false);
const eventTypeForm = ref({ eventType: '', eventName: '', scenarioCode: '', description: '' });

const schemaVisible = ref(false);
const creatingSchema = ref(false);
const schemaForm = ref({ eventType: '', schemaVersion: '', schemaJson: '{\n  "type": "object",\n  "properties": {}\n}', referenceRulesJson: '', valueSetRefsJson: '' });

const testVisible = ref(false);
const testing = ref(false);
const testForm = ref({ eventType: '', schemaVersion: '', payloadJson: '{}' });
const testResult = ref<SchemaTestResult | null>(null);

const drawerVisible = ref(false);
const selectedSchema = ref<SchemaSnapshot | null>(null);
const formattedSchema = computed(() => {
  if (!selectedSchema.value?.schemaJson) return '{}';
  try { return JSON.stringify(JSON.parse(selectedSchema.value.schemaJson), null, 2); }
  catch { return selectedSchema.value.schemaJson; }
});

const schemaKey = (row: Pick<SchemaSnapshot, 'eventType' | 'schemaVersion'>) => row.eventType + '@' + row.schemaVersion;

const upsertSchema = (schema: SchemaSnapshot) => {
  const index = schemas.value.findIndex(item => schemaKey(item) === schemaKey(schema));
  if (index >= 0) schemas.value.splice(index, 1, schema);
  else schemas.value.unshift(schema);
};

const validateJsonText = (value: string, label: string, required = false) => {
  if (!value.trim()) {
    if (required) throw new Error('请填写' + label);
    return;
  }
  try { JSON.parse(value); }
  catch { throw new Error(label + '必须是有效 JSON'); }
};

const querySchema = async () => {
  if (!queryForm.value.eventType.trim() || !queryForm.value.schemaVersion.trim()) {
    ElMessage.warning('请输入事件类型和 Schema 版本');
    return;
  }
  querying.value = true;
  try {
    const result = await eventsApi.getEventSchema(queryForm.value.eventType.trim(), queryForm.value.schemaVersion.trim());
    upsertSchema(result);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '查询 Schema 失败'));
  } finally {
    querying.value = false;
  }
};

const resetQuery = () => { queryForm.value = { eventType: '', schemaVersion: '' }; };

const createEventType = async () => {
  const form = eventTypeForm.value;
  if (!form.eventType.trim() || !form.eventName.trim() || !form.scenarioCode.trim()) {
    ElMessage.warning('请填写事件类型、名称和场景代码');
    return;
  }
  creatingEventType.value = true;
  try {
    const result = await eventsApi.createEventType({
      eventType: form.eventType.trim(),
      eventName: form.eventName.trim(),
      scenarioCode: form.scenarioCode.trim(),
      ...(form.description.trim() ? { description: form.description.trim() } : {})
    });
    eventTypes.value.unshift({ ...result, name: form.eventName.trim(), scenarioCode: form.scenarioCode.trim() });
    eventTypeVisible.value = false;
    schemaForm.value.eventType = result.eventType;
    ElMessage.success('事件类型创建成功');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '创建事件类型失败'));
  } finally {
    creatingEventType.value = false;
  }
};

const openSchemaDialog = () => {
  schemaForm.value = {
    eventType: queryForm.value.eventType || schemaForm.value.eventType,
    schemaVersion: queryForm.value.schemaVersion,
    schemaJson: '{\n  "type": "object",\n  "properties": {}\n}',
    referenceRulesJson: '',
    valueSetRefsJson: ''
  };
  schemaVisible.value = true;
};

const createSchemaDraft = async () => {
  const form = schemaForm.value;
  if (!form.eventType.trim() || !form.schemaVersion.trim()) {
    ElMessage.warning('请输入事件类型和 Schema 版本');
    return;
  }
  try {
    validateJsonText(form.schemaJson, 'JSON Schema', true);
    validateJsonText(form.referenceRulesJson, '引用提取规则');
    validateJsonText(form.valueSetRefsJson, '值域引用');
  } catch (error) {
    ElMessage.warning((error as Error).message);
    return;
  }
  creatingSchema.value = true;
  try {
    const result = await eventsApi.createSchemaDraft({
      eventType: form.eventType.trim(),
      schemaVersion: form.schemaVersion.trim(),
      schemaJson: form.schemaJson.trim(),
      ...(form.referenceRulesJson.trim() ? { referenceRulesJson: form.referenceRulesJson.trim() } : {}),
      ...(form.valueSetRefsJson.trim() ? { valueSetRefsJson: form.valueSetRefsJson.trim() } : {})
    });
    upsertSchema(result);
    schemaVisible.value = false;
    ElMessage.success('Schema 草稿创建成功');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '创建 Schema 草稿失败'));
  } finally {
    creatingSchema.value = false;
  }
};

const openTestDialog = (row: SchemaSnapshot) => {
  testForm.value = { eventType: row.eventType, schemaVersion: row.schemaVersion, payloadJson: '{}' };
  testResult.value = null;
  testVisible.value = true;
};

const testSchema = async () => {
  try { validateJsonText(testForm.value.payloadJson, '测试 Payload JSON', true); }
  catch (error) { ElMessage.warning((error as Error).message); return; }
  testing.value = true;
  try {
    testResult.value = await eventsApi.testEventSchema(testForm.value.eventType, testForm.value.schemaVersion, testForm.value.payloadJson.trim());
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '测试 Schema 失败'));
  } finally {
    testing.value = false;
  }
};

const publishSchema = async (row: SchemaSnapshot) => {
  publishingKey.value = schemaKey(row);
  try {
    const result = await eventsApi.publishEventSchema(row.eventType, row.schemaVersion);
    upsertSchema(result);
    ElMessage.success('Schema 发布成功');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '发布 Schema 失败'));
  } finally {
    publishingKey.value = '';
  }
};

const viewSchema = (row: SchemaSnapshot) => { selectedSchema.value = row; drawerVisible.value = true; };
</script>

<style scoped>
.query-bar {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(160px, 1fr) auto auto;
  gap: 10px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.result-panel { margin-top: 12px; }

.panel-header {
  padding: 11px 14px;
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
  font-weight: 600;
}

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mono-input :deep(textarea) { font-family: Consolas, monospace; }

.json-code {
  margin: 0;
  padding: 14px;
  max-height: calc(100vh - 190px);
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #202823;
  color: #dce9e2;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .query-bar, .form-grid { grid-template-columns: 1fr; }
}
</style>
