import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { governanceApi } from '@/api/governance';
import { standardsApi, type DataElement, type ValueSet, type ValueSetItem } from '@/api/standards';
import { apiErrorMessage } from '@/api/client';

export function useStandards() {
const standards = ref<any[]>([]);
const valueSets = ref<ValueSet[]>([]);
const elementsLoading = ref(false), valueSetsLoading = ref(false), itemsLoading = ref(false);
let elementRequests = 0, valueSetRequests = 0;
const selectedValueSet = ref<ValueSet | null>(null);
const onlyActiveItems = ref(false);
const editingElement = ref<DataElement | null>(null);
const editingValueSet = ref<ValueSet | null>(null);
const editingItem = ref<ValueSetItem | null>(null);
const valueSetModalVisible = ref(false);
const valueSetForm = ref({ valueSetCode: '', valueSetName: '', version: '1.0.0' });
const elementPage = ref(1), valuePage = ref(1), itemPage = ref(1);
const elementTotal = ref(0), valueTotal = ref(0), itemTotal = ref(0);
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
  securityClass: 'INTERNAL',
  maxLength: undefined as number | undefined, numericPrecision: undefined as number | undefined,
  numericScale: undefined as number | undefined, sourceReference: ''
});
const valueForm = ref({
  valueSet: '',
  code: '',
  name: '',
  validFrom: '', validTo: '', attributes: '{}'
});
const dataElements = ref<Array<DataElement & { code: string; name: string; type: string; valueSet: string }>>([]);
const valueSetItems = ref<Array<ValueSetItem & { code: string; name: string; valueSet: string }>>([]);
const activeValueSetItems = valueSetItems;
const reportError = (error: unknown) => { ElMessage.error(apiErrorMessage(error, '操作失败')); };
async function loadElements() {
  ++elementRequests;
  elementsLoading.value = true;
  try {
    const result = await standardsApi.dataElements({ ...queryParams(appliedElementFilters.value), page: elementPage.value, size: 10 });
    dataElements.value = (result.records || []).map(item => ({ ...item, code: item.elementCode, name: item.elementName, type: item.dataType, valueSet: item.valueSetCode || '' }));
    elementTotal.value = Number(result.total || 0);
  } catch (error) { reportError(error); } finally { elementsLoading.value = --elementRequests > 0; }
}
async function loadValueSets() {
  ++valueSetRequests;
  valueSetsLoading.value = true;
  try {
    const result = await standardsApi.valueSets({ ...queryParams(appliedValueFilters.value), page: valuePage.value, size: 10 });
    valueSets.value = result.records || [];
    valueTotal.value = Number(result.total || 0);
  } catch (error) { reportError(error); } finally { valueSetsLoading.value = --valueSetRequests > 0; }
}
async function loadItems() {
  if (!selectedValueSet.value) return;
  const current = ++itemsRevision;
  itemsLoading.value = true;
  try {
    const valueSet = selectedValueSet.value;
    const result = onlyActiveItems.value
      ? { records: await standardsApi.activeItems(valueSet.valueSetId), total: '' }
      : await standardsApi.items(valueSet.valueSetId, { ...queryParams(appliedItemFilters.value), page: itemPage.value, size: 10 });
    if (current !== itemsRevision || selectedValueSet.value?.valueSetId !== valueSet.valueSetId) return;
    valueSetItems.value = (result.records || []).map(item => ({ ...item, code: item.itemCode, name: item.itemName, valueSet: valueSet.valueSetCode }));
    itemTotal.value = onlyActiveItems.value ? result.records.length : Number(result.total || 0);
  } catch (error) { if (current === itemsRevision) reportError(error); } finally { if (current === itemsRevision) itemsLoading.value = false; }
}
let itemsRevision = 0;
function loadRemote() { void loadElements(); void loadValueSets(); if (selectedValueSet.value) void loadItems(); }
function selectValueSet(row: ValueSet | null) { selectedValueSet.value = row; activeValueSet.value = row?.valueSetCode || ''; itemPage.value = 1; itemTotal.value = 0; valueSetItems.value = []; if (row) void loadItems(); }
const openDataElementModal = () => { editElement(); };
async function editElement(row?: DataElement) {
  try {
    const detail = row ? await standardsApi.getDataElement(row.id) : undefined;
    editingElement.value = detail || null;
    elementForm.value = { code: detail?.elementCode || '', name: detail?.elementName || '', type: detail?.dataType || 'STRING', valueSet: detail?.valueSetCode || '', securityClass: detail?.securityClass || 'INTERNAL', maxLength: detail?.maxLength, numericPrecision: detail?.numericPrecision, numericScale: detail?.numericScale, sourceReference: detail?.sourceReference || '' };
    elementModalVisible.value = true;
  } catch (error) { reportError(error); }
}
const saveDataElement = async () => {
  const form = elementForm.value;
  if (!form.code.trim() || !form.name.trim()) return ElMessage.warning('请填写编码和名称');
  if (!/^[A-Z][A-Z0-9_-]*$/.test(form.code.trim())) return ElMessage.warning('数据元编码须以大写字母开头，仅含大写字母、数字、下划线或中划线');
  if (form.numericPrecision != null && form.numericScale != null && form.numericScale > form.numericPrecision) return ElMessage.warning('小数位数不能大于数值精度');
  try {
    const data = { elementName: form.name.trim(), dataType: form.type, securityClass: form.securityClass, valueSetCode: form.valueSet || undefined, maxLength: form.maxLength ?? undefined, numericPrecision: form.numericPrecision ?? undefined, numericScale: form.numericScale ?? undefined, sourceReference: form.sourceReference.trim() || undefined };
    if (editingElement.value) await standardsApi.updateDataElement(editingElement.value.id, { ...data, lockVersion: editingElement.value.lockVersion });
    else await standardsApi.createDataElement({ elementCode: form.code.trim(), ...data });
    elementModalVisible.value = false; await loadElements();
  } catch (error) { reportError(error); }
};
function openValueSetModal() { editValueSet(); }
async function editValueSet(row?: ValueSet) {
  try {
    const detail = row ? await standardsApi.getValueSet(row.valueSetId) : undefined;
    editingValueSet.value = detail || null;
    valueSetForm.value = detail ? { valueSetCode: detail.valueSetCode, valueSetName: detail.valueSetName, version: detail.version } : { valueSetCode: '', valueSetName: '', version: '1.0.0' };
    valueSetModalVisible.value = true;
  } catch (error) { reportError(error); }
}
async function saveValueSet() {
  const form = valueSetForm.value;
  if (!form.valueSetCode.trim() || !form.valueSetName.trim() || !form.version.trim()) return ElMessage.warning('请填写编码、名称和版本');
  try { if (editingValueSet.value) await standardsApi.updateValueSet(editingValueSet.value.valueSetId, form.valueSetName); else await standardsApi.createValueSet(form); valueSetModalVisible.value = false; await loadValueSets(); } catch (error) { reportError(error); }
}
async function toggleElement(row: DataElement) { try { await standardsApi.setDataElementStatus(row.id, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', row.lockVersion); await loadElements(); } catch (error) { reportError(error); } }
async function toggleValueSet(row: ValueSet) { try { await standardsApi.setValueSetStatus(row.valueSetId, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); await loadValueSets(); } catch (error) { reportError(error); } }
const openValueSetItemModal = () => { editItem(); };
async function editItem(row?: ValueSetItem) {
  const valueSet = selectedValueSet.value;
  if (!valueSet) return;
  try {
    const detail = row ? await standardsApi.getItem(valueSet.valueSetId, row.itemId) : undefined;
    editingItem.value = detail || null;
    valueForm.value = { valueSet: valueSet.valueSetCode, code: detail?.itemCode || '', name: detail?.itemName || '', validFrom: detail?.validFrom || '', validTo: detail?.validTo || '', attributes: JSON.stringify(detail?.attributes || {}, null, 2) };
    valueModalVisible.value = true;
  } catch (error) { reportError(error); }
}
const saveValueSetItem = async () => {
  const form = valueForm.value, id = selectedValueSet.value?.valueSetId;
  if (form.valueSet !== selectedValueSet.value?.valueSetCode) return ElMessage.warning('请先选择对应值域');
  if (!id || !form.code.trim() || !form.name.trim() || !form.validFrom) return ElMessage.warning('请选择值域并填写代码、名称和生效时间');
  try {
    const attributes = JSON.parse(form.attributes || '{}');
    if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) throw new Error('扩展属性须为 JSON 对象');
    if (form.validTo && form.validTo <= form.validFrom) throw new Error('失效时间须晚于生效时间');
    const data = { itemName: form.name.trim(), validFrom: form.validFrom, validTo: form.validTo || undefined, attributes };
    if (editingItem.value) await standardsApi.updateItem(id, editingItem.value.itemId, data);
    else await standardsApi.createItem(id, { itemCode: form.code.trim(), ...data });
    valueModalVisible.value = false; await loadItems();
  } catch (error) { reportError(error); }
};
async function toggleItem(row: ValueSetItem) { const id = selectedValueSet.value?.valueSetId; if (!id) return; try { await standardsApi.setItemStatus(id, row.itemId, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); await loadItems(); } catch (error) { reportError(error); } }
return { elementsLoading, valueSetsLoading, itemsLoading, standards, valueSets, selectedValueSet, onlyActiveItems, editingElement, editingValueSet, editingItem, valueSetModalVisible, valueSetForm, elementPage, valuePage, itemPage, elementTotal, valueTotal, itemTotal, elementModalVisible, valueModalVisible, dataTypes, securityClasses, emptyElementFilters, emptyValueFilters, emptyItemFilters, elementFilters, appliedElementFilters, valueFilters, appliedValueFilters, itemFilters, appliedItemFilters, queryParams, searchElements, resetElements, searchValueSets, resetValueSets, searchItems, resetItems, activeValueSet, elementForm, valueForm, dataElements, valueSetItems, activeValueSetItems, reportError, loadElements, loadValueSets, loadItems, loadRemote, selectValueSet, openDataElementModal, editElement, saveDataElement, openValueSetModal, editValueSet, saveValueSet, toggleElement, toggleValueSet, openValueSetItemModal, editItem, saveValueSetItem, toggleItem };
}
