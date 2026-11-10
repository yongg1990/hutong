<template>
  <div class="local-paginated-table" :class="{ 'full-height': $attrs.height === '100%' }">
    <el-table ref="tableRef" v-bind="$attrs" :data="visibleRows" :height="$attrs.height === '100%' ? 'calc(100% - 52px)' : $attrs.height">
      <slot />
      <template v-if="$slots.empty" #empty><slot name="empty" /></template>
      <template v-if="$slots.append" #append><slot name="append" /></template>
    </el-table>
    <div v-if="data.length > pageSize" class="pagination-row">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="data.length" layout="total, prev, pager, next" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue';
import { ElTable } from 'element-plus';
import { useLocalPagination } from '@/composables/useLocalPagination';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ data?: any[]; pageSize?: number }>(), { data: () => [], pageSize: 10 });
const { page, pageRows: visibleRows } = useLocalPagination(toRef(props, 'data'), props.pageSize);
const tableRef = ref<InstanceType<typeof ElTable>>();
defineExpose({ tableRef });
</script>

<style scoped>
.local-paginated-table { width: 100%; min-width: 0; }
.full-height { height: 100%; }
.pagination-row { display: flex; justify-content: flex-end; padding: 14px 0 2px; }
</style>
