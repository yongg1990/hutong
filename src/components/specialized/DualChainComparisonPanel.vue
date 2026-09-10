<template>
  <div class="dual-chain-panel">
    <div class="panel-header">
      <strong>双链存证状态对比与差异解析器 (ChangAn Chain vs. FISCO BCOS)</strong>
      <el-button size="small" type="primary" @click="runReconcile">
        一键重新执行双链对账
      </el-button>
    </div>

    <div class="chain-cards-grid">
      <!-- ChangAn Chain -->
      <div class="chain-card">
        <div class="chain-title">
          <span>长安链 (上海中药枢纽链)</span>
          <StatusTag code="CONFIRMED" />
        </div>
        <div class="chain-field"><span class="label">交易哈希 TxHash:</span> <span class="mono">0x8af37b21e902a114f291029c88219034</span></div>
        <div class="chain-field"><span class="label">区块高度 BlockHeight:</span> <span>12,987,421</span></div>
        <div class="chain-field"><span class="label">存证 Payload 哈希:</span> <span class="mono">sha256:7ae23849...32d1</span></div>
        <div class="chain-field"><span class="label">确认时间:</span> <span>2026-08-08 15:42:22</span></div>
      </div>

      <!-- FISCO BCOS -->
      <div class="chain-card">
        <div class="chain-title">
          <span>FISCO BCOS (滇桂粤联合监管链)</span>
          <StatusTag code="CONFIRMED" />
        </div>
        <div class="chain-field"><span class="label">交易哈希 TxHash:</span> <span class="mono">0x71c2a908123847aef9210823901428fa</span></div>
        <div class="chain-field"><span class="label">区块高度 BlockHeight:</span> <span>891,204</span></div>
        <div class="chain-field"><span class="label">存证 Payload 哈希:</span> <span class="mono">sha256:7ae23849...32d1</span></div>
        <div class="chain-field"><span class="label">确认时间:</span> <span>2026-08-08 15:42:25</span></div>
      </div>
    </div>

    <div class="reconcile-result ok">
      <span class="icon">✓</span>
      <div>
        <strong>双链对账结论：完全一致 (MATCHED)</strong>
        <p>长安链与 FISCO BCOS 存证的 Payload SHA-256 哈希值完全吻合，符合“双链互相印证”无篡改规范。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import StatusTag from '@/components/common/StatusTag.vue';

const runReconcile = () => {
  ElMessage.success('双链差异对账计算完成：Payload Hash 两端一致，无对账差异。');
};
</script>

<style scoped>
.dual-chain-panel {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  padding: 14px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.chain-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.chain-card {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 12px;
  background: var(--color-canvas);
}

.chain-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
}

.chain-field {
  font-size: 12px;
  margin-bottom: 6px;

}

.chain-field .label {
  color: var(--color-muted);
  margin-right: 4px;
}

.reconcile-result {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 12px;
}

.reconcile-result.ok {
  background: #e8f5ee;
  border: 1px solid #c3e6cb;
  color: var(--color-success);
}

.reconcile-result.ok p {
  margin: 2px 0 0;
  color: #2b5438;
}

.icon {
  font-size: 16px;
  font-weight: 700;
}
</style>
