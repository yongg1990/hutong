<template>
  <div class="filter-bar">
    <div class="filter-fields">
      <slot></slot>
    </div>
    <div class="filter-actions">
      <el-button type="primary" @click="$emit('search')">
        <el-icon style="margin-right: 4px;"><Search /></el-icon> 查询
      </el-button>
      <el-button @click="$emit('reset')">
        <el-icon style="margin-right: 4px;"><RefreshRight /></el-icon> 重置
      </el-button>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, RefreshRight } from '@element-plus/icons-vue';

defineEmits(['search', 'reset']);
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 10px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 14px;
  box-shadow: 0 1px 2px rgba(24, 35, 52, 0.03);
}

.filter-fields {
  display: contents;
}
.filter-fields :deep(.el-input), .filter-fields :deep(.el-select) { max-width: 100%; }
.filter-fields > :deep(.api-option-select) { flex: 0 1 190px; width: 190px; min-width: 0; }

.filter-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 12px;
  min-width: 0;
  max-width: 100%;
}
.filter-actions > :deep(.el-button) { margin-left: 0; }
@media (max-width: 640px) {
  .filter-fields :deep(.el-input), .filter-fields :deep(.el-select) { width: 100% !important; }
}
</style>
