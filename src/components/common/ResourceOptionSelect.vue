<template>
  <ApiOptionSelect :model-value="modelValue || ''" :loader="loadOptions" value-key="value" :label="optionLabel"
    :placeholder="placeholder" :disabled="disabled" :scope="scope" :cache-key="kind" @update:model-value="update" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ApiOptionSelect from '@/components/common/ApiOptionSelect.vue';
import { request } from '@/api/client';
import { dictionaryApi } from '@/api/dictionary';
import { enumLabel } from '@/utils/enumLabels';

const props = withDefaults(defineProps<{
  modelValue?: string; kind: string; placeholder?: string; disabled?: boolean;
  tenantId?: string; valueSetId?: string; context?: Record<string, string>;
}>(), { modelValue: '', placeholder: '请选择', disabled: false, tenantId: '', valueSetId: '' });
const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [value: string] }>();
const scope = computed(() => JSON.stringify([props.kind, props.tenantId, props.valueSetId, props.context]));
const optionLabel = (item: { label: string }) => enumLabel(item.label);
function update(value: string) { emit('update:modelValue', value); emit('change', value); }
async function loadOptions(keyword: string, page: number) {
  const params: Record<string, string | number | undefined> = { page, size: 200 };
  let path: string, valueKey: string, nameKey: string, codeKey = '';
  switch (props.kind) {
    case 'tenantId':
      path = '/tenant-access/tenants/permitted'; valueKey = 'tenantId'; nameKey = 'tenantName'; params.tenantName = keyword || undefined; break;
    case 'projectSpaceId':
      path = '/openapi/v1/project-spaces'; valueKey = 'projectSpaceId'; nameKey = 'projectName'; codeKey = 'projectCode'; params.projectName = keyword || undefined; break;
    case 'sourceSystemId': case 'targetSourceSystemId':
      path = props.tenantId ? '/openapi/v1/source-systems/tenant' : '/openapi/v1/source-systems';
      valueKey = 'sourceSystemId'; nameKey = 'sourceSystemName'; codeKey = 'sourceSystemCode';
      if (props.tenantId) { params.tenantId = props.tenantId; params.keyword = keyword || undefined; }
      else params.sourceSystemName = keyword || undefined;
      break;
    case 'valueSetId':
      path = '/openapi/v1/value-sets'; valueKey = 'valueSetId'; nameKey = 'valueSetName'; codeKey = 'valueSetCode'; params.valueSetName = keyword || undefined; break;
    case 'standardItemId':
      if (!props.valueSetId) return { records: [], total: '0' };
      path = `/openapi/v1/value-sets/${encodeURIComponent(props.valueSetId)}/items`; valueKey = 'itemId'; nameKey = 'itemName'; codeKey = 'itemCode'; params.itemName = keyword || undefined; break;
    case 'templateType': {
      const items = await dictionaryApi.listActiveItems('FILE_TEMPLATE_TYPE');
      const records = items.filter(item => `${item.itemName} ${item.itemCode}`.toLowerCase().includes(keyword.toLowerCase()))
        .map(item => ({ value: item.itemCode, label: `${item.itemName} (${item.itemCode})` }));
      return { records, total: String(records.length) };
    }
    case 'rawStatus': case 'eventStatus': {
      path = props.kind === 'rawStatus' ? '/openapi/v1/raw-records' : '/openapi/v1/event-fact/events';
      const statusKey = props.kind === 'rawStatus' ? 'status' : 'processingStatus';
      const context = Object.fromEntries(Object.entries(props.context || {}).filter(([key, value]) => value && key !== statusKey));
      const statuses = new Set<string>(), seen = new Set<string>();
      let loaded = 0;
      for (let currentPage = 1; ; currentPage++) {
        const result: any = await request.get(path, { params: { ...context, page: currentPage, size: 200 } });
        const batch = result.records || [];
        let added = 0;
        for (const item of batch) {
          const id = String(item.rawRecordId ?? item.id);
          if (!seen.has(id)) { seen.add(id); added++; }
          if (item[statusKey]) statuses.add(String(item[statusKey]));
        }
        loaded += batch.length;
        if (!added || loaded >= Number(result.total || 0)) break;
      }
      const records = [...statuses].filter(value => value.toLowerCase().includes(keyword.toLowerCase())).map(value => ({ value, label: value }));
      return { records, total: String(records.length) };
    }
    default: return { records: [], total: '0' };
  }
  const result: any = await request.get(path, { params });
  return {
    records: (result.records || []).map((item: any) => {
      const value = String(item[valueKey] ?? item.id);
      return { value, label: `${item[nameKey] || item[codeKey] || value} (${item[codeKey] || value})` };
    }),
    total: String(result.total || 0)
  };
}
</script>
