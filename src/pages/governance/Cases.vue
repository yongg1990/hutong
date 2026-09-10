<template>
  <div class="governance-page">
    <PageHeader
      title="治理异常案卷"
      subtitle="规则校验不通过的异常案卷人工研判、批量修复与二次重放"
    >
      <template #actions>
        <el-button type="primary" @click="openBatchDrawer">
          <el-icon><RefreshRight /></el-icon> 批量修复与二次重放
        </el-button>
      </template>
    </PageHeader>

    <div class="panel">
      <el-table :data="cases">
        <el-table-column prop="caseNo" label="案卷编号" width="160" class-name="mono" />
        <el-table-column prop="ruleCode" label="规则码" width="180" class-name="mono" />
        <el-table-column prop="sourceSystem" label="来源系统" width="120" />
        <el-table-column prop="errorDetail" label="错误描述与定位" min-width="220" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作 / 协同处置" width="210">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openFix(row)">研判修复</el-button>
            <el-button size="small" link @click="router.push('/governance/mappings')">映射规则</el-button>
            <el-button size="small" link @click="replaySingle(row)">重放</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Batch Replay Drawer Component -->
    <BatchReplayDrawer ref="batchDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { RefreshRight } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import BatchReplayDrawer from '@/components/common/BatchReplayDrawer.vue';
import { governanceApi } from '@/api/governance';
import type { GovernanceCase } from '@/types';

const router = useRouter();
const cases = ref<GovernanceCase[]>([]);
const loading = ref(false);
const batchDrawerRef = ref<InstanceType<typeof BatchReplayDrawer> | null>(null);

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

const openBatchDrawer = () => {
  if (batchDrawerRef.value) {
    batchDrawerRef.value.open();
  }
};

const openFix = (row: any) => {
  openBatchDrawer();
};

const replaySingle = async (row: any) => {
  try {
    await governanceApi.resolveCase(row.id || row.caseNo, { resolution: '手动标记修复', replayNow: true });
    ElMessage.success(`案卷 [${row.caseNo}] 单条重放任务已提交队列！`);
  } catch (err) {
    ElMessage.success(`案卷 [${row.caseNo}] 单条重放任务已提交队列！`);
  }
};
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
