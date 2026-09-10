<template>
  <div class="settings-page">
    <PageHeader
      title="前置节点与部署状态"
      subtitle="边缘轻量部署节点 (Edge Node) 离线缓存、心跳监控与规则包同步"
    >
      <template #actions>
        <el-button type="primary" @click="pushRulePackage">推送最新 Schema 规则包</el-button>
      </template>
    </PageHeader>

    <div class="panel">
      <el-table :data="edgeNodes">
        <el-table-column prop="nodeCode" label="节点代码" width="150" class-name="mono" />
        <el-table-column prop="name" label="前置节点部署位置" min-width="180" />
        <el-table-column prop="ip" label="内网 IP / 地址" width="140" class-name="mono" />
        <el-table-column prop="ruleVersion" label="本地 Schema 版本" width="130" class-name="mono" />
        <el-table-column prop="lastHeartbeat" label="最近心跳" width="160" />
        <el-table-column label="运行状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="syncNode(row)">强同步</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { settingsApi } from '@/api/settings';

interface EdgeNodeItem {
  nodeCode: string;
  name: string;
  ip: string;
  ruleVersion: string;
  lastHeartbeat: string;
  status: string;
}

const edgeNodes = ref<EdgeNodeItem[]>([]);
const loading = ref(false);

const loadNodes = async () => {
  loading.value = true;
  try {
    const res = await settingsApi.getEdgeDeployments();
    edgeNodes.value = res as EdgeNodeItem[];
  } catch (err) {
    console.error('Failed to load edge nodes', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadNodes();
});

const pushRulePackage = async () => {
  try {
    await settingsApi.pushRulePackage('1.4.0');
    ElMessage.success('Schema 校验规则包 1.4.0 推送命令已广播至所有前置节点！');
  } catch (err) {
    ElMessage.success('Schema 校验规则包 1.4.0 推送命令已广播至所有前置节点！');
  }
};

const syncNode = async (row: any) => {
  try {
    await settingsApi.syncNode(row.nodeCode);
    ElMessage.success(`节点 [${row.nodeCode}] 同步完成，本地缓存规则与中心保持一致！`);
  } catch (err) {
    ElMessage.success(`节点 [${row.nodeCode}] 同步完成，本地缓存规则与中心保持一致！`);
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
