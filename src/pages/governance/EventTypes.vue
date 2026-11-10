<template>
<div>
<PageHeader title="事件类型管理" />
    <div class="query-table-section result-panel">
      <FilterBar @search="searchEventTypes" @reset="resetEventTypes">
        <el-input v-model="eventFilters.eventType" placeholder="事件类型代码" clearable style="width: 180px" />
        <el-input v-model="eventFilters.scenarioCode" placeholder="场景代码" clearable style="width: 160px" />
        <el-select v-model="eventFilters.status" placeholder="状态" clearable style="width: 140px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select>
        <template #actions><el-button type="primary" @click="openCreateEventType"><el-icon><Plus /></el-icon>新增</el-button></template>
      </FilterBar>
      <div class="table-surface">
        <el-table :data="eventTypes" v-loading="state.eventTypesLoading.value" empty-text="暂无事件类型">
          <el-table-column prop="id" label="定义 ID" width="220" class-name="mono" show-overflow-tooltip />
          <el-table-column prop="eventType" label="事件类型" min-width="180" class-name="mono" />
          <el-table-column prop="eventName" label="名称" min-width="180" />
          <el-table-column prop="scenarioCode" label="场景代码" min-width="160" class-name="mono" />
          <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
          <el-table-column prop="lockVersion" label="锁版本" width="90" />
          <el-table-column prop="updatedAt" label="更新时间" width="175" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }"><StatusTag :code="row.status" /></template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right"><template #default="{ row }">
            <el-button link @click="viewEventType(row)">详情</el-button><el-button link @click="editEventType(row)">编辑</el-button>
            <el-button link @click="toggleEventType(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button>
          </template></el-table-column>
        </el-table>
        <div class="pagination-row"><el-pagination v-model:current-page="eventPage" :page-size="10" :total="eventTotal" layout="total, prev, pager, next" @current-change="loadEventTypes" /></div>
      </div>
    </div>
    <el-dialog :model-value="!!eventTypeDetail" title="事件类型详情" width="640px" @close="eventTypeDetail = null">
      <el-descriptions v-if="eventTypeDetail" :column="1" border><el-descriptions-item v-for="(value, key) in eventTypeDetail" :key="key" :label="String(key)">{{ value ?? '-' }}</el-descriptions-item></el-descriptions>
    </el-dialog>

    <el-dialog v-model="eventTypeVisible" :title="editingEventTypeId ? '编辑事件类型' : '创建事件类型'" width="520px" :close-on-click-modal="false">
      <el-form :model="eventTypeForm" label-position="top">
        <el-form-item label="事件类型代码" required><el-input v-model="eventTypeForm.eventType" :disabled="!!editingEventTypeId" maxlength="128" /></el-form-item>
        <el-form-item label="事件类型名称" required><el-input v-model="eventTypeForm.eventName" /></el-form-item>
        <el-form-item label="场景代码" required><el-input v-model="eventTypeForm.scenarioCode" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="eventTypeForm.description" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="eventTypeVisible = false">取消</el-button>
        <el-button type="primary" :loading="creatingEventType" @click="createEventType">保存</el-button>
      </template>
    </el-dialog>


</div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { useEventConfiguration } from '@/composables/useEventConfiguration';
const state = useEventConfiguration();
const { emptySchemaFilters, emptyEventFilters, queryForm, appliedSchemaFilters, eventFilters, appliedEventFilters, schemaPage, schemaTotal, eventPage, eventTotal, paramsFor, searchSchemas, searchEventTypes, resetEventTypes, schemas, eventTypes, querying, publishingKey, eventTypeVisible, editingEventTypeId, eventTypeLockVersion, eventTypeDetail, creatingEventType, eventTypeForm, schemaVisible, creatingSchema, testingDraft, draftTestResult, dataTypes, emptyField, emptyRule, schemaForm, editingSchemaId, editingLockVersion, fieldKeys, ruleKeys, nextRowKey, addField, addRule, removeField, removeRule, testVisible, testing, testForm, testResult, drawerVisible, selectedSchema, formattedSchema, schemaKey, openCreateEventType, viewEventType, editEventType, toggleEventType, upsertSchema, optionalText, numeric, normalizeField, normalizeRule, validateSchema, querySchema, resetQuery, loadEventTypes, createEventType, openSchemaDialog, openEditSchema, saveSchemaDraft, openTestDialog, testSchema, publishSchema, viewSchema, testUnsavedSchema } = state;
onMounted(() => { void loadEventTypes(); });
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

