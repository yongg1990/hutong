<template>
  <el-drawer
    v-model="visible"
    title="治理异常同类型问题批量修复与重放"
    size="560px"
  >
    <div class="batch-replay-content">
      <el-alert
        title="按规则码 VALUE_SET_ITEM_INVALID 批量修复"
        type="warning"
        description="系统已识别出 12 条符合相同错误的异常案卷，支持统一设置代码映射或单位映射规则并一次性重放。"
        show-icon
        :closable="false"
        style="margin-bottom: 14px;"
      />

      <el-form label-position="top">
        <el-form-item label="原始输入异常值 (源值)">
          <el-input value="公斤 / 公斤装" disabled />
        </el-form-item>

        <el-form-item label="统一修正目标代码 (值域代码)">
          <el-select v-model="targetCode" style="width: 100%">
            <el-option label="kg - 千克 (千克标准单位)" value="kg" />
            <el-option label="g - 克 (克标准单位)" value="g" />
            <el-option label="t - 吨 (吨标准单位)" value="t" />
          </el-select>
        </el-form-item>

        <el-form-item label="关联持久化映射规则">
          <el-checkbox v-model="autoSaveRule">
            同时将此对应关系保存至来源系统 WMS-KM-01 的持久化映射表 (1.4.1 草稿)
          </el-checkbox>
        </el-form-item>
      </el-form>

      <div class="affected-cases">
        <strong>受影响的 12 条案卷清单：</strong>
        <div class="case-tags">
          <span class="case-pill mono" v-for="i in 6" :key="i">GC-20260808-00{{ i }}</span>
          <span class="case-more">+6 条...</span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="isReplaying" @click="handleBatchReplay">
        批量保存并重新重放
      </el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

const visible = ref(false);
const targetCode = ref('kg');
const autoSaveRule = ref(true);
const isReplaying = ref(false);

const open = () => {
  visible.value = true;
};

const handleBatchReplay = () => {
  isReplaying.value = true;
  setTimeout(() => {
    isReplaying.value = false;
    visible.value = false;
    ElMessage.success('已成功对 12 条案卷执行批量修复与重放，重放队列处理中！');
  }, 1200);
};

defineExpose({ open });
</script>

<style scoped>
.batch-replay-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.affected-cases {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 4px;
  padding: 12px;
}

.case-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.case-pill {
  background: #eef2f0;
  color: #425049;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
}

.case-more {
  font-size: 11px;
  color: var(--color-muted);
}
</style>
