<template>
  <div>
    <PageHeader title="租户上传文件" />
    <ResourceWorkbench ref="workbench" list-path="/tenant-access/files" detail-path="/tenant-access/files/{id}" :filters="filters" :columns="columns">
      <template #filter-actions><el-button :icon="Upload" type="primary" @click="uploadVisible = true">上传文件</el-button></template>
      <template #actions><el-input v-model="downloadTenantId" placeholder="下载目标租户 ID" style="max-width:220px" /><el-input v-model="downloadId" placeholder="文件 ID" style="max-width:220px" /><el-button :icon="Download" :loading="downloading" @click="download">下载文件</el-button></template>
      <template #row-actions="{ row }"><el-button link :icon="Download" :disabled="downloading" @click="downloadRow(row)">下载</el-button></template>
    </ResourceWorkbench>
    <el-dialog v-model="uploadVisible" title="上传文件" width="min(520px, 94vw)" :close-on-click-modal="false">
      <el-form label-position="top"><el-form-item label="租户 ID"><el-input v-model="form.tenantId" /></el-form-item><el-form-item label="模板类型" required><el-input v-model="form.templateType" /></el-form-item><el-form-item label="模板版本" required><el-input v-model="form.templateVersion" /></el-form-item><el-form-item label="文件" required><input type="file" @change="selectFile" /></el-form-item></el-form>
      <template #footer><el-button @click="uploadVisible = false">取消</el-button><el-button type="primary" :loading="uploading" @click="upload">上传</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload, Download } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ResourceWorkbench from '@/components/common/ResourceWorkbench.vue';
import { request, apiErrorMessage } from '@/api/client';
const workbench = ref<InstanceType<typeof ResourceWorkbench>>();
const uploadVisible = ref(false), uploading = ref(false), downloading = ref(false), downloadId = ref('');
const downloadTenantId = ref('');
const file = ref<File | null>(null), form = ref({ tenantId: '', templateType: 'DATA_ELEMENT', templateVersion: 'v1' });
const filters = [{ key: 'tenantId', label: '租户 ID' }, { key: 'templateType', label: '模板类型' }, { key: 'templateVersion', label: '模板版本' }, { key: 'keyword', label: '原始文件名' }];
const columns = [{ key: 'id', label: '文件 ID', width: 200 }, { key: 'tenantId', label: '租户 ID' }, { key: 'uploadedBy', label: '上传用户 ID', width: 200 }, { key: 'originalName', label: '原始文件名', width: 220 }, { key: 'templateType', label: '模板类型' }, { key: 'templateVersion', label: '模板版本' }, { key: 'fileExtension', label: '扩展名' }, { key: 'sizeBytes', label: '字节数' }, { key: 'contentDigest', label: '内容摘要', width: 220 }, { key: 'createdAt', label: '上传时间', width: 180 }];
function selectFile(event: Event) { file.value = (event.target as HTMLInputElement).files?.[0] || null; }
async function upload() {
  if (uploading.value) return;
  if (form.value.tenantId && !/^\d+$/.test(form.value.tenantId.trim())) return ElMessage.warning('租户 ID 须为数字字符串');
  if (!/^[A-Z][A-Z0-9_]{0,63}$/.test(form.value.templateType.trim()) || !/^[A-Za-z0-9._-]{1,32}$/.test(form.value.templateVersion.trim())) return ElMessage.warning('请填写有效模板类型与版本');
  if (!file.value || !form.value.templateType.trim() || !form.value.templateVersion.trim()) { ElMessage.warning('请选择文件并填写模板类型和版本'); return; }
  uploading.value = true;
  try {
    const data = new FormData();
    data.append('request', new Blob([JSON.stringify({ tenantId: form.value.tenantId.trim() || undefined, templateType: form.value.templateType.trim(), templateVersion: form.value.templateVersion.trim() })], { type: 'application/json' })); data.append('file', file.value);
    const result: any = await request.post('/tenant-access/files', data, { headers: { 'Content-Type': undefined } });
    downloadId.value = String(result.id); downloadTenantId.value = result.tenantId || form.value.tenantId; uploadVisible.value = false; ElMessage.success('上传成功'); await workbench.value?.load();
  } catch (error) { ElMessage.error(apiErrorMessage(error, '上传失败')); }
  finally { uploading.value = false; }
}
async function download() {
  if (downloading.value) return;
  if (!/^\d+$/.test(downloadId.value.trim())) { ElMessage.warning('请输入文件 ID'); return; }
  downloading.value = true;
  try {
    const params = { tenantId: downloadTenantId.value.trim() || undefined };
    const metadata: any = await request.get(`/tenant-access/files/${downloadId.value.trim()}`, { params });
    const blob = await request.get<Blob, Blob>(`/tenant-access/files/${downloadId.value.trim()}/content`, { responseType: 'blob', params });
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = metadata.originalName || `file-${downloadId.value}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) { ElMessage.error(apiErrorMessage(error, '下载失败')); }
  finally { downloading.value = false; }
}
function downloadRow(row: { id: string; tenantId: string }) { if (downloading.value) return; downloadId.value = row.id; downloadTenantId.value = row.tenantId; void download(); }
</script>
