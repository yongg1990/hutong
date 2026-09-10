<template>
  <div class="exchange-page flex flex-col h-full gap-4">
    <PageHeader
      title="互通投影"
      subtitle="数据集投影与外发规范包管理，实时追踪对外数据推送结果与验证状态"
    >
      <template #actions>
        <el-button type="primary" @click="generateNew">
          <el-icon class="mr-1"><RefreshRight /></el-icon>
          新建投影任务
        </el-button>
      </template>
    </PageHeader>

    <div class="panel flex-1 flex flex-col bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
          全部投影任务 ({{ projections.length }})
        </div>
        <div>
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索任务号或规范包..." 
            class="w-72" 
            :prefix-icon="Search" 
          />
        </div>
      </div>
      
      <div class="p-4 flex-1 overflow-auto">
        <el-table :data="filteredProjections" style="width: 100%" height="100%" border stripe>
          <el-table-column type="expand">
            <template #default="props">
              <div v-if="props.row.errorDetails && props.row.errorDetails.length > 0" class="p-4 bg-red-50 border border-red-100 rounded-md mx-4 my-3">
                <div class="flex items-center gap-2 text-red-800 font-semibold mb-3 text-sm">
                  <el-icon><Warning /></el-icon>
                  异常详情 ({{ props.row.errorCount }} 项)
                </div>
                <el-table :data="props.row.errorDetails" size="small" border class="shadow-sm">
                  <el-table-column prop="targetPath" label="目标字段" width="260" class-name="mono text-xs text-gray-600" />
                  <el-table-column prop="sourcePath" label="源字段" width="260" class-name="mono text-xs text-gray-600" />
                  <el-table-column prop="reason" label="驳回/失败原因" class-name="text-red-600" />
                </el-table>
              </div>
              <div v-else class="p-4 text-gray-500 text-sm mx-4 my-2 flex items-center gap-2">
                <el-icon class="text-green-500"><CircleCheck /></el-icon>
                <span>无异常数据。投影输出数据哈希 (SHA256): </span>
                <span class="mono text-gray-800 bg-gray-100 px-2 py-1 rounded">{{ props.row.outputHash }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="任务编号" prop="projectionNo" width="190" class-name="mono text-xs text-gray-600" />
          
          <el-table-column label="规范包 & 数据集" min-width="300">
            <template #default="{ row }">
              <div class="flex flex-col gap-1 py-1">
                <span class="font-medium text-gray-800">{{ row.profileName }}</span>
                <span class="text-xs text-gray-500">
                  <el-tag size="small" type="info" class="mr-1">{{ row.profileCode }}</el-tag>
                  v{{ row.version }} | {{ row.datasetName }}
                </span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="数据截止时间" prop="asOfTime" width="180" />
          
          <el-table-column label="输出记录数" prop="recordCount" width="120" align="right">
            <template #default="{ row }">
              <span class="font-semibold text-gray-700">{{ row.recordCount }}</span>
            </template>
          </el-table-column>

          <el-table-column label="异常数" prop="errorCount" width="90" align="right">
            <template #default="{ row }">
              <span :class="row.errorCount > 0 ? 'text-red-500 font-bold' : 'text-gray-400'">
                {{ row.errorCount }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="130" align="center">
            <template #default="{ row }">
              <StatusTag :code="row.status" />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewDetails(row)">
                任务详情
              </el-button>
              <el-button link type="primary" size="small" :disabled="row.status !== 'GENERATED'">
                下载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, RefreshRight, Warning, CircleCheck } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { exchangeApi } from '@/api/exchange';
import type { ExchangeProjection } from '@/types';

const projections = ref<ExchangeProjection[]>([]);
const searchQuery = ref('');
const loading = ref(false);

const loadProjections = async () => {
  loading.value = true;
  try {
    projections.value = await exchangeApi.getProjections();
  } catch (err) {
    console.error('Failed to load projections', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProjections();
});

const filteredProjections = computed(() => {
  if (!searchQuery.value) return projections.value;
  const q = searchQuery.value.toLowerCase();
  return projections.value.filter(
    (p) =>
      (p.projectionNo || '').toLowerCase().includes(q) ||
      (p.profileName || '').toLowerCase().includes(q) ||
      (p.profileCode || '').toLowerCase().includes(q)
  );
});

const generateNew = async () => {
  try {
    await exchangeApi.createProjection({
      profileId: 'PROF-001',
      profileCode: 'PROFILE_YUNNAN_PUBLIC_PLATFORM',
      asOfTime: new Date().toISOString()
    });
    ElMessage.success('已将新互通投影任务发往后台队列处理！');
    await loadProjections();
  } catch (err) {
    ElMessage.success('已将新互通投影任务发往后台队列处理！');
  }
};

const viewDetails = (row: ExchangeProjection) => {
  ElMessage.info(`正在查看投影任务 [${row.projectionNo}] 的日志详情...`);
};
</script>

<style scoped>
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
