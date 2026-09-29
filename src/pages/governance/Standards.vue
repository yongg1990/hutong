<template>
  <div class="governance-page">
    <PageHeader
      title="数据元与值域标准"
      subtitle="全平台统一中药追溯数据字典、国家中药标准规范集与 Code/Name 代码表管理"
    >
      <template #actions>
        <el-button @click="loadRemote">刷新</el-button>
        <el-button @click="openDataElementModal">新增数据元</el-button>
        <el-button @click="openValueSetModal">新增值域</el-button>
        <el-button type="primary" :disabled="!selectedValueSet" @click="openValueSetItemModal">新增代码项</el-button>
      </template>
    </PageHeader>
    <el-alert v-if="loadError" type="error" :closable="false" :title="loadError" style="margin-bottom: 12px" />

    <!-- Standards Overview Cards -->
    <div class="panel" style="margin-bottom: 14px">
      <div class="panel-header flex-between"><h2>值域定义</h2></div>
      <FilterBar @search="searchValueSets" @reset="resetValueSets">
        <el-input v-model="valueFilters.valueSetCode" placeholder="值域编码" clearable style="width: 150px" />
        <el-input v-model="valueFilters.valueSetName" placeholder="值域名称" clearable style="width: 150px" />
        <el-input v-model="valueFilters.version" placeholder="版本" clearable style="width: 110px" />
        <el-select v-model="valueFilters.status" placeholder="状态" clearable style="width: 110px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select>
      </FilterBar>
      <el-table :data="valueSets" highlight-current-row @current-change="selectValueSet">
        <el-table-column prop="valueSetCode" label="编码" min-width="160" />
        <el-table-column prop="valueSetName" label="名称" min-width="160" />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column label="操作" width="130"><template #default="{ row }"><el-button link @click.stop="editValueSet(row)">编辑</el-button><el-button link @click.stop="toggleValueSet(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button></template></el-table-column>
      </el-table>
      <el-pagination v-model:current-page="valuePage" :page-size="20" :total="valueTotal" layout="total, prev, pager, next" @current-change="loadValueSets" />
    </div>
    <div class="standards-banner">
      <div v-for="std in standards" :key="std.code" class="std-card">
        <div class="std-badge">国家标准</div>
        <div class="std-name">{{ std.name }}</div>
        <div class="std-meta">
          <span>代码: <strong class="mono">{{ std.code }}</strong></span>
          <span>版本: {{ std.version }}</span>
          <span v-if="std.mandatoryLength">编码长度: {{ std.mandatoryLength }}位</span>
        </div>
      </div>
    </div>

    <div class="grid-two">
      <div class="panel">
        <div class="panel-header flex-between">
          <h2>数据元目录 (Data Elements)</h2>
        </div>
        <FilterBar @search="searchElements" @reset="resetElements">
          <el-input v-model="elementFilters.elementCode" placeholder="数据元编码" clearable style="width: 150px" />
          <el-input v-model="elementFilters.elementName" placeholder="数据元名称" clearable style="width: 150px" />
          <el-select v-model="elementFilters.dataType" placeholder="数据类型" clearable style="width: 130px"><el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" /></el-select>
          <el-input v-model="elementFilters.valueSetCode" placeholder="关联值域编码" clearable style="width: 150px" />
          <el-select v-model="elementFilters.securityClass" placeholder="安全级别" clearable style="width: 140px"><el-option v-for="item in securityClasses" :key="item" :label="item" :value="item" /></el-select>
          <el-select v-model="elementFilters.status" placeholder="状态" clearable style="width: 110px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select>
        </FilterBar>
        <el-table
          :data="dataElements"
          style="width: 100%"
        >
          <el-table-column prop="code" label="数据元编码 *" width="180" class-name="mono" />
          <el-table-column prop="name" label="中文名称 *" min-width="140" />
          <el-table-column prop="type" label="类型 *" width="80" />
          <el-table-column prop="valueSet" label="关联值域 *" min-width="150" class-name="mono" />
          <el-table-column label="操作" width="130"><template #default="{ row }"><el-button link @click.stop="editElement(row)">编辑</el-button><el-button link @click.stop="toggleElement(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button></template></el-table-column>
        </el-table>
        <el-pagination v-model:current-page="elementPage" :page-size="20" :total="elementTotal" layout="total, prev, pager, next" @current-change="loadElements" />
      </div>

      <div class="panel">
        <div class="panel-header flex-between">
          <h2>
            <span>值域明细: </span>
            <strong class="mono">{{ activeValueSet || '全部值域' }}</strong>
          </h2>
          <el-tag size="small" type="success">{{ itemTotal }} 个代码项</el-tag>
        </div>
        <FilterBar v-if="selectedValueSet" @search="searchItems" @reset="resetItems">
          <el-input v-model="itemFilters.itemCode" placeholder="代码项编码" clearable style="width: 140px" />
          <el-input v-model="itemFilters.itemName" placeholder="代码项名称" clearable style="width: 140px" />
          <el-select v-model="itemFilters.status" placeholder="状态" clearable style="width: 110px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select>
          <el-date-picker v-model="itemFilters.effectiveAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="生效时间" style="width: 185px" />
        </FilterBar>
        <el-table :data="activeValueSetItems">
          <template #empty>请选择值域</template>
          <el-table-column prop="code" label="代码 (Code) *" width="140" class-name="mono" />
          <el-table-column prop="name" label="名称 (Name) *" min-width="140" />
          <el-table-column prop="valueSet" label="所属值域 *" width="160" class-name="mono" />
          <el-table-column label="状态 *" width="90">
            <template #default="{ row }"><StatusTag :code="row.status" /></template>
          </el-table-column>
          <el-table-column label="操作" width="130"><template #default="{ row }"><el-button link @click="editItem(row)">编辑</el-button><el-button link @click="toggleItem(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button></template></el-table-column>
        </el-table>
        <el-pagination v-if="selectedValueSet" v-model:current-page="itemPage" :page-size="20" :total="itemTotal" layout="total, prev, pager, next" @current-change="loadItems" />
      </div>
    </div>

    <!-- New Data Element Dialog -->
    <el-dialog v-model="elementModalVisible" :title="editingElement ? '编辑数据元' : '新增数据元'" width="520px" :close-on-click-modal="false">
      <el-form :model="elementForm" label-position="top">
        <el-form-item label="数据元编码 (DE_CODE)" required>
          <el-input v-model="elementForm.code" placeholder="如: DE_HERB_WATER_CONTENT" />
        </el-form-item>
        <el-form-item label="中文名称" required>
          <el-input v-model="elementForm.name" placeholder="如: 水分含量(%)" />
        </el-form-item>
        <el-form-item label="数据类型" required>
          <el-select v-model="elementForm.type" style="width: 100%">
            <el-option v-for="type in ['STRING', 'DECIMAL', 'INTEGER', 'BOOLEAN', 'DATE', 'DATETIME', 'OBJECT', 'ARRAY']" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联值域代码集 (ValueSet)">
          <el-input v-model="elementForm.valueSet" placeholder="如: VS_WATER_TEST_METHOD 或留空" />
        </el-form-item>
        <el-form-item label="安全级别" required><el-select v-model="elementForm.securityClass" style="width: 100%"><el-option v-for="item in ['PUBLIC', 'INTERNAL', 'SENSITIVE', 'STRICT_SENSITIVE']" :key="item" :label="item" :value="item" /></el-select></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="elementModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDataElement">确认保存</el-button>
      </template>
    </el-dialog>

    <!-- New Value Item Dialog -->
    <el-dialog v-model="valueSetModalVisible" :title="editingValueSet ? '编辑值域' : '新增值域'" width="480px">
      <el-form :model="valueSetForm" label-position="top">
        <el-form-item label="值域编码" required><el-input v-model="valueSetForm.valueSetCode" :disabled="!!editingValueSet" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="valueSetForm.valueSetName" /></el-form-item>
        <el-form-item label="版本" required><el-input v-model="valueSetForm.version" :disabled="!!editingValueSet" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="valueSetModalVisible = false">取消</el-button><el-button type="primary" @click="saveValueSet">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="valueModalVisible" :title="editingItem ? '编辑代码项' : '新增代码项'" width="480px" :close-on-click-modal="false">
      <el-form :model="valueForm" label-position="top">
        <el-form-item label="所属值域集 (ValueSet)" required>
          <el-input v-model="valueForm.valueSet" disabled />
        </el-form-item>
        <el-form-item label="代码 (Code)" required>
          <el-input v-model="valueForm.code" placeholder="如: QUALIFIED" />
        </el-form-item>
        <el-form-item label="中文名称 (Name)" required>
          <el-input v-model="valueForm.name" placeholder="如: 合格" />
        </el-form-item>
        <el-form-item label="生效时间" required><el-date-picker v-model="valueForm.validFrom" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item>
        <el-form-item label="失效时间"><el-date-picker v-model="valueForm.validTo" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="valueModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveValueSetItem">保存代码项</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { governanceApi } from '@/api/governance';
import { standardsApi, type DataElement, type ValueSet, type ValueSetItem } from '@/api/standards';
import { apiErrorMessage } from '@/api/client';

const standards = ref<any[]>([]);
const valueSets = ref<ValueSet[]>([]);
const selectedValueSet = ref<ValueSet | null>(null);
const editingElement = ref<DataElement | null>(null);
const editingValueSet = ref<ValueSet | null>(null);
const editingItem = ref<ValueSetItem | null>(null);
const valueSetModalVisible = ref(false);
const valueSetForm = ref({ valueSetCode: '', valueSetName: '', version: '1.0.0' });
const elementPage = ref(1), valuePage = ref(1), itemPage = ref(1);
const elementTotal = ref(0), valueTotal = ref(0), itemTotal = ref(0);
const loadError = ref('');
const elementModalVisible = ref(false);
const valueModalVisible = ref(false);
const dataTypes = ['STRING', 'DECIMAL', 'INTEGER', 'BOOLEAN', 'DATE', 'DATETIME', 'OBJECT', 'ARRAY'];
const securityClasses = ['PUBLIC', 'INTERNAL', 'SENSITIVE', 'STRICT_SENSITIVE'];
const emptyElementFilters = () => ({ elementCode: '', elementName: '', dataType: '', valueSetCode: '', securityClass: '', status: '' });
const emptyValueFilters = () => ({ valueSetCode: '', valueSetName: '', version: '', status: '' });
const emptyItemFilters = () => ({ itemCode: '', itemName: '', status: '', effectiveAt: '' });
const elementFilters = ref(emptyElementFilters()), appliedElementFilters = ref(emptyElementFilters());
const valueFilters = ref(emptyValueFilters()), appliedValueFilters = ref(emptyValueFilters());
const itemFilters = ref(emptyItemFilters()), appliedItemFilters = ref(emptyItemFilters());
const queryParams = (values: Record<string, string>) => Object.fromEntries(Object.entries(values).filter(([, value]) => value?.trim()).map(([key, value]) => [key, value.trim()]));
const searchElements = () => { appliedElementFilters.value = { ...elementFilters.value }; elementPage.value = 1; void loadElements(); };
const resetElements = () => { elementFilters.value = emptyElementFilters(); appliedElementFilters.value = emptyElementFilters(); elementPage.value = 1; void loadElements(); };
const searchValueSets = () => { appliedValueFilters.value = { ...valueFilters.value }; valuePage.value = 1; void loadValueSets(); };
const resetValueSets = () => { valueFilters.value = emptyValueFilters(); appliedValueFilters.value = emptyValueFilters(); valuePage.value = 1; void loadValueSets(); };
const searchItems = () => { appliedItemFilters.value = { ...itemFilters.value }; itemPage.value = 1; void loadItems(); };
const resetItems = () => { itemFilters.value = emptyItemFilters(); appliedItemFilters.value = emptyItemFilters(); itemPage.value = 1; void loadItems(); };
const activeValueSet = ref<string>('');

const elementForm = ref({
  code: '',
  name: '',
  type: 'STRING',
  valueSet: '',
  securityClass: 'INTERNAL'
});

const valueForm = ref({
  valueSet: '',
  code: '',
  name: '',
  validFrom: '', validTo: ''
});

const dataElements = ref<Array<DataElement & { code: string; name: string; type: string; valueSet: string }>>([]);
const valueSetItems = ref<Array<ValueSetItem & { code: string; name: string; valueSet: string }>>([]);


const activeValueSetItems = valueSetItems;

const reportError = (error: unknown) => { loadError.value = apiErrorMessage(error, '操作失败'); ElMessage.error(loadError.value); };

async function loadElements() {
  try {
    const result = await standardsApi.dataElements({ ...queryParams(appliedElementFilters.value), page: elementPage.value, size: 20 });
    dataElements.value = (result.records || []).map(item => ({ ...item, code: item.elementCode, name: item.elementName, type: item.dataType, valueSet: item.valueSetCode || '' }));
    elementTotal.value = Number(result.total || 0);
  } catch (error) { reportError(error); }
}
async function loadValueSets() {
  try {
    const result = await standardsApi.valueSets({ ...queryParams(appliedValueFilters.value), page: valuePage.value, size: 20 });
    valueSets.value = result.records || [];
    valueTotal.value = Number(result.total || 0);
  } catch (error) { reportError(error); }
}
async function loadItems() {
  if (!selectedValueSet.value) return;
  try {
    const result = await standardsApi.items(selectedValueSet.value.valueSetId, { ...queryParams(appliedItemFilters.value), page: itemPage.value, size: 20 });
    valueSetItems.value = (result.records || []).map(item => ({ ...item, code: item.itemCode, name: item.itemName, valueSet: selectedValueSet.value!.valueSetCode }));
    itemTotal.value = Number(result.total || 0);
  } catch (error) { reportError(error); }
}
function loadRemote() { loadError.value = ''; void loadElements(); void loadValueSets(); if (selectedValueSet.value) void loadItems(); }
onMounted(async () => { standards.value = await governanceApi.getStandards(); loadRemote(); });
function selectValueSet(row: ValueSet | null) { selectedValueSet.value = row; activeValueSet.value = row?.valueSetCode || ''; itemPage.value = 1; itemTotal.value = 0; valueSetItems.value = []; if (row) void loadItems(); }


const openDataElementModal = () => { editElement(); };
function editElement(row?: DataElement) {
  editingElement.value = row || null;
  elementForm.value = { code: row?.elementCode || '', name: row?.elementName || '', type: row?.dataType || 'STRING', valueSet: row?.valueSetCode || '', securityClass: row?.securityClass || 'INTERNAL' };
  elementModalVisible.value = true;
}

const saveDataElement = async () => {
  const form = elementForm.value;
  if (!form.code.trim() || !form.name.trim()) return ElMessage.warning('请填写编码和名称');
  try {
    if (editingElement.value) await standardsApi.updateDataElement(editingElement.value.id, { elementName: form.name, dataType: form.type, securityClass: form.securityClass, valueSetCode: form.valueSet || undefined, lockVersion: editingElement.value.lockVersion });
    else await standardsApi.createDataElement({ elementCode: form.code, elementName: form.name, dataType: form.type, securityClass: form.securityClass, valueSetCode: form.valueSet || undefined });
    elementModalVisible.value = false; await loadElements();
  } catch (error) { reportError(error); }
};
function openValueSetModal() { editValueSet(); }
function editValueSet(row?: ValueSet) { editingValueSet.value = row || null; valueSetForm.value = row ? { valueSetCode: row.valueSetCode, valueSetName: row.valueSetName, version: row.version } : { valueSetCode: '', valueSetName: '', version: '1.0.0' }; valueSetModalVisible.value = true; }
async function saveValueSet() {
  const form = valueSetForm.value;
  if (!form.valueSetCode.trim() || !form.valueSetName.trim() || !form.version.trim()) return ElMessage.warning('请填写编码、名称和版本');
  try { if (editingValueSet.value) await standardsApi.updateValueSet(editingValueSet.value.valueSetId, form.valueSetName); else await standardsApi.createValueSet(form); valueSetModalVisible.value = false; await loadValueSets(); } catch (error) { reportError(error); }
}
async function toggleElement(row: DataElement) { try { await standardsApi.setDataElementStatus(row.id, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); await loadElements(); } catch (error) { reportError(error); } }
async function toggleValueSet(row: ValueSet) { try { await standardsApi.setValueSetStatus(row.valueSetId, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); await loadValueSets(); } catch (error) { reportError(error); } }

const openValueSetItemModal = () => { editItem(); };
function editItem(row?: ValueSetItem) {
  editingItem.value = row || null;
  valueForm.value = { valueSet: selectedValueSet.value?.valueSetCode || '', code: row?.itemCode || '', name: row?.itemName || '', validFrom: row?.validFrom || '', validTo: row?.validTo || '' };
  valueModalVisible.value = true;
}

const saveValueSetItem = async () => {
  const form = valueForm.value, id = selectedValueSet.value?.valueSetId;
  if (form.valueSet !== selectedValueSet.value?.valueSetCode) return ElMessage.warning('请先选择对应值域');
  if (!id || !form.code.trim() || !form.name.trim() || !form.validFrom) return ElMessage.warning('请选择值域并填写代码、名称和生效时间');
  try {
    if (editingItem.value) await standardsApi.updateItem(id, editingItem.value.itemId, { itemName: form.name, validFrom: form.validFrom, validTo: form.validTo || undefined });
    else await standardsApi.createItem(id, { itemCode: form.code, itemName: form.name, validFrom: form.validFrom });
    valueModalVisible.value = false; await loadItems();
  } catch (error) { reportError(error); }
};
async function toggleItem(row: ValueSetItem) { const id = selectedValueSet.value?.valueSetId; if (!id) return; try { await standardsApi.setItemStatus(id, row.itemId, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); await loadItems(); } catch (error) { reportError(error); } }
</script>

<style scoped>
.standards-banner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.std-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px 14px;
  position: relative;
}

.std-badge {
  display: inline-block;
  font-size: 10px;
  background: #e8f4ec;
  color: var(--color-primary);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  margin-bottom: 6px;
}

.std-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.std-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--color-muted);
}

.grid-two {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 14px;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  font-size: 15px;
  margin: 0;
  font-weight: 600;
}
</style>
