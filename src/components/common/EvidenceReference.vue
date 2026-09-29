<template>
  <div>
    <el-input v-model="id" placeholder="真实证据 ID" />
    <div class="actions"><el-button :icon="Search" :loading="loading" @click="lookup">查询证据</el-button><el-button @click="$router.push('/trust/evidence')">登记证据</el-button></div>
    <el-descriptions v-if="record" :column="1" border>
      <el-descriptions-item label="证据 ID">{{ record.evidenceId }}</el-descriptions-item>
      <el-descriptions-item label="证据类型">{{ record.type }}</el-descriptions-item>
      <el-descriptions-item label="主体">{{ record.subjectType }} / {{ record.subjectId }}</el-descriptions-item>
      <el-descriptions-item label="摘要"><span class="digest">{{ record.fileHash }}</span></el-descriptions-item>
      <el-descriptions-item label="状态">{{ record.status }}</el-descriptions-item>
    </el-descriptions>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { trustApi, type EvidenceItem } from '@/api/trust';
import { apiErrorMessage } from '@/api/client';
const id=ref(''),loading=ref(false),record=ref<EvidenceItem|null>(null);
async function lookup(){if(!/^\d+$/.test(id.value.trim())){ElMessage.warning('请输入真实证据 ID');return;}loading.value=true;record.value=null;try{record.value=(await trustApi.getEvidenceList({evidenceId:id.value.trim()}))[0]||null;}catch(e){ElMessage.error(apiErrorMessage(e,'证据查询失败'));}finally{loading.value=false;}}
</script>
<style scoped>.actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.digest{overflow-wrap:anywhere}</style>
