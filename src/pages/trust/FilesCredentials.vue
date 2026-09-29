<template>
  <div class="trust-page">
    <PageHeader title="文件上传与凭证" subtitle="文件会话、元数据和脱敏凭证">
      <template #actions><el-button type="primary" @click="openCreate">{{ tab === 'files' ? '创建上传会话' : '登记凭证' }}</el-button></template>
    </PageHeader>
    <el-tabs v-model="tab"><el-tab-pane label="文件" name="files" /><el-tab-pane label="脱敏凭证" name="credentials" /></el-tabs>
    <div class="panel body">
      <div class="toolbar"><el-input v-model="lookupId" :placeholder="tab === 'files' ? '文件 ID 或上传会话 ID' : '凭证 ID'" clearable style="max-width:300px" /><el-button type="primary" :loading="loading" @click="lookup">查询</el-button><el-switch v-if="tab === 'files'" v-model="sessionLookup" active-text="按会话查询" inactive-text="按文件查询" /></div>
      <el-alert v-if="tab === 'files'" type="info" :closable="false" title="创建会话后按返回的上传 URL 传输文件，取得对象版本或 ETag 后确认完成。文件内容不通过业务 JSON 接口上传。" />
      <el-descriptions v-if="result" :column="1" border style="margin-top:16px"><el-descriptions-item v-for="(value,key) in result" :key="key" :label="String(key)"><pre>{{ format(value) }}</pre></el-descriptions-item></el-descriptions>
      <el-empty v-else description="输入 ID 查询，或创建记录" />
      <UploadSessionTransfer v-if="tab==='files' && sessionLookup && result?.uploadUrl" :key="lookupId" :upload-url="String(result.uploadUrl)" @uploaded="objectVersion=$event" />
      <div v-if="tab === 'files' && sessionLookup && result" class="toolbar"><el-input v-model="objectVersion" placeholder="对象版本或 ETag" style="max-width:280px" /><el-button type="primary" :loading="saving" @click="complete">确认上传完成</el-button></div>
    </div>
    <el-dialog v-model="dialogVisible" :title="tab === 'files' ? '创建上传会话' : '登记脱敏凭证'" width="620px" destroy-on-close>
      <el-form v-if="tab === 'files'" label-position="top"><el-form-item label="文件名" required><el-input v-model="fileForm.fileName" /></el-form-item><el-form-item label="内容类型" required><el-input v-model="fileForm.contentType" placeholder="application/pdf" /></el-form-item><el-form-item label="文件字节数"><el-input v-model="fileForm.sizeBytes" /></el-form-item><el-form-item label="SHA-256 摘要"><el-input v-model="fileForm.contentDigest" placeholder="sha256:..." /></el-form-item><el-form-item label="业务用途" required><el-select v-model="fileForm.businessPurpose"><el-option v-for="value in ['QUALITY_EVIDENCE','TRACE_EVIDENCE','BATCH_INPUT']" :key="value" :label="value" :value="value" /></el-select></el-form-item><el-form-item label="存储范围" required><el-select v-model="fileForm.storageScope"><el-option label="租户私有" value="TENANT_PRIVATE" /><el-option label="共享交换" value="SHARED_EXCHANGE" /></el-select></el-form-item><el-form-item label="安全级别"><el-select v-model="fileForm.securityClass"><el-option v-for="value in ['PUBLIC','INTERNAL','SENSITIVE','STRICT_SENSITIVE']" :key="value" :label="value" :value="value" /></el-select></el-form-item></el-form>
      <el-form v-else label-position="top"><el-form-item label="凭证类型" required><el-input v-model="credentialForm.credentialType" /></el-form-item><el-form-item label="签发方主体 ID" required><el-input v-model="credentialForm.issuerPartyId" /></el-form-item><el-form-item label="持有方主体 ID" required><el-input v-model="credentialForm.subjectPartyId" /></el-form-item><el-form-item label="凭证号不可逆摘要" required><el-input v-model="credentialForm.credentialNoHash" /></el-form-item><el-form-item label="生效时间"><el-date-picker v-model="credentialForm.validFrom" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" /></el-form-item><el-form-item label="失效时间"><el-date-picker v-model="credentialForm.validTo" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" /></el-form-item><el-form-item label="非敏感属性 JSON"><JsonEditor v-model="attributesText" :rows="5" label="非敏感属性 JSON" /></el-form-item></el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="submit">提交</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import JsonEditor from '@/components/common/JsonEditor.vue';
import UploadSessionTransfer from '@/components/common/UploadSessionTransfer.vue';
import { extendedServices } from '@/api/extendedServices';
import { apiErrorMessage } from '@/api/client';
const tab = ref<'files'|'credentials'>('files'), lookupId = ref(''), sessionLookup = ref(true), objectVersion = ref('');
const result = ref<Record<string,unknown>|null>(null), loading = ref(false), saving = ref(false), dialogVisible = ref(false);
const fileForm = reactive({ fileName:'',contentType:'application/pdf',sizeBytes:'',contentDigest:'',businessPurpose:'QUALITY_EVIDENCE',storageScope:'TENANT_PRIVATE',securityClass:'INTERNAL' });
const credentialForm = reactive({ credentialType:'',issuerPartyId:'',subjectPartyId:'',credentialNoHash:'',validFrom:'',validTo:'' });
const attributesText = ref('{}');
watch([tab,sessionLookup],()=>{result.value=null;lookupId.value='';objectVersion.value='';},{flush:'sync'});
const format = (value:unknown) => typeof value === 'object' ? JSON.stringify(value,null,2) : String(value ?? '-');
function openCreate() { dialogVisible.value=true; }
async function lookup() { if (!/^\d+$/.test(lookupId.value.trim())) { ElMessage.warning('请输入数字字符串 ID'); return; } loading.value=true; try { result.value = tab.value === 'credentials' ? await extendedServices.getCredential(lookupId.value) : sessionLookup.value ? await extendedServices.getUploadSession(lookupId.value) : await extendedServices.getFile(lookupId.value); } catch(e) { result.value=null; ElMessage.error(apiErrorMessage(e,'查询失败')); } finally { loading.value=false; } }
async function submit() { saving.value=true; try { if (tab.value === 'files') { if (!fileForm.fileName.trim() || !fileForm.contentType.trim()) { ElMessage.warning('请填写文件名和内容类型'); return; } const session=await extendedServices.createUploadSession({ ...fileForm, sizeBytes:fileForm.sizeBytes || undefined,contentDigest:fileForm.contentDigest || undefined }); sessionLookup.value=true;result.value=session;lookupId.value=session.uploadSessionId;objectVersion.value=''; } else { if (!credentialForm.credentialType || !/^\d+$/.test(credentialForm.issuerPartyId) || !/^\d+$/.test(credentialForm.subjectPartyId) || !credentialForm.credentialNoHash) { ElMessage.warning('请填写凭证类型、主体 ID 和摘要'); return; } result.value=await extendedServices.createCredential({...credentialForm,validFrom:credentialForm.validFrom || undefined,validTo:credentialForm.validTo || undefined,attributes:JSON.parse(attributesText.value)}); lookupId.value=String(result.value.id || result.value.credentialId || ''); } dialogVisible.value=false; ElMessage.success('提交成功'); } catch(e) { ElMessage.error(apiErrorMessage(e,'提交失败，请检查 JSON 和请求字段')); } finally { saving.value=false; } }
async function complete() { if (!lookupId.value || !objectVersion.value.trim()) { ElMessage.warning('请输入会话 ID 和对象版本'); return; } saving.value=true; try { const file=await extendedServices.completeUpload(lookupId.value,objectVersion.value.trim()); sessionLookup.value=false; result.value=file; lookupId.value=String(file.fileId||file.id||''); ElMessage.success('完成确认已提交'); } catch(e) { ElMessage.error(apiErrorMessage(e,'确认失败')); } finally { saving.value=false; } }
</script>
<style scoped>.body{padding:16px}.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}</style>
