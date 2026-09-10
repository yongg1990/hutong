<template>
  <span class="status-tag" :class="tagType">
    <span class="status-dot"></span>
    <span class="status-text">{{ labelText }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  code: string;
  label?: string;
}>();

const statusMap: Record<string, { label: string; type: 'ok' | 'info' | 'warn' | 'bad' }> = {
  // Common states
  ACCEPTED: { label: '已接受', type: 'ok' },
  CONFIRMED: { label: '已确认', type: 'ok' },
  ACTIVE: { label: '正常', type: 'ok' },
  HEALTHY: { label: '正常', type: 'ok' },
  GROWING: { label: '生长中', type: 'ok' },
  QUALIFIED: { label: '合格', type: 'ok' },
  COMPLETED: { label: '已完成', type: 'ok' },
  GENERATED: { label: '已生成', type: 'ok' },
  MATCHED: { label: '一致', type: 'ok' },
  PUBLISHED: { label: '已发布', type: 'ok' },

  PROCESSING: { label: '处理中', type: 'info' },
  PENDING: { label: '待处理', type: 'info' },
  IN_TRANSIT: { label: '运输中', type: 'info' },
  SUBMITTED: { label: '已提交', type: 'info' },
  TESTED: { label: '已预检', type: 'info' },
  DELIVERING: { label: '配送中', type: 'info' },

  CHECKING: { label: '待核对', type: 'warn' },
  PLEDGED: { label: '质押中', type: 'warn' },
  PENDING_OUT: { label: '待出库', type: 'warn' },
  PENDING_DELIVERY: { label: '待交割', type: 'warn' },
  QUEUE_BACKLOG: { label: '队列积压', type: 'warn' },
  CERT_EXPIRING: { label: '证书将过期', type: 'warn' },
  SUSPENDED: { label: '暂停', type: 'warn' },
  DRAFT: { label: '草稿', type: 'warn' },

  FAILED: { label: '失败', type: 'bad' },
  REJECTED: { label: '被驳回', type: 'bad' },
  UNMATCHED: { label: '不一致', type: 'bad' },
  OPEN: { label: '待处理异常', type: 'bad' },
  MANUAL_ACTION: { label: '需人工处理', type: 'bad' },
  OFFLINE: { label: '离线', type: 'bad' }
};

const tagType = computed(() => {
  return statusMap[props.code]?.type || 'info';
});

const labelText = computed(() => {
  if (props.label) return props.label;
  return statusMap[props.code]?.label || props.code;
});
</script>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  border-radius: 4px;
  padding: 0 7px;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.status-tag.ok {
  background-color: #ebf6f0;
  color: #0e5f40;
  border: 1px solid #c8e6d6;
}
.status-tag.ok .status-dot {
  background-color: #0e5f40;
}

.status-tag.info {
  background-color: #eaf3fa;
  color: #17649d;
  border: 1px solid #c7dfef;
}
.status-tag.info .status-dot {
  background-color: #1b6ca8;
}

.status-tag.warn {
  background-color: #fff6e8;
  color: #a86200;
  border: 1px solid #f9dec0;
}
.status-tag.warn .status-dot {
  background-color: #b26a00;
}

.status-tag.bad {
  background-color: #fcebe9;
  color: #b73224;
  border: 1px solid #f7c9c5;
}
.status-tag.bad .status-dot {
  background-color: #c0392b;
}
</style>
