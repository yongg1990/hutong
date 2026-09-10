<template>
  <div class="governance-page">
    <PageHeader
      title="来源系统"
      subtitle="接入数据源系统注册、凭证与允许协同场景配置"
    >
      <template #actions>
        <el-button type="primary" @click="openRegister">注册新来源系统</el-button>
      </template>
    </PageHeader>

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="keyword" placeholder="来源系统名称/标识" style="width: 200px" />
      <el-select v-model="status" placeholder="状态" style="width: 140px">
        <el-option label="全部状态" value="" />
        <el-option label="正常 ACTIVE" value="ACTIVE" />
        <el-option label="暂停 SUSPENDED" value="SUSPENDED" />
      </el-select>
    </FilterBar>

    <div class="panel">
      <el-table :data="filteredSources" v-loading="loading">
        <el-table-column prop="code" label="系统标识" width="140" class-name="mono" />
        <el-table-column prop="name" label="系统名称" min-width="180" />
        <el-table-column prop="type" label="接入方式" width="130" />
        <el-table-column prop="scenarios" label="允许协同场景" min-width="200" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openDetail(row)">详情</el-button>
            <el-button size="small" :type="row.status === 'ACTIVE' ? 'danger' : 'success'" link @click="toggleStatus(row)">
              {{ row.status === 'ACTIVE' ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Register Modal -->
    <el-dialog v-model="dialogVisible" title="注册新接入来源系统" width="520px">
      <el-form :model="regForm" label-position="top">
        <el-form-item label="系统标识 (Source Code)" required>
          <el-input v-model="regForm.systemCode" placeholder="如: WMS-KM-02" />
        </el-form-item>
        <el-form-item label="系统名称" required>
          <el-input v-model="regForm.systemName" placeholder="如: 昆明二号仓储管理系统" />
        </el-form-item>
        <el-form-item label="接入协议类型">
          <el-select v-model="regForm.protocol" placeholder="请选择" style="width: 100%">
            <el-option label="HTTP/REST - Webhook 接口推送" value="HTTP/REST" />
            <el-option label="MQTT/Webhook - 物联网设备流" value="MQTT/Webhook" />
            <el-option label="DB-CDC - 数据库日志变更捕获" value="DB-CDC" />
            <el-option label="EDGE_NODE - 前置节点定时同步" value="EDGE_NODE" />
          </el-select>
        </el-form-item>
        <el-form-item label="鉴权方式">
          <el-select v-model="regForm.authType" style="width: 100%">
            <el-option label="OAuth2 / Bearer Token" value="OAuth2 / Bearer" />
            <el-option label="HMAC-SHA256 签名校验" value="HMAC-SHA256" />
            <el-option label="双向 TLS 证书 (mTLS)" value="Cert-Mutual-TLS" />
          </el-select>
        </el-form-item>
        <el-form-item label="接入 Endpoint / 推送地址">
          <el-input v-model="regForm.endpointUrl" placeholder="https://api.tcm.local/gateway" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmRegister">确认注册</el-button>
      </template>
    </el-dialog>

    <!-- Source Detail Modal -->
    <el-dialog v-model="detailVisible" title="来源系统接入详情与凭证配置" width="560px">
      <div v-if="selectedSource" class="source-detail">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="系统编码">{{ selectedSource.code }}</el-descriptions-item>
          <el-descriptions-item label="系统名称">{{ selectedSource.name }}</el-descriptions-item>
          <el-descriptions-item label="接入协议">{{ selectedSource.type }}</el-descriptions-item>
          <el-descriptions-item label="运行状态">
            <StatusTag :code="selectedSource.status" />
          </el-descriptions-item>
          <el-descriptions-item label="协同场景">{{ selectedSource.scenarios }}</el-descriptions-item>
          <el-descriptions-item label="接入凭据 AppKey">
            <span class="mono">AK_{{ selectedSource.code.replace(/[^a-zA-Z0-9]/g, '') }}_2026</span>
          </el-descriptions-item>
          <el-descriptions-item label="鉴权 Secret 密匙">
            <span class="mono">sk_live_9a8f2374e6b10c9d...</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { governanceApi } from '@/api/governance';

const keyword = ref('');
const status = ref('');
const dialogVisible = ref(false);
const detailVisible = ref(false);
const loading = ref(false);
const saving = ref(false);
const selectedSource = ref<any>(null);

const regForm = ref({
  systemCode: '',
  systemName: '',
  protocol: 'HTTP/REST',
  authType: 'OAuth2 / Bearer',
  endpointUrl: 'https://api.tcm.local/gateway'
});

const sources = ref<any[]>([]);

const filteredSources = computed(() => {
  return sources.value.filter(s => {
    if (status.value && s.status !== status.value) return false;
    if (keyword.value) {
      const kw = keyword.value.toLowerCase();
      return (s.code || '').toLowerCase().includes(kw) || (s.name || '').toLowerCase().includes(kw);
    }
    return true;
  });
});

const loadSources = async () => {
  loading.value = true;
  try {
    const res = await governanceApi.getSources();
    sources.value = res.map(s => ({
      code: s.systemCode,
      name: s.systemName,
      type: s.protocol,
      scenarios: 'FIELD, PROCESS, QUALITY, SUPPLY',
      status: s.status === 'ONLINE' ? 'ACTIVE' : 'SUSPENDED'
    }));
  } catch (err) {
    console.error('Failed to load sources', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadSources();
});

const handleSearch = () => {
  ElMessage.success(`检索完成，当前匹配 ${filteredSources.value.length} 个来源系统`);
};

const handleReset = () => {
  keyword.value = '';
  status.value = '';
};

const openRegister = () => {
  regForm.value = {
    systemCode: `WMS-KM-0${sources.value.length + 1}`,
    systemName: '',
    protocol: 'HTTP/REST',
    authType: 'OAuth2 / Bearer',
    endpointUrl: 'https://api.tcm.local/gateway'
  };
  dialogVisible.value = true;
};

const confirmRegister = async () => {
  if (!regForm.value.systemCode || !regForm.value.systemName) {
    ElMessage.warning('请填写系统标识与名称');
    return;
  }
  saving.value = true;
  try {
    await governanceApi.createSource(regForm.value);
    sources.value.unshift({
      code: regForm.value.systemCode,
      name: regForm.value.systemName,
      type: regForm.value.protocol,
      scenarios: 'FIELD, PROCESS, QUALITY, SUPPLY',
      status: 'ACTIVE'
    });
    dialogVisible.value = false;
    ElMessage.success('新来源系统注册成功！已自动分配密钥凭证与通信证书。');
  } catch (err) {
    ElMessage.error('注册失败，请稍后重试');
  } finally {
    saving.value = false;
  }
};

const openDetail = (row: any) => {
  selectedSource.value = row;
  detailVisible.value = true;
};

const toggleStatus = (row: any) => {
  row.status = row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  ElMessage.success(`系统 [${row.code}] 状态已更新为 ${row.status}`);
};
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
