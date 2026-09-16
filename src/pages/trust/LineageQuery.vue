<template>
  <div class="trust-page">
    <PageHeader
      title="中药追溯图谱与血缘分析"
      subtitle="全链路溯源图谱分析 · 支持节点多维穿透与合规断链预警"
    />

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-select v-model="rootType" placeholder="根主体类型" style="width: 160px">
        <el-option label="EVENT" value="EVENT" />
        <el-option label="OBJECT" value="OBJECT" />
        <el-option label="BATCH" value="BATCH" />
      </el-select>
      <el-input-number v-model="rootId" :min="1" placeholder="根主体 ID" style="width: 180px" />
      <el-input-number v-model="projectSpaceId" :min="1" placeholder="项目空间 ID" style="width: 160px" />
      <el-input v-model="purposeCode" placeholder="访问用途" style="width: 160px" />
      <el-select v-model="depth" placeholder="血缘展开深度" style="width: 140px">
        <el-option label="3 层 (推荐)" :value="3" />
        <el-option label="5 层" :value="5" />
        <el-option label="全图谱" :value="10" />
      </el-select>
      <el-input-number v-model="maxNodes" :min="1" :max="1000" placeholder="最大节点数" style="width: 150px" />
    </FilterBar>

    <div v-if="lineageResult" class="result-summary">
      <span>根主体 ID: <b class="mono">{{ lineageResult.rootId }}</b></span>
      <span>来源版本: <b class="mono">{{ lineageResult.sourceVersion || '-' }}</b></span>
      <span>截断状态: <b>{{ lineageResult.truncated ? '是' : '否' }}</b></span>
    </div>

    <!-- Graph Canvas Container -->
    <div class="lineage-container">
      <GraphvizLineageCanvas :nodes="lineageResult?.nodes" :edges="lineageResult?.edges" @node-click="handleNodeClick" />
    </div>

    <!-- Node Detail Drawer -->
    <el-drawer v-model="drawerVisible" :title="'节点详情: ' + (selectedNode?.label || '')" size="420px">
      <div v-if="selectedNode">
        <div class="kv-row"><span>节点编号:</span> <b class="mono">{{ selectedNode.id }}</b></div>
        <div class="kv-row"><span>节点类型:</span> <b>{{ selectedNode.type }}</b></div>
        <pre class="node-json mono">{{ JSON.stringify(selectedNode, null, 2) }}</pre>

        <el-divider />

        <h3 style="font-size: 14px; margin-bottom: 12px;">关联可信存证与合规凭证</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <el-button style="width: 100%" type="primary" plain @click="goToEvent">
            查看该节点对应可信事件详情 ({{ selectedNode.id }}) ➔
          </el-button>
          <el-button style="width: 100%" @click="goToProof">
            查看区块链上链存证单与 Merkle 路径
          </el-button>
          <el-button style="width: 100%" @click="goToEvidence">
            检索该环节关联质检/合同原始证据文件
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import GraphvizLineageCanvas from '@/components/specialized/GraphvizLineageCanvas.vue';
import { trustApi } from '@/api/trust';

const router = useRouter();
const route = useRoute();
const rootType = ref('OBJECT');
const rootId = ref<number | undefined>(1);
const projectSpaceId = ref(Number(localStorage.getItem('tcmirp_project_space_id')) || 1);
const purposeCode = ref(localStorage.getItem('tcmirp_purpose_code') || 'TRACE');
const depth = ref(3);
const maxNodes = ref(100);
const lineageResult = ref<any>(null);

const drawerVisible = ref(false);
const selectedNode = ref<any>(null);

onMounted(() => {
  const queryVal = (route.query.batchNo || route.query.code || route.query.eventId) as string;
  if (queryVal) {
    rootId.value = Number(queryVal) || undefined;
    rootType.value = route.query.eventId ? 'EVENT' : route.query.batchNo ? 'BATCH' : 'OBJECT';
    ElMessage.info(`已自动定位溯源标的: ${queryVal}`);
  }
});

const handleSearch = async () => {
  if (!rootId.value) {
    ElMessage.warning('请输入有效的根主体 ID');
    return;
  }
  try {
    lineageResult.value = await trustApi.getLineageGraph({
      rootType: rootType.value, rootId: rootId.value, projectSpaceId: projectSpaceId.value,
      purposeCode: purposeCode.value, maxDepth: depth.value, maxNodes: maxNodes.value
    });
  } catch (err) {
    // Keep local baseline graph on network failure
  }
};

const handleReset = () => {
  rootType.value = 'OBJECT';
  rootId.value = undefined;
  projectSpaceId.value = Number(localStorage.getItem('tcmirp_project_space_id')) || 1;
  purposeCode.value = localStorage.getItem('tcmirp_purpose_code') || 'TRACE';
  depth.value = 3;
  maxNodes.value = 100;
  lineageResult.value = null;
};

const handleNodeClick = (node: any) => {
  selectedNode.value = node;
  drawerVisible.value = true;
};

const goToEvent = () => {
  drawerVisible.value = false;
  router.push(`/trust/events/${selectedNode.value?.id || 'EVT-20260808-001'}`);
};

const goToProof = () => {
  drawerVisible.value = false;
  router.push('/trust/proofs');
};

const goToEvidence = () => {
  drawerVisible.value = false;
  router.push('/trust/evidence');
};

</script>

<style scoped>
.lineage-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  min-height: 540px;
  display: flex;
  flex-direction: column;
}

.result-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  padding: 10px 14px;
  margin-bottom: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 13px;
}

.kv-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #edf0ee;
  font-size: 13px;
}

.kv-row span {
  color: var(--color-muted);
}

.node-json {
  max-height: 320px;
  overflow: auto;
  margin-top: 12px;
  padding: 12px;
  background: #f6f8f7;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
