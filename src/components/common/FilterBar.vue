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
  justify-content: space-between;
  gap: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 14px;
  box-shadow: 0 1px 2px rgba(14, 95, 64, 0.03);
}

.filter-fields {
  display: flex;
  flex: 1 1 500px;
  min-width: 0;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.filter-fields :deep(.el-input), .filter-fields :deep(.el-select) { max-width: 100%; }

.filter-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
@media (max-width: 640px) {
  .filter-fields :deep(.el-input), .filter-fields :deep(.el-select) { width: 100% !important; }
  .filter-actions { width: 100%; }
  .filter-actions .el-button { flex: 1; }
}
</style>
