<template>
  <div class="operations-page">
    <PageHeader
      title="订阅与作业 Task"
      subtitle="定时重试、补偿作业、后台批处理与死信队列 DLQ 监控"
    />
    <el-alert type="info" :closable="false" title="当前 Swagger 不提供作业列表或通用触发接口；下方作业数据仅供演示。正式订阅和回调请使用下面的操作区。" />
    <div class="panel" style="padding:16px; margin:12px 0"><div class="toolbar"><el-input v-model="messageId" placeholder="回调消息 ID" style="width:240px" /><el-switch v-model="includeAttempts" active-text="包含尝试" /><el-button type="primary" :loading="loadingDelivery" @click="queryDelivery">查询回调</el-button><el-button type="primary" @click="createVisible=true">创建订阅</el-button></div><el-descriptions v-if="delivery" :column="1" border><el-descriptions-item v-for="(value,key) in delivery" :key="key" :label="String(key)"><pre>{{ format(value) }}</pre></el-descriptions-item></el-descriptions><div v-if="delivery" class="toolbar"><el-button @click="replayVisible=true">人工重放</el-button></div></div>
    <el-dialog v-model="createVisible" title="创建订阅" width="600px"><el-form label-position="top"><el-form-item label="订阅代码" required><el-input v-model="subscriptionForm.subscriptionCode" /></el-form-item><el-form-item label="版本" required><el-input v-model="subscriptionForm.version" /></el-form-item><el-form-item label="HTTPS 回调地址" required><el-input v-model="subscriptionForm.callbackUrl" /></el-form-item><el-form-item label="事件过滤 JSON" required><el-input v-model="filterText" type="textarea" /></el-form-item><el-form-item label="重试退避秒数（逗号分隔）" required><el-input v-model="backoffText" /></el-form-item><el-form-item label="要求签名"><el-switch v-model="subscriptionForm.signatureRequired" /></el-form-item><el-form-item v-if="subscriptionForm.signatureRequired" label="签名算法"><el-input v-model="subscriptionForm.signatureAlgorithm" /></el-form-item><el-form-item label="状态"><el-select v-model="subscriptionForm.status"><el-option v-for="value in ['DRAFT','ACTIVE','SUSPENDED','RETIRED']" :key="value" :label="value" :value="value" /></el-select></el-form-item></el-form><template #footer><el-button @click="createVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="createSubscription">创建</el-button></template></el-dialog>
    <el-dialog v-model="replayVisible" title="人工重放" width="460px"><el-form label-position="top"><el-form-item label="原因" required><el-input v-model="reason" /></el-form-item><el-form-item label="锁版本" required><el-input-number v-model="lockVersion" :min="0" /></el-form-item></el-form><template #footer><el-button @click="replayVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="replay">提交</el-button></template></el-dialog>
    <el-drawer v-model="resultVisible" title="订阅创建结果" size="500px"><el-descriptions v-if="createdSubscription" :column="1" border><el-descriptions-item v-for="(value,key) in createdSubscription" :key="key" :label="String(key)">{{ format(value) }}</el-descriptions-item></el-descriptions></el-drawer>

    <div class="panel">
      <el-table :data="jobs">
        <el-table-column prop="jobId" label="作业 ID *" width="160" class-name="mono" />
        <el-table-column prop="name" label="作业任务名称 *" min-width="200" />
        <el-table-column prop="triggerType" label="触发机制 *" width="130" />
        <el-table-column prop="cronExpr" label="Cron 表达式 *" width="140" class-name="mono" />
        <el-table-column prop="lastRun" label="上次执行时间 *" width="160" />
        <el-table-column label="作业状态 *" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" link disabled>未发布触发接口</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { settingsApi } from '@/api/settings';
import { extendedServices } from '@/api/extendedServices';
import { apiErrorMessage } from '@/api/client';
const messageId=ref(''), includeAttempts=ref(true), delivery=ref<Record<string,unknown>|null>(null), createdSubscription=ref<Record<string,unknown>|null>(null);
const loadingDelivery=ref(false), saving=ref(false), createVisible=ref(false), replayVisible=ref(false), resultVisible=ref(false);
const subscriptionForm=reactive({subscriptionCode:'',version:'1.0.0',callbackUrl:'',httpMethod:'POST' as const,signatureRequired:true,signatureAlgorithm:'HMAC-SHA256',status:'DRAFT'});
const filterText=ref('{}'), backoffText=ref('5,30,120'), reason=ref(''), lockVersion=ref(0);
const format=(value:unknown)=>typeof value==='object'?JSON.stringify(value,null,2):String(value??'-');
async function queryDelivery(){if(!messageId.value.trim()){ElMessage.warning('请输入消息 ID');return;}loadingDelivery.value=true;try{delivery.value=await extendedServices.getDelivery(messageId.value.trim(),includeAttempts.value);}catch(e){delivery.value=null;ElMessage.error(apiErrorMessage(e,'投递查询失败'));}finally{loadingDelivery.value=false;}}
async function createSubscription(){if(!subscriptionForm.subscriptionCode||!subscriptionForm.version||!/^https:\/\//.test(subscriptionForm.callbackUrl)){ElMessage.warning('请填写代码、版本和 HTTPS 地址');return;}let eventFilterJson:Record<string,unknown>;try{const parsed=JSON.parse(filterText.value);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw Error();eventFilterJson=parsed;}catch{ElMessage.warning('过滤条件必须是 JSON 对象');return;}const retryBackoffSeconds=backoffText.value.split(',').map(Number);if(!retryBackoffSeconds.length||retryBackoffSeconds.some(v=>!Number.isInteger(v)||v<0)){ElMessage.warning('退避秒数不合法');return;}saving.value=true;try{createdSubscription.value=await extendedServices.createSubscription({...subscriptionForm,eventFilterJson,retryBackoffSeconds});createVisible.value=false;resultVisible.value=true;ElMessage.success('订阅创建成功');}catch(e){ElMessage.error(apiErrorMessage(e,'创建失败'));}finally{saving.value=false;}}
async function replay(){if(!reason.value.trim()){ElMessage.warning('请输入原因');return;}saving.value=true;try{await extendedServices.replayDelivery(messageId.value.trim(),reason.value.trim(),lockVersion.value);replayVisible.value=false;ElMessage.success('重放已提交');await queryDelivery();}catch(e){ElMessage.error(apiErrorMessage(e,'重放失败'));}finally{saving.value=false;}}

const jobs = ref<any[]>([]);
const loading = ref(false);

const loadJobs = async () => {
  loading.value = true;
  try {
    const res = await settingsApi.getJobs();
    jobs.value = res.map(j => ({
      jobId: j.jobId,
      name: j.name,
      triggerType: 'Cron 定时',
      cronExpr: j.cronExpr,
      lastRun: j.lastRunTime,
      status: j.status === 'RUNNING' ? 'ACTIVE' : j.status
    }));
  } catch (err) {
    console.error('Failed to load jobs', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadJobs();
});

</script>

<style scoped>
.panel {
  margin-top: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
