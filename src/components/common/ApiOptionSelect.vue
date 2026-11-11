<template>
  <el-select class="api-option-select" :model-value="modelValue" :placeholder="placeholder" :disabled="disabled" filterable clearable
    :loading="loading" @update:model-value="select">
    <el-option v-for="item in options" :key="String(item[valueKey])" :value="String(item[valueKey])" :label="label(item)" />
    <template #empty><div class="option-empty">{{ loading ? '加载中' : '暂无数据' }}<el-button v-if="loadFailed" link @click="load()">重试</el-button></div></template>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { apiErrorMessage } from '@/api/client';
import { usePageOptions } from '@/composables/usePageOptions';

const props = withDefaults(defineProps<{
  modelValue: string; loader: (keyword: string, page: number) => Promise<{ records: any[]; total: string }>;
  valueKey: string; label: (item: any) => string; placeholder?: string; disabled?: boolean; scope?: string; cacheKey?: string;
}>(), { placeholder: '请选择', disabled: false, scope: '' });
const emit = defineEmits<{ 'update:modelValue': [value: string]; select: [item: any] }>();
const options = ref<any[]>([]), loading = ref(false), loadFailed = ref(false);
const pageOptions = usePageOptions();
const instanceCache = new Map<string, Promise<any[]>>();
let revision = 0;
let selected: any;
async function load() {
  const current = ++revision;
  if (props.disabled) return;
  loading.value = true; loadFailed.value = false;
  try {
    const scope = props.scope;
    const loader = props.loader;
    const fetchOptions = async () => {
      const records: any[] = [];
      let loaded = 0;
      const seen = new Set<string>();
      let page = 1;
      while (true) {
        if (scope !== props.scope) throw new Error('选项范围已切换');
        const result = await loader('', page);
        if (scope !== props.scope) throw new Error('选项范围已切换');
        const batch = result.records || [];
        loaded += batch.length;
        const next = batch.filter(item => {
          const key = String(item[props.valueKey]);
          if (seen.has(key)) return false;
          seen.add(key); return true;
        });
        records.push(...next);
        if (!next.length || loaded >= Number(result.total || 0)) break;
        page += 1;
      }
      return records;
    };
    let pending: Promise<any[]>;
    if (props.cacheKey) pending = pageOptions(`select:${props.cacheKey}:${scope}`, fetchOptions);
    else {
      pending = instanceCache.get(scope) || fetchOptions().catch(error => { instanceCache.delete(scope); throw error; });
      instanceCache.set(scope, pending);
    }
    const records = await pending;
    if (current !== revision) return;
    options.value = selected && !records.some(item => String(item[props.valueKey]) === String(selected[props.valueKey])) ? [selected, ...records] : records;
  } catch (cause) {
    if (current === revision) { options.value = selected ? [selected] : []; loadFailed.value = true; ElMessage.error(apiErrorMessage(cause, '选项加载失败')); }
  } finally { if (current === revision) loading.value = false; }
}
function select(value: string | undefined) {
  selected = options.value.find(item => String(item[props.valueKey]) === value);
  emit('update:modelValue', value || '');
  emit('select', selected);
}
watch(() => [props.scope, props.disabled], () => {
  ++revision; selected = undefined; options.value = []; loading.value = false; loadFailed.value = false;
  if (!props.disabled) void load();
}, { immediate: true });
watch(() => props.modelValue, value => { if (!value) selected = undefined; });
</script>

<style scoped>
.api-option-select { width: 100%; }
.option-empty { padding: 14px; color: var(--color-muted); text-align: center; }
</style>
