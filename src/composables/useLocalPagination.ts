import { computed, ref, watch, type Ref } from 'vue';

export function useLocalPagination<T>(rows: Ref<T[]>, pageSize = 10) {
  const page = ref(1);
  const pageRows = computed(() => rows.value.slice((page.value - 1) * pageSize, page.value * pageSize));
  watch(rows, () => { page.value = 1; });
  watch(() => rows.value.length, length => {
    page.value = Math.min(page.value, Math.max(1, Math.ceil(length / pageSize)));
  });
  return { page, pageRows };
}
