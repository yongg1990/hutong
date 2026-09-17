<template>
  <div class="governance-page">
    <PageHeader
      title="来源系统"
      subtitle="来源系统注册"
    >
      <template #actions>
        <el-button type="primary" @click="openRegister">注册新来源系统</el-button>
      </template>
    </PageHeader>

    <el-alert type="info" :closable="false" title="当前接口仅支持注册，不提供来源系统列表或详情查询。下方显示本次页面注册结果。" style="margin-bottom: 12px" />

    <div class="panel">
      <el-table :data="sources" empty-text="暂无本次注册记录">
        <el-table-column prop="id" label="来源系统 ID" width="130" class-name="mono" />
        <el-table-column prop="code" label="系统标识" width="140" class-name="mono" />
        <el-table-column prop="name" label="系统名称（提交值）" min-width="180" />
        <el-table-column prop="version" label="配置版本" width="110" class-name="mono" />
        <el-table-column prop="registeredAt" label="注册时间" width="170" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
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
        <el-form-item label="来源系统类型" required><el-input v-model="regForm.systemType" placeholder="如 WMS、LIMS、ERP" /></el-form-item>
        <el-form-item label="所属主体 ID" required><el-input-number v-model="regForm.ownerPartyId" :min="1" style="width: 100%" /></el-form-item>
        <el-form-item label="接入方式" required>
          <el-select v-model="regForm.endpointType" style="width: 100%">
            <el-option v-for="item in ['API', 'FILE', 'MESSAGE', 'DATABASE']" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="API 基础地址"><el-input v-model="regForm.baseUrl" placeholder="https://example.com/api" /></el-form-item>
        <el-form-item label="签名公钥或证书引用" required><el-input v-model="regForm.signaturePublicKey" /></el-form-item>
        <el-form-item label="签名算法" required><el-input v-model="regForm.signatureAlgorithm" placeholder="如 SM2" /></el-form-item>
        <el-form-item label="信任级别" required><el-input v-model="regForm.trustLevel" placeholder="如 HIGH" /></el-form-item>
        <el-form-item label="默认用途代码" required><el-input v-model="regForm.purposeCodes" placeholder="多个代码用逗号分隔" /></el-form-item>
        <el-form-item label="初始状态" required><el-select v-model="regForm.status" style="width: 100%"><el-option label="启用 ACTIVE" value="ACTIVE" /><el-option label="停用 INACTIVE" value="INACTIVE" /></el-select></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmRegister">确认注册</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { governanceApi, type SourceSystemRequest } from '@/api/governance';
import { apiErrorMessage } from '@/api/client';

const dialogVisible = ref(false);
const saving = ref(false);
const emptyForm = () => ({
  systemCode: '',
  systemName: '',
  systemType: '', ownerPartyId: 0, endpointType: 'API', baseUrl: '',
  signaturePublicKey: '', signatureAlgorithm: '', trustLevel: '', purposeCodes: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
});
const regForm = ref(emptyForm());
const sources = ref<any[]>([]);

const openRegister = () => {
  regForm.value = emptyForm();
  dialogVisible.value = true;
};

const confirmRegister = async () => {
  const form = regForm.value;
  const purposeCodes = form.purposeCodes.split(',').map(item => item.trim()).filter(Boolean);
  if (!form.systemCode || !form.systemName || !form.systemType || !form.ownerPartyId || !form.signaturePublicKey || !form.signatureAlgorithm || !form.trustLevel || !purposeCodes.length) {
    ElMessage.warning('请填写所有必填字段');
    return;
  }
  saving.value = true;
  try {
    const payload: SourceSystemRequest = {
      sourceSystemCode: form.systemCode, sourceSystemName: form.systemName, sourceSystemType: form.systemType,
      ownerPartyId: form.ownerPartyId, endpointType: form.endpointType,
      ...(form.baseUrl ? { baseUrl: form.baseUrl } : {}), signaturePublicKey: form.signaturePublicKey,
      signatureAlgorithm: form.signatureAlgorithm, trustLevel: form.trustLevel, defaultPurposeCodes: purposeCodes, status: form.status
    };
    const created = await governanceApi.registerSourceSystem(payload);
    sources.value.unshift({
      id: created.sourceSystemId, code: created.sourceSystemCode, name: form.systemName, status: created.status,
      version: created.version,
      registeredAt: created.registeredAt
    });
    dialogVisible.value = false;
    localStorage.setItem('tcmirp_source_system_id', String(created.sourceSystemId));
    ElMessage.success('来源系统注册成功');
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '注册失败，请稍后重试'));
  } finally {
    saving.value = false;
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
