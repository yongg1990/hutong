<template>
  <div class="trace-hierarchy-wrapper">
    <div class="grid-actions">
      <strong>追溯码层次与多级关联定义 (当前码 + 父级码 + 包装层级)</strong>
    </div>

    <div class="hierarchy-form-grid">
      <div class="form-item">
        <label>当前层级追溯码</label>
        <el-input v-model="currentCode" placeholder="693000260731080001" />
      </div>

      <div class="form-item">
        <label>父级包装追溯码 (上一层外箱/托盘)</label>
        <el-input v-model="parentCode" placeholder="69300026073108BOX01" />
      </div>

      <div class="form-item">
        <label>包装层级</label>
        <el-select v-model="pkgLevel">
          <el-option label="LEVEL_1 - 最小销售袋/瓶包装" value="LEVEL_1" />
          <el-option label="LEVEL_2 - 中盒/大包" value="LEVEL_2" />
          <el-option label="LEVEL_3 - 运输外箱/瓦楞纸箱" value="LEVEL_3" />
          <el-option label="LEVEL_4 - 仓储托盘" value="LEVEL_4" />
        </el-select>
      </div>

      <div class="form-item">
        <label>校验位与码体制</label>
        <el-input value="GS1-128 / 中国药品/饮片追溯码" disabled />
      </div>
    </div>

    <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 10px;">
      <el-button type="primary" :loading="submitting" @click="submitTraceCode">
        提交登记至 OpenAPI (/openapi/v1/trace-codes)
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { codingApi } from '@/api/coding';

const currentCode = ref('693000260731080001');
const parentCode = ref('69300026073108BOX01');
const pkgLevel = ref('LEVEL_1');
const submitting = ref(false);

const submitTraceCode = async () => {
  if (!currentCode.value) {
    ElMessage.warning('请输入追溯码');
    return;
  }
  submitting.value = true;
  try {
    const res = await codingApi.registerTraceCode({
      schemeCode: 'GS1_128',
      code: currentCode.value,
      batchId: 101,
      packageUnitId: 1,
      packageLevel: pkgLevel.value,
      parentCode: parentCode.value || undefined
    });
    ElMessage.success(`追溯码登记成功 (记录ID: ${res.traceCodeRecordId})！已完成多级拓扑绑定`);
  } catch (err) {
    ElMessage.error('登记失败，请重试');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.trace-hierarchy-wrapper {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  padding: 12px;
}

.grid-actions {
  font-size: 13px;
  margin-bottom: 12px;
  font-weight: 600;
}

.hierarchy-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.form-item label {
  display: block;
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: 4px;
}
</style>
