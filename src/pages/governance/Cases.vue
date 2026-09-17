<template>
  <div class="governance-page">
    <PageHeader
      title="治理异常案卷"
      subtitle="规则校验不通过的异常案卷人工研判、批量修复与二次重放"
    >
      <template #actions>
      </template>
    </PageHeader>
    <el-alert type="info" :closable="false" title="APP-03 未提供治理案卷列表或处置接口，下方为本地示例数据。原始记录重放请前往接入批次页面。" style="margin-bottom: 12px" />

    <div class="panel">
      <el-table :data="cases">
        <el-table-column prop="caseNo" label="案卷编号 *" width="160" class-name="mono" />
        <el-table-column prop="ruleCode" label="规则码 *" width="180" class-name="mono" />
        <el-table-column prop="sourceSystem" label="来源系统 *" width="120" />
        <el-table-column prop="errorDetail" label="错误描述与定位 *" min-width="220" />
        <el-table-column label="状态 *" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
      </el-table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { governanceApi } from '@/api/governance';
import type { GovernanceCase } from '@/types';

const cases = ref<GovernanceCase[]>([]);
const loading = ref(false);

const loadCases = async () => {
  loading.value = true;
  try {
    cases.value = await governanceApi.getCases();
  } catch (err) {
    console.error('Failed to load cases', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCases();
});

</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
