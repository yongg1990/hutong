<template>
<div>
<PageHeader title="Schema 草稿与发布" />
    <div class="query-bar">
      <el-input v-model="queryForm.eventType" placeholder="事件类型" clearable />
      <el-input v-model="queryForm.schemaVersion" placeholder="Schema 版本" clearable />
      <el-select v-model="queryForm.status" placeholder="Schema 状态" clearable><el-option label="草稿" value="DRAFT" /><el-option label="已测试" value="TESTED" /><el-option label="已发布" value="PUBLISHED" /></el-select>
      <el-button type="primary" :loading="querying" @click="searchSchemas">查询 Schema</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <el-button class="query-create" type="primary" @click="openSchemaDialog"><el-icon><Plus /></el-icon>新增</el-button>
    </div>

    <div class="panel">
      <el-table :data="schemas" v-loading="querying" empty-text="暂无 Schema 定义">
        <el-table-column prop="eventType" label="事件类型" min-width="180" class-name="mono" />
        <el-table-column prop="schemaVersion" label="Schema 版本" width="130" class-name="mono" />
        <el-table-column prop="contentDigest" label="内容摘要" min-width="220" class-name="mono" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewSchema(row)">查看</el-button>
            <el-button v-if="row.status !== 'PUBLISHED'" size="small" link @click="openEditSchema(row)">编辑</el-button>
            <el-button v-if="row.status === 'PUBLISHED'" size="small" link @click="state.copySchema(row)">复制版本</el-button>
            <el-button v-if="row.status !== 'PUBLISHED'" size="small" link @click="openTestDialog(row)">测试</el-button>
            <el-button v-if="row.status === 'TESTED'" size="small" link :loading="publishingKey === schemaKey(row)" @click="publishSchema(row)">发布</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row"><el-pagination v-model:current-page="schemaPage" :page-size="10" :total="schemaTotal" layout="total, prev, pager, next" @current-change="querySchema" /></div>
    </div>

    <el-dialog v-model="schemaVisible" :title="editingSchemaId ? '编辑 Schema 草稿' : '创建 Schema 草稿'" width="min(960px, 96vw)" :close-on-click-modal="false">
      <el-form :model="schemaForm" label-position="top" :disabled="creatingSchema || testing">
        <div class="form-grid">
          <el-form-item label="事件类型" required><el-input v-model="schemaForm.eventType" /></el-form-item>
          <el-form-item label="Schema 版本" required><el-input v-model="schemaForm.schemaVersion" /></el-form-item>
        </div>
        <div v-if="editingSchemaId" class="section-heading"><strong>字段列表</strong><el-button size="small" @click="addField">添加字段</el-button></div>
        <div v-for="(field, index) in (editingSchemaId ? schemaForm.fields : [])" :key="fieldKeys[index]" class="entry-row">
          <div class="entry-heading"><strong>字段 {{ index + 1 }} {{ field.id || '未保存' }}</strong><div><el-button type="primary" link :loading="creatingSchema" @click="state.saveField(index)">保存字段</el-button><el-button type="danger" link :disabled="creatingSchema" @click="removeField(index)">移除</el-button></div></div>
          <div class="form-grid three-columns">
            <el-form-item label="字段代码" required><el-input v-model="field.fieldName" /></el-form-item>
            <el-form-item label="显示名称" required><el-input v-model="field.displayName" /></el-form-item>
            <el-form-item label="数据类型" required><el-select v-model="field.dataType"><el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" /></el-select></el-form-item>
            <el-form-item label="是否必填"><el-switch v-model="field.required" /></el-form-item>
            <el-form-item label="父字段 ID"><el-input v-model="field.parentFieldId" /></el-form-item>
            <el-form-item label="值来源"><el-select v-model="field.valueSource"><el-option label="外部提供" value="EXTERNAL" /><el-option label="平台生成" value="PLATFORM" /></el-select></el-form-item>
            <template v-if="field.dataType === 'ARRAY'"><el-form-item label="数组元素类型"><el-select v-model="field.itemDataType" clearable><el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" /></el-select></el-form-item><el-form-item label="最少元素"><el-input-number v-model="field.minItems" :min="0" :precision="0" /></el-form-item><el-form-item label="最多元素"><el-input-number v-model="field.maxItems" :min="0" :precision="0" /></el-form-item></template>
            <template v-if="field.valueSource === 'PLATFORM'"><el-form-item label="生成器" required><el-select v-model="field.generatorCode" filterable><el-option v-for="g in state.generators.value" :key="g.code" :label="g.name + ' (' + g.code + ')'" :value="g.code" /></el-select></el-form-item><el-form-item label="生成器参数 JSON"><el-input :model-value="JSON.stringify(field.generatorConfig ?? {})" type="textarea" @change="updateGenerator(field, $event)" /></el-form-item></template>
            <template v-if="field.dataType === 'STRING'">
              <el-form-item label="最小长度"><el-input-number v-model="field.minLength" :min="0" :precision="0" controls-position="right" /></el-form-item>
              <el-form-item label="最大长度"><el-input-number v-model="field.maxLength" :min="0" :precision="0" controls-position="right" /></el-form-item>
              <el-form-item label="正则表达式"><el-input v-model="field.pattern" /></el-form-item>
            </template>
            <template v-if="field.dataType === 'INTEGER' || field.dataType === 'DECIMAL'">
              <el-form-item label="最小值"><el-input-number v-model="field.minimum" :precision="field.dataType === 'INTEGER' ? 0 : undefined" controls-position="right" /></el-form-item>
              <el-form-item label="最大值"><el-input-number v-model="field.maximum" :precision="field.dataType === 'INTEGER' ? 0 : undefined" controls-position="right" /></el-form-item>
              <el-form-item label="是否严格大于最小值"><el-switch v-model="field.exclusiveMinimum" /></el-form-item>
              <el-form-item label="是否严格小于最大值"><el-switch v-model="field.exclusiveMaximum" /></el-form-item>
              <el-form-item label="数值步长"><el-input-number v-model="field.multipleOf" :min="0" :precision="field.dataType === 'INTEGER' ? 0 : undefined" controls-position="right" /></el-form-item>
            </template>
            <el-form-item label="数据元代码"><el-input v-model="field.dataElementCode" /></el-form-item>
            <el-form-item label="值域代码"><el-input v-model="field.valueSetCode" /></el-form-item>
            <el-form-item label="值域版本"><el-input v-model="field.valueSetVersion" /></el-form-item>
            <el-form-item label="编码体系代码"><el-input v-model="field.codeSchemeCode" /></el-form-item>
            <el-form-item label="编码体系版本"><el-input v-model="field.codeSchemeVersion" /></el-form-item>
          </div>
          <el-form-item label="字段说明"><el-input v-model="field.description" type="textarea" :rows="2" /></el-form-item>
        </div>
        <el-alert v-if="draftTestResult" :type="draftTestResult.valid ? 'success' : 'error'" :closable="false" :title="draftTestResult.valid ? '草稿测试通过' : '草稿测试失败'">
          <div v-for="(error, index) in draftTestResult.errors" :key="index">{{ error }}</div>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="schemaVisible = false">取消</el-button>
        <el-button v-if="editingSchemaId" :loading="testingDraft" @click="testUnsavedSchema">测试已保存配置</el-button>
        <el-button type="primary" :loading="creatingSchema" @click="saveSchemaDraft">{{ editingSchemaId ? '保存基本信息' : '创建空草稿' }}</el-button>
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

    <el-drawer v-model="drawerVisible" title="Schema 内容" size="min(900px,94vw)" :close-on-click-modal="false">
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
import { onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { EventSchemaField } from '@/api/events';
function updateGenerator(field: EventSchemaField, text: string) { state.updateGenerator(field, text); }
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { useEventConfiguration } from '@/composables/useEventConfiguration';
const state = useEventConfiguration();
const { emptySchemaFilters, emptyEventFilters, queryForm, appliedSchemaFilters, eventFilters, appliedEventFilters, schemaPage, schemaTotal, eventPage, eventTotal, paramsFor, searchSchemas, searchEventTypes, resetEventTypes, schemas, eventTypes, querying, publishingKey, eventTypeVisible, editingEventTypeId, eventTypeLockVersion, eventTypeDetail, creatingEventType, eventTypeForm, schemaVisible, creatingSchema, testingDraft, draftTestResult, dataTypes, emptyField, emptyRule, schemaForm, editingSchemaId, editingLockVersion, fieldKeys, ruleKeys, nextRowKey, addField, addRule, removeField, removeRule, testVisible, testing, testForm, testResult, drawerVisible, selectedSchema, formattedSchema, schemaKey, openCreateEventType, viewEventType, editEventType, toggleEventType, upsertSchema, optionalText, numeric, normalizeField, normalizeRule, validateSchema, querySchema, resetQuery, loadEventTypes, createEventType, openSchemaDialog, openEditSchema, saveSchemaDraft, openTestDialog, testSchema, publishSchema, viewSchema, testUnsavedSchema } = state;
onMounted(() => { void querySchema(); });
</script>
<style scoped>
.query-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.panel {
  min-width: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.result-panel { margin-top: 12px; }
.query-bar > .el-input, .query-bar > .el-select { flex: 1 1 160px; min-width: 0; }
.query-bar > .el-button { margin-left: 0; }
.query-bar > .query-create { margin-left: auto; }

.panel-header {
  padding: 11px 14px;
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
  font-weight: 600;
}

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.three-columns { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.section-heading, .entry-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.section-heading { margin: 10px 0; }
.entry-row { padding: 12px 0; border-top: 1px solid var(--color-border); }
.entry-heading { margin-bottom: 8px; }
.entry-row :deep(.el-input-number), .entry-row :deep(.el-select) { width: 100%; }

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
  .query-bar, .form-grid, .three-columns { grid-template-columns: 1fr; }
}
</style>

