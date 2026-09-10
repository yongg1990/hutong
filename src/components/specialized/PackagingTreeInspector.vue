<template>
  <div class="packaging-tree-wrapper">
    <div class="tree-title">
      <strong>追溯码包装层级与对应数量分布 (Packaging Hierarchy Tree)</strong>
    </div>

    <el-tree
      :data="treeData"
      node-key="id"
      default-expand-all
      :props="{ label: 'label', children: 'children' }"
    >
      <template #default="{ node, data }">
        <div class="custom-tree-node">
          <span>{{ node.label }}</span>
          <span class="node-badge" v-if="data.badge">{{ data.badge }}</span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const treeData = ref([
  {
    id: '1',
    label: 'LEVEL_4: 仓储托盘 PALLET-202608-01 (1 托)',
    badge: '包含 20 大箱',
    children: [
      {
        id: '1-1',
        label: 'LEVEL_3: 瓦楞纸箱 BOX-SQ-260731-01 (大箱 1)',
        badge: '包含 60 袋',
        children: [
          {
            id: '1-1-1',
            label: 'LEVEL_1: 饮片销售袋 (追溯码: 693000260731080001)',
            badge: '1 kg/袋'
          },
          {
            id: '1-1-2',
            label: 'LEVEL_1: 饮片销售袋 (追溯码: 693000260731080002)',
            badge: '1 kg/袋'
          }
        ]
      }
    ]
  }
]);
</script>

<style scoped>
.packaging-tree-wrapper {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  padding: 14px;
}

.tree-title {
  font-size: 13px;
  margin-bottom: 10px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 12px;
  font-size: 13px;
}

.node-badge {
  background: var(--color-brand-soft);
  color: var(--color-brand);
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
}
</style>
