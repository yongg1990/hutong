<template>
  <el-select :model-value="modelValue" :placeholder="placeholder" :disabled="disabled" filterable remote clearable
    :remote-method="search" :loading="loading" style="width: 100%" @update:model-value="select">
    <el-option v-for="item in options" :key="String(item[valueKey])" :value="String(item[valueKey])" :label="label(item)" />
    <template #footer>
      <el-pagination small :current-page="page" :page-size="20" :total="total" layout="prev, pager, next" :pager-count="5" @current-change="load" />
    </template>
    <template #empty><div class="option-empty">{{ error || (loading ? '加载中' : '暂无数据') }}<el-button v-if="error" link @click="load(page)">重试</el-button></div></template>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { apiErrorMessage } from '@/api/client';

const props = withDefaults(defineProps<{
  modelValue: string; loader: (keyword: string, page: number) => Promise<{ records: any[]; total: string }>;
  valueKey: string; label: (item: any) => string; placeholder?: string; disabled?: boolean; scope?: string;
}>(), { placeholder: '请选择', disabled: false, scope: '' });
const emit = defineEmits<{ 'update:modelValue': [value: string]; select: [item: any] }>();
const options = ref<any[]>([]), loading = ref(false), error = ref('');
const page = ref(1), total = ref(0), keyword = ref('');
let revision = 0;
let selected: any;
async function load(target = 1) {
  const current = ++revision;
  if (props.disabled) return;
  loading.value = true; error.value = ''; page.value = target;
  try {
    const result = await props.loader(keyword.value, target);
    if (current !== revision) return;
    const records = result.records || [];
    options.value = selected && !records.some(item => String(item[props.valueKey]) === String(selected[props.valueKey])) ? [selected, ...records] : records;
    total.value = Number(result.total || 0);
  } catch (cause) {
    if (current === revision) { options.value = selected ? [selected] : []; error.value = apiErrorMessage(cause, '选项加载失败'); }
  } finally { if (current === revision) loading.value = false; }
}
function search(value: string) { keyword.value = value; void load(1); }
function select(value: string | undefined) {
  selected = options.value.find(item => String(item[props.valueKey]) === value);
  emit('update:modelValue', value || '');
  emit('select', selected);
}
watch(() => [props.scope, props.disabled], () => {
  ++revision; selected = undefined; options.value = []; total.value = 0; keyword.value = ''; loading.value = false; error.value = '';
  if (!props.disabled) void load(1);
}, { immediate: true });
watch(() => props.modelValue, value => { if (!value) selected = undefined; });
</script>

<style scoped>
.option-empty { padding: 14px; color: var(--color-muted); text-align: center; }
</style>
