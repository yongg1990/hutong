<template>
  <div>
    <PageHeader title="交换数据查询" subtitle="授权范围内的对象、事件、处理状态和已发布元数据" />
    <el-tabs v-model="kind" @tab-change="result=null"><el-tab-pane label="业务对象" name="objects" /><el-tab-pane label="事件" name="events" /><el-tab-pane label="事件处理状态" name="status" /><el-tab-pane label="已发布元数据" name="metadata" /></el-tabs>
    <el-form label-position="top" class="query-grid" @submit.prevent="query">
      <el-form-item :label="kind==='metadata'?'规范包代码':'查询 ID'" required><el-input v-model="id" /></el-form-item>
      <el-form-item v-if="kind==='metadata'" label="版本（可选）"><el-input v-model="version" /></el-form-item>
      <template v-else>
        <el-form-item label="项目空间 ID" required><el-input v-model="params.projectSpaceId" /></el-form-item>
        <el-form-item label="访问用途" required><el-input v-model="params.purposeCode" /></el-form-item>
        <el-form-item label="主体类型" required><el-select v-model="params.subjectType"><el-option v-for="v in ['EVENT','OBJECT','BATCH']" :key="v" :value="v" :label="v" /></el-select></el-form-item>
        <el-form-item label="主体 ID" required><el-input v-model="params.subjectId" /></el-form-item>
        <el-form-item label="展开项（可选）"><el-input v-model="params.expand" /></el-form-item>
      </template>
      <el-form-item><el-button type="primary" :icon="Search" :loading="loading" @click="query">查询</el-button></el-form-item>
    </el-form>
    <el-descriptions v-if="result" :column="1" border><el-descriptions-item v-for="(value,key) in result" :key="key" :label="String(key)"><pre>{{ format(value) }}</pre></el-descriptions-item></el-descriptions>
    <el-empty v-else description="暂无查询结果" />
  </div>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { exchangeConfigApi, type ConfigRecord } from '@/api/exchangeConfig';
import { apiErrorMessage } from '@/api/client';
const kind=ref<'objects'|'events'|'status'|'metadata'>('objects'),id=ref(''),version=ref(''),loading=ref(false),result=ref<ConfigRecord|null>(null);
const params=reactive({projectSpaceId:localStorage.getItem('tcmirp_project_space_id')||'',purposeCode:localStorage.getItem('tcmirp_purpose_code')||'TRACE',subjectType:'OBJECT',subjectId:'',expand:''});
const format=(value:unknown)=>typeof value==='object'?JSON.stringify(value,null,2):String(value??'-');
async function query(){if(!id.value.trim()){ElMessage.warning('请输入查询标识');return;}if(kind.value!=='metadata'&&(!/^\d+$/.test(id.value.trim())||!/^\d+$/.test(params.projectSpaceId)||!/^\d+$/.test(params.subjectId)||!params.purposeCode.trim())){ElMessage.warning('请填写数字 ID、项目空间、主体和访问用途');return;}loading.value=true;result.value=null;try{result.value=kind.value==='metadata'?await exchangeConfigApi.metadata(id.value.trim(),version.value):await exchangeConfigApi.query(kind.value,id.value.trim(),{...params,expand:params.expand||undefined,includeRaw:false});}catch(e){ElMessage.error(apiErrorMessage(e,'查询失败'));}finally{loading.value=false;}}
</script>
<style scoped>.query-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 16px}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}@media(max-width:900px){.query-grid{grid-template-columns:1fr}}</style>
