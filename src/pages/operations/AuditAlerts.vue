<template>
  <div class="operations-page">
    <PageHeader
      title="审计与预警 Alert"
      subtitle="系统操作审计日志、数据篡改警报与合规风控通知"
    ><template #actions><el-button type="primary" @click="actionVisible = true">处理真实告警</el-button></template></PageHeader>
    <el-alert type="info" :closable="false" title="下方为演示数据；Swagger 未发布审计和告警列表，处置时请填写真实告警 ID 和最新锁版本。" />
    <el-dialog v-model="actionVisible" title="处理告警" width="min(520px,94vw)"><el-form label-position="top"><el-form-item label="告警 ID" required><el-input v-model="actionForm.id" /></el-form-item><el-form-item label="操作"><el-radio-group v-model="actionForm.action"><el-radio-button value="ACK">确认</el-radio-button><el-radio-button value="CLOSE">关闭</el-radio-button></el-radio-group></el-form-item><el-form-item label="锁版本" required><el-input-number v-model="actionForm.lockVersion" :min="0" :precision="0" /></el-form-item><el-form-item label="处理说明"><el-input v-model="actionForm.resolutionNote" type="textarea" /></el-form-item></el-form><template #footer><el-button @click="actionVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitAction">提交</el-button></template></el-dialog>
    <el-drawer v-model="resultVisible" title="告警处理结果" size="min(560px,94vw)"><pre style="white-space:pre-wrap;overflow-wrap:anywhere">{{ JSON.stringify(actionResult,null,2) }}</pre></el-drawer>

    <div class="panel">
      <el-table :data="alerts">
        <el-table-column prop="alertId" label="预警 ID *" width="160" class-name="mono" />
        <el-table-column prop="level" label="严重级别 *" width="100">
          <template #default="{ row }">
            <StatusTag :code="row.level === 'HIGH' ? 'FAILED' : 'WARN'" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="预警标题 *" min-width="200" />
        <el-table-column prop="detail" label="详细描述 *" min-width="240" />
        <el-table-column prop="occurredAt" label="触发时间 *" width="160" />
        <el-table-column label="处理状态 *" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { extendedServices } from '@/api/extendedServices';
import { apiErrorMessage } from '@/api/client';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { settingsApi } from '@/api/settings';

const alerts = ref<any[]>([]);
const actionVisible=ref(false), resultVisible=ref(false), saving=ref(false), actionResult=ref<Record<string,unknown>>({});
const actionForm=reactive({id:'',action:'ACK' as 'ACK'|'CLOSE',lockVersion:0,resolutionNote:''});
async function submitAction(){if(!actionForm.id.trim()||!Number.isInteger(actionForm.lockVersion)){ElMessage.warning('请填写真实告警 ID 和锁版本');return;}saving.value=true;try{actionResult.value=await extendedServices.actOnAlert(actionForm.id.trim(),actionForm.action,actionForm.lockVersion,actionForm.resolutionNote||undefined);actionVisible.value=false;resultVisible.value=true;ElMessage.success('告警处理成功');}catch(e){ElMessage.error(apiErrorMessage(e,'告警处理失败'));}finally{saving.value=false;}}
const loading = ref(false);

const loadAlerts = async () => {
  loading.value = true;
  try {
    const res = await settingsApi.getAlerts();
    alerts.value = res.map(a => ({
      alertId: a.alertId,
      level: a.level,
      title: a.type,
      detail: a.content,
      occurredAt: a.occurredAt,
      status: a.isResolved ? 'RESOLVED' : 'WARN'
    }));
  } catch (err) {
    console.error('Failed to load alerts', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAlerts();
});
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
