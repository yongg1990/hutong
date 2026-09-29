<template>
  <div class="transfer">
    <div class="toolbar">
      <input type="file" aria-label="选择上传文件" @change="selectFile" />
      <el-select v-model="method" style="width:110px"><el-option value="PUT" label="PUT" /><el-option value="POST" label="POST" /></el-select>
      <el-button :icon="Upload" :loading="uploading" :disabled="!file || !uploadUrl" @click="transfer">上传文件</el-button>
    </div>
    <el-progress v-if="uploading" :percentage="progress" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { Upload } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
const props=defineProps<{uploadUrl:string}>();
const emit=defineEmits<{uploaded:[objectVersion:string]}>();
const file=ref<File|null>(null),method=ref<'PUT'|'POST'>('PUT'),uploading=ref(false),progress=ref(0);
function selectFile(event:Event){file.value=(event.target as HTMLInputElement).files?.[0]||null;emit('uploaded','');}
async function transfer(){if(!file.value||!props.uploadUrl)return;uploading.value=true;progress.value=0;try{
  const url=new URL(props.uploadUrl,window.location.origin);if(!['http:','https:'].includes(url.protocol))throw new Error('上传 URL 不合法');
  // Storage requests intentionally bypass platform authentication interceptors.
  const response=await axios.request({url:url.href,method:method.value,data:file.value,headers:{'Content-Type':file.value.type||'application/octet-stream'},onUploadProgress:e=>{progress.value=e.total?Math.round(e.loaded/e.total*100):0;}});
  const version=String(response.headers['x-amz-version-id']||response.headers['x-oss-version-id']||response.headers.etag||'');
  emit('uploaded',version);ElMessage.success(version?'文件传输完成':'文件传输完成，请填写对象版本或 ETag');
}catch(e){ElMessage.error(e instanceof Error?`文件传输失败：${e.message}`:'文件传输失败');}finally{uploading.value=false;}}
</script>
<style scoped>.transfer{margin:16px 0}.toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}input{max-width:100%}</style>
