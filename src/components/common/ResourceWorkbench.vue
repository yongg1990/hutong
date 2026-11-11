<template>
  <div>
    <div v-if="$slots.actions" class="resource-actions query-surface"><slot name="actions" /></div>
    <FilterBar @search="search" @reset="reset">
      <template v-for="filter in filters" :key="filter.key">
        <ResourceOptionSelect v-if="optionKind(filter.key)" v-model="query[filter.key]" :kind="optionKind(filter.key)" :placeholder="filter.label" :tenant-id="['sourceSystemId', 'targetSourceSystemId'].includes(filter.key) ? query.tenantId : undefined" :value-set-id="filter.key === 'standardItemId' ? query.valueSetId : undefined" :context="['status', 'processingStatus'].includes(filter.key) ? statusContext : undefined" @change="clearDependentOptions(query, filter.key)" />
        <el-select v-else-if="filter.options" v-model="query[filter.key]" :placeholder="filter.label" clearable><el-option v-for="option in filter.options" :key="option" :label="enumLabel(option)" :value="option" /></el-select>
        <el-date-picker v-else-if="filter.type === 'date'" v-model="query[filter.key]" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" :placeholder="filter.label" />
        <el-input v-else v-model="query[filter.key]" :placeholder="filter.label" clearable />
      </template>
      <template #actions><slot name="filter-actions" /><el-button v-if="fields.length" :icon="Plus" type="primary" @click="openEditor()">新增</el-button></template>
    </FilterBar>
    <div class="table-surface">
      <component :is="paginated ? ElTable : LocalPaginatedTable" :data="rows" v-loading="loading" empty-text="暂无记录">
        <el-table-column v-for="column in columns" :key="column.key" :prop="column.key" :label="column.label" :min-width="column.width || 150" show-overflow-tooltip><template #default="{ row }">{{ format(row[column.key]) }}</template></el-table-column>
        <el-table-column v-if="detailPath || editable || replayPath || deletePath || $slots['row-actions']" label="操作" width="240" fixed="right"><template #default="{ row }">
          <el-button v-if="detailPath" link type="primary" @click="view(row)">详情</el-button>
          <el-button v-if="editable && (!editStatuses.length || editStatuses.includes(row.status))" link @click="openEditor(row)">编辑</el-button>
          <el-button v-if="replayPath" link @click="openReplay(row)">重放</el-button>
          <el-button v-if="deletePath" link type="danger" @click="remove(row)">删除</el-button>
          <slot name="row-actions" :row="row" />
        </template></el-table-column>
      </component>
      <div v-if="paginated" class="pagination-row"><el-pagination v-model:current-page="page" :total="total" :page-size="10" layout="total, prev, pager, next" @current-change="load" /></div>
    </div>
    <el-dialog v-model="editorVisible" :title="editingId ? '编辑记录' : createLabel" width="min(640px, 94vw)" :close-on-click-modal="false">
      <el-form label-position="top"><el-form-item v-for="field in fields" :key="field.key" :label="field.label" :required="field.required">
        <ResourceOptionSelect v-if="optionKind(field.key)" v-model="form[field.key]" :kind="optionKind(field.key)" :placeholder="field.label" :tenant-id="['sourceSystemId', 'targetSourceSystemId'].includes(field.key) ? form.tenantId || applied.tenantId : undefined" :value-set-id="field.key === 'standardItemId' ? form.valueSetId || applied.valueSetId : undefined" :disabled="!!editingId && field.immutable" @change="clearDependentOptions(form, field.key)" />
        <el-switch v-else-if="field.type === 'boolean'" v-model="form[field.key]" />
        <el-select v-else-if="field.options" v-model="form[field.key]" :disabled="!!editingId && field.immutable"><el-option v-for="option in field.options" :key="option" :label="enumLabel(option)" :value="option" /></el-select>
        <JsonEditor v-else-if="field.type === 'json'" v-model="form[field.key]" :rows="5" :label="field.label" />
        <el-input-number v-else-if="field.type === 'number' || field.type === 'decimal'" v-model="form[field.key]" :min="field.min" :precision="field.type === 'number' ? 0 : undefined" />
        <el-input v-else v-model="form[field.key]" :disabled="!!editingId && field.immutable" />
      </el-form-item></el-form>
      <template #footer><el-button @click="editorVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="replayVisible" title="重放治理记录" width="min(480px, 94vw)"><el-form label-position="top"><el-form-item label="映射版本"><el-input v-model="mappingVersion" /></el-form-item><el-form-item label="重放原因" required><el-input v-model="reason" type="textarea" /></el-form-item></el-form><template #footer><el-button @click="replayVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="replay">提交重放</el-button></template></el-dialog>
    <el-drawer v-model="detailVisible" title="记录详情" size="min(760px, 94vw)"><el-descriptions :column="1" border><el-descriptions-item v-for="(value, key) in detail" :key="key" :label="String(key)"><pre>{{ format(value) }}</pre></el-descriptions-item></el-descriptions></el-drawer>
  </div>
</template>
<script setup lang="ts">
import { enumLabel } from '@/utils/enumLabels';
import { computed, onMounted, ref } from 'vue';
import ResourceOptionSelect from '@/components/common/ResourceOptionSelect.vue';
import LocalPaginatedTable from '@/components/common/LocalPaginatedTable.vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, ElTable } from 'element-plus';
import FilterBar from '@/components/common/FilterBar.vue';
import JsonEditor from '@/components/common/JsonEditor.vue';
import { request, apiErrorMessage } from '@/api/client';
interface Field { key: string; label: string; type?: string; options?: string[]; required?: boolean; initial?: string | number | boolean; immutable?: boolean; width?: number; min?: number }
const props = withDefaults(defineProps<{
  listPath: string; columns: Field[]; filters?: Field[]; fields?: Field[]; detailPath?: string;
  savePath?: string; updatePath?: string; replayPath?: string; deletePath?: string; idKey?: string; editable?: boolean;
  requiredFilters?: string[]; createLabel?: string; immediate?: boolean; paginated?: boolean; updateMethod?: 'POST' | 'PUT'; editStatuses?: string[]; normalizePayload?: (body: Record<string, any>) => Record<string, any>;
}>(), { filters: () => [], fields: () => [], requiredFilters: () => [], idKey: 'id', createLabel: '新增', immediate: true, paginated: true, updateMethod: 'POST', editStatuses: () => [] });
const query = ref<Record<string, string>>({}), applied = ref<Record<string, string>>({});
const statusContext = computed(() => Object.fromEntries(Object.entries(query.value).filter(([key]) => ['tenantId', 'projectSpaceId', 'sourceSystemId'].includes(key))));
function clearDependentOptions(state: Record<string, any>, key: string) {
  if (key === 'tenantId') { state.sourceSystemId = ''; state.targetSourceSystemId = ''; }
  if (key === 'valueSetId') state.standardItemId = '';
}
function optionKind(key: string) {
  if (['tenantId', 'projectSpaceId', 'sourceSystemId', 'targetSourceSystemId', 'valueSetId', 'standardItemId', 'templateType'].includes(key)) return key;
  if (key === 'processingStatus') return 'eventStatus';
  if (key === 'status' && props.listPath === '/openapi/v1/raw-records') return 'rawStatus';
  return '';
}
let revision = 0;
const queryParams = () => ({ ...(props.filters.some(filter => filter.key === 'limit') ? { limit: '10' } : {}), ...Object.fromEntries(Object.entries(applied.value).filter(([key]) => !props.listPath.includes(`{${key}}`))) });
const rows = ref<Record<string, any>[]>([]), total = ref(0), page = ref(1), loading = ref(false), saving = ref(false);
const editorVisible = ref(false), editingId = ref(''), form = ref<Record<string, any>>({});
const detailVisible = ref(false), detail = ref<Record<string, any>>({});
const replayVisible = ref(false), replayId = ref(''), mappingVersion = ref(''), reason = ref('');
const format = (value: unknown) => typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '-');
function resolve(template: string, id = '') { return template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(key === 'id' ? id : applied.value[key] || '')); }
function search() { applied.value = Object.fromEntries(Object.entries(query.value).filter(([, value]) => value).map(([key, value]) => [key, value.trim()])); page.value = 1; void load(); }
function reset() { ++revision; loading.value = false; query.value = {}; applied.value = {}; page.value = 1; rows.value = []; total.value = 0; if (!props.requiredFilters.length) void load(); }
async function load() {
  if (props.requiredFilters.some(key => !applied.value[key])) { ElMessage.warning('请先填写查询范围'); return; }
  const current = ++revision;
  loading.value = true;
  try { const result: any = await request.get(resolve(props.listPath), { params: { ...queryParams(), ...(props.paginated ? { page: String(page.value), size: '10' } : {}) } }); if (current !== revision) return; rows.value = Array.isArray(result) ? result : result.records || []; total.value = Number(result.total ?? rows.value.length); }
  catch (error) { if (current === revision) { rows.value = []; total.value = 0; ElMessage.error(apiErrorMessage(error, '查询失败')); } }
  finally { if (current === revision) loading.value = false; }
}
const tenantParams = (row: Record<string, any>) => ({ tenantId: applied.value.tenantId || row.tenantId || undefined });
async function view(row: Record<string, any>) { try { detail.value = await request.get(resolve(props.detailPath!, String(row[props.idKey])), { params: tenantParams(row) }); detailVisible.value = true; } catch (error) { ElMessage.error(apiErrorMessage(error, '详情查询失败')); } }
async function openEditor(row?: Record<string, any>) {
  if (props.requiredFilters.some(key => !applied.value[key])) { ElMessage.warning('请先查询所需范围'); return; }
  if (row && props.detailPath) { try { row = await request.get(resolve(props.detailPath, String(row[props.idKey])), { params: tenantParams(row) }); } catch (error) { ElMessage.error(apiErrorMessage(error, '加载编辑详情失败')); return; } }
  if (row && props.editStatuses.length && !props.editStatuses.includes(row.status)) return ElMessage.warning('当前状态不允许编辑');
  editingId.value = row ? String(row[props.idKey]) : '';
  form.value = Object.fromEntries(props.fields.map(field => {
    const value = row?.[field.key] ?? applied.value[field.key] ?? field.initial;
    return [field.key, field.type === 'json' ? (typeof value === 'string' ? value : JSON.stringify(value ?? null, null, 2)) : ['number', 'decimal'].includes(field.type || '') ? (value == null || value === '' ? undefined : Number(value)) : field.type === 'boolean' ? Boolean(value ?? false) : value ?? ''];
  })); editorVisible.value = true;
}
async function save() {
  if (saving.value) return;
  if (props.fields.some(field => field.required && !String(form.value[field.key] ?? '').trim())) { ElMessage.warning('请填写必填项'); return; }
  saving.value = true;
  try { const body = Object.fromEntries(props.fields.filter(field => field.required || (form.value[field.key] !== '' && form.value[field.key] != null)).map(field => [field.key, field.type === 'json' ? JSON.parse(form.value[field.key]) : form.value[field.key]])); const payload = props.normalizePayload ? props.normalizePayload(body) : body; const path = resolve(editingId.value ? props.updatePath || `${props.savePath || props.listPath}/{id}` : props.savePath || props.listPath, editingId.value); await request.request({ method: editingId.value ? props.updateMethod : 'POST', url: path, data: payload }); editorVisible.value = false; ElMessage.success('保存成功'); await load(); }
  catch (error) { ElMessage.error(apiErrorMessage(error, '保存失败')); }
  finally { saving.value = false; }
}
async function remove(row: Record<string, any>) { try { await ElMessageBox.confirm('确认删除该记录？', '删除记录', { type: 'warning' }); await request.get(resolve(props.deletePath!, String(row[props.idKey]))); await load(); } catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(apiErrorMessage(error, '删除失败')); } }
function openReplay(row: Record<string, any>) { replayId.value = String(row[props.idKey]); reason.value = ''; mappingVersion.value = ''; replayVisible.value = true; }
async function replay() { if (!reason.value.trim()) { ElMessage.warning('请填写重放原因'); return; } saving.value = true; try { detail.value = await request.post(resolve(props.replayPath!, replayId.value), undefined, { params: { reason: reason.value.trim(), mappingVersion: mappingVersion.value || undefined } }); replayVisible.value = false; detailVisible.value = true; await load(); } catch (error) { ElMessage.error(apiErrorMessage(error, '重放失败')); } finally { saving.value = false; } }
onMounted(() => { if (props.immediate && !props.requiredFilters.length) void load(); });
defineExpose({ load });
</script>
<style scoped>
.resource-actions{display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px;flex-wrap:wrap}.pagination-row{display:flex;justify-content:flex-end;margin:14px 0} :deep(.filter-bar .el-input),:deep(.filter-bar .el-select){width:190px} pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}.el-form .el-select{width:100%}
</style>
