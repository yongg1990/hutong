<template>
  <div class="governance-page">
    <PageHeader title="事件与 Schema 配置" subtitle="事件类型定义、Schema 草稿、测试与发布">
      <template #actions>
        <el-button @click="eventTypeVisible = true">创建事件类型</el-button>
        <el-button type="primary" @click="openSchemaDialog">创建 Schema 草稿</el-button>
      </template>
    </PageHeader>


    <div class="query-bar">
      <el-input v-model="queryForm.eventType" placeholder="事件类型" clearable />
      <el-input v-model="queryForm.schemaVersion" placeholder="Schema 版本" clearable />
      <el-select v-model="queryForm.status" placeholder="Schema 状态" clearable><el-option label="草稿" value="DRAFT" /><el-option label="已测试" value="TESTED" /><el-option label="已发布" value="PUBLISHED" /></el-select>
      <el-button type="primary" :loading="querying" @click="searchSchemas">查询 Schema</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </div>

    <div class="panel">
      <div class="panel-header">Schema 定义</div>
      <el-table :data="schemas" empty-text="暂无 Schema 定义">
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
      <div class="pagination-row"><el-pagination v-model:current-page="schemaPage" :page-size="20" :total="schemaTotal" layout="total, prev, pager, next" @current-change="querySchema" /></div>
    </div>

    <div class="panel result-panel">
      <div class="panel-header">事件类型</div>
      <FilterBar @search="searchEventTypes" @reset="resetEventTypes">
        <el-input v-model="eventFilters.eventType" placeholder="事件类型代码" clearable style="width: 180px" />
        <el-input v-model="eventFilters.scenarioCode" placeholder="场景代码" clearable style="width: 160px" />
        <el-select v-model="eventFilters.status" placeholder="状态" clearable style="width: 140px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select>
      </FilterBar>
      <el-table :data="eventTypes" empty-text="暂无事件类型">
        <el-table-column prop="id" label="定义 ID" width="150" class-name="mono" />
        <el-table-column prop="eventType" label="事件类型" min-width="180" class-name="mono" />
        <el-table-column prop="eventName" label="名称" min-width="180" />
        <el-table-column prop="scenarioCode" label="场景代码" min-width="160" class-name="mono" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
      </el-table>
      <div class="pagination-row"><el-pagination v-model:current-page="eventPage" :page-size="20" :total="eventTotal" layout="total, prev, pager, next" @current-change="loadEventTypes" /></div>
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
        <el-form-item label="字段列表 JSON" required><JsonEditor v-model="schemaForm.fieldsJson" :rows="12" label="字段列表 JSON" /></el-form-item>
        <el-form-item label="引用规则 JSON"><JsonEditor v-model="schemaForm.referenceRulesJson" :rows="4" label="引用规则 JSON" /></el-form-item>
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
        <el-alert type="info" :closable="false" title="测试服务端保存的 Schema 配置；此接口不校验事件 Payload。" />
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
import { computed, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import JsonEditor from '@/components/common/JsonEditor.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { apiErrorMessage } from '@/api/client';
import { eventsApi, type SchemaSnapshot, type SchemaTestResult, type EventSchemaField, type EventSchemaReferenceRule } from '@/api/events';

type EventTypeRow = { id: string; eventType: string; status: string; eventName: string; scenarioCode: string };

const emptySchemaFilters = () => ({ eventType: '', schemaVersion: '', status: '' });
const emptyEventFilters = () => ({ eventType: '', scenarioCode: '', status: '' });
const queryForm = ref(emptySchemaFilters()), appliedSchemaFilters = ref(emptySchemaFilters());
const eventFilters = ref(emptyEventFilters()), appliedEventFilters = ref(emptyEventFilters());
const schemaPage = ref(1), schemaTotal = ref(0), eventPage = ref(1), eventTotal = ref(0);
const paramsFor = (values: Record<string, string>) => Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
const searchSchemas = () => { appliedSchemaFilters.value = { ...queryForm.value }; schemaPage.value = 1; void querySchema(); };
const searchEventTypes = () => { appliedEventFilters.value = { ...eventFilters.value }; eventPage.value = 1; void loadEventTypes(); };
const resetEventTypes = () => { eventFilters.value = emptyEventFilters(); appliedEventFilters.value = emptyEventFilters(); eventPage.value = 1; void loadEventTypes(); };
const schemas = ref<SchemaSnapshot[]>([]);
const eventTypes = ref<EventTypeRow[]>([]);
const querying = ref(false);
const publishingKey = ref('');

const eventTypeVisible = ref(false);
const creatingEventType = ref(false);
const eventTypeForm = ref({ eventType: '', eventName: '', scenarioCode: '', description: '' });

const schemaVisible = ref(false);
const creatingSchema = ref(false);
const schemaForm = ref({ eventType: '', schemaVersion: '', fieldsJson: '[\n  {"fieldName":"businessKey","displayName":"业务键","dataType":"STRING","required":true}\n]', referenceRulesJson: '[]' });

const testVisible = ref(false);
const testing = ref(false);
const testForm = ref({ id: '', eventType: '', schemaVersion: '' });
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
  querying.value = true;
  try {
    const result = await eventsApi.listSchemaDefinitions({ ...paramsFor(appliedSchemaFilters.value), page: schemaPage.value, size: 20 });
    schemas.value = result.records;
    schemaTotal.value = Number(result.total || 0);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '查询 Schema 失败'));
  } finally {
    querying.value = false;
  }
};

const resetQuery = () => { queryForm.value = emptySchemaFilters(); appliedSchemaFilters.value = emptySchemaFilters(); schemaPage.value = 1; void querySchema(); };
const loadEventTypes = async () => {
  try {
    const result = await eventsApi.listEventTypes({ ...paramsFor(appliedEventFilters.value), page: eventPage.value, size: 20 });
    eventTypes.value = result.records || [];
    eventTotal.value = Number(result.total || 0);
  } catch (error) { ElMessage.error(apiErrorMessage(error, '查询事件类型失败')); }
};

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
    eventTypes.value.unshift({ ...result, eventName: form.eventName.trim(), scenarioCode: form.scenarioCode.trim() });
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
    fieldsJson: '[\n  {"fieldName":"businessKey","displayName":"业务键","dataType":"STRING","required":true}\n]',
    referenceRulesJson: '[]'
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
    validateJsonText(form.fieldsJson, '字段列表', true);
    validateJsonText(form.referenceRulesJson, '引用规则', true);
    const fields: EventSchemaField[] = JSON.parse(form.fieldsJson);
    const rules: EventSchemaReferenceRule[] = JSON.parse(form.referenceRulesJson);
    if (!Array.isArray(fields) || !fields.length || fields.some(field => !field.fieldName || !field.displayName || !field.dataType || typeof field.required !== 'boolean')) throw new Error('字段列表须为非空数组，且包含名称、显示名、类型和必填标记');
    if (!Array.isArray(rules) || rules.some(rule => !rule.fieldName || !rule.targetType || !rule.namespace || typeof rule.required !== 'boolean' || !rule.onNotFound || !rule.onAmbiguous)) throw new Error('引用规则须为数组且填写完整');
  } catch (error) {
    ElMessage.warning((error as Error).message);
    return;
  }
  creatingSchema.value = true;
  try {
    const result = await eventsApi.createSchemaDraft({
      eventType: form.eventType.trim(),
      schemaVersion: form.schemaVersion.trim(),
      fields: JSON.parse(form.fieldsJson) as EventSchemaField[],
      referenceRules: JSON.parse(form.referenceRulesJson) as EventSchemaReferenceRule[]
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
  testForm.value = { id: row.id, eventType: row.eventType, schemaVersion: row.schemaVersion };
  testResult.value = null;
  testVisible.value = true;
};

const testSchema = async () => {
  testing.value = true;
  try {
    testResult.value = await eventsApi.testSchemaDefinition(testForm.value.id);
    await querySchema();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '测试 Schema 失败'));
  } finally {
    testing.value = false;
  }
};

const publishSchema = async (row: SchemaSnapshot) => {
  publishingKey.value = schemaKey(row);
  try {
    const result = await eventsApi.publishEventSchema(row.id);
    upsertSchema(result);
    ElMessage.success('Schema 发布成功');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '发布 Schema 失败'));
  } finally {
    publishingKey.value = '';
  }
};

const viewSchema = async (row: SchemaSnapshot) => {
  try { selectedSchema.value = await eventsApi.getSchemaDefinition(row.id); drawerVisible.value = true; }
  catch (error) { ElMessage.error(apiErrorMessage(error, '查询 Schema 失败')); }
};
onMounted(async () => {
  await querySchema();
  await loadEventTypes();
});
</script>

<style scoped>
.query-bar {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(150px, 1fr) minmax(140px, 0.8fr) auto auto;
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
