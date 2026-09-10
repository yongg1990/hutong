<template>
  <el-dialog
    v-model="visible"
    title="互通投影失败字段透视与来源定位器 (Projection Error Inspector)"
    width="680px"
    append-to-body
  >
    <div class="inspector-header">
      <el-alert
        title="投影任务 PRJ-20260808-0067 校验失败"
        type="error"
        description="检测到 3 处必选字段缺失或校验错误。原因：缺失策略要求 REJECT 时阻断交付。"
        show-icon
        :closable="false"
      />
    </div>

    <table class="error-table">
      <thead>
        <tr>
          <th>目标契约 JSON 路径</th>
          <th>来源事件路径</th>
          <th>缺失/阻断原因说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="mono">$.items[12].medicalInsuranceCode</td>
          <td class="mono">$.insurance_code</td>
          <td>必选医保编码字段源值为 null，缺失策略为 REJECT</td>
        </tr>
        <tr>
          <td class="mono">$.items[45].traceCode</td>
          <td class="mono">$.trace_code</td>
          <td>追溯码格式不合规 (缺少标准 18 位 GS1 校验)</td>
        </tr>
      </tbody>
    </table>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="jumpToGovernance">进入治理案卷修复</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const visible = ref(false);
const router = useRouter();

const open = () => {
  visible.value = true;
};

const jumpToGovernance = () => {
  visible.value = false;
  router.push('/governance/cases');
};

defineExpose({ open });
</script>

<style scoped>
.inspector-header {
  margin-bottom: 14px;
}

.error-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--color-border);
}

.error-table th {
  background: #f6f8f7;
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.error-table td {
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid #edf0ee;
  color: var(--color-danger);
}
</style>
