<template>
  <div>
    <PageHeader title="互通规范配置" subtitle="版本、数据集、字段规则、一致性用例和项目绑定">
      <template #actions><el-button :icon="Plus" type="primary" @click="openForm()">新建{{ definition.title }}</el-button></template>
    </PageHeader>
    <el-tabs v-model="kind" @tab-change="resetList"><el-tab-pane v-for="(item,key) in configDefinitions" :key="key" :label="item.title" :name="key" /></el-tabs>
    <div class="toolbar">
      <el-input v-model="parentId" :placeholder="parentLabel" clearable style="max-width:300px" @keyup.enter="load" />
      <el-button type="primary" :loading="loading" :icon="Search" @click="load">查询</el-button>
    </div>
    <el-table :data="rows" v-loading="loading" border>
      <el-table-column prop="id" label="ID" min-width="180" />
      <el-table-column v-for="field in definition.fields" :key="field.key" :prop="field.key" :label="field.label" min-width="150" show-overflow-tooltip>
        <template #default="{row}">{{ format(row[field.key]) }}</template>
      </el-table-column>
      <el-table-column prop="status" v-if="!definition.fields.some(f=>f.key==='status')" label="状态" width="120" />
      <el-table-column label="操作" :width="kind==='version'?240:130" fixed="right"><template #default="{row}">
        <el-button link type="primary" @click="showResult(row)">详情</el-button>
        <el-button v-if="kind!=='version'" link @click="openForm(row)">编辑</el-button>
        <el-button v-if="kind==='version'" link :disabled="row.status==='PUBLISHED'||busy" @click="versionAction(row,'test')">测试</el-button>
        <el-button v-if="kind==='version'" link type="primary" :disabled="row.status!=='TESTED'||busy" @click="versionAction(row,'publish')">发布</el-button>
      </template></el-table-column>
    </el-table>
    <el-dialog v-model="formVisible" :title="`${editingId?'编辑':'新建'}${definition.title}`" width="min(680px, 94vw)" :close-on-click-modal="false" destroy-on-close>
      <el-form label-position="top"><el-form-item v-for="field in definition.fields" :key="field.key" :label="field.label" :required="field.required">
        <el-select v-if="field.options" v-model="form[field.key]" style="width:100%"><el-option v-for="option in field.options" :key="option" :value="option" :label="option" /></el-select>
        <el-date-picker v-else-if="field.type==='date'" v-model="form[field.key]" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
        <el-input-number v-else-if="field.type==='number'" v-model="form[field.key]" :min="0" :precision="0" />
        <JsonEditor v-else-if="field.type==='json'" v-model="form[field.key]" :rows="6" :label="field.label" />
        <el-input v-else v-model="form[field.key]" />
      </el-form-item></el-form>
      <template #footer><el-button @click="formVisible=false">取消</el-button><el-button type="primary" :loading="busy" @click="save">保存</el-button></template>
    </el-dialog>
    <el-drawer v-model="detailVisible" title="配置与操作结果" size="min(680px, 94vw)"><el-descriptions :column="1" border><el-descriptions-item v-for="(value,key) in detail" :key="key" :label="String(key)"><pre>{{ format(value) }}</pre></el-descriptions-item></el-descriptions></el-drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import JsonEditor from '@/components/common/JsonEditor.vue';
import { configDefinitions, exchangeConfigApi, type ConfigKind, type ConfigRecord } from '@/api/exchangeConfig';
import { apiErrorMessage } from '@/api/client';
const route=useRoute();
const kind=ref<ConfigKind>('version'), parentId=ref(String(route.query.profileId||''));
const definition=computed(()=>configDefinitions[kind.value]);
const parentLabel=computed(()=>({version:'规范包 ID',dataset:'规范版本 ID',rule:'数据集 ID',case:'规范版本 ID',binding:'项目空间 ID'}[kind.value]));
const rows=ref<ConfigRecord[]>([]), form=ref<ConfigRecord>({}), detail=ref<ConfigRecord>({});
const editingId=ref(''), loading=ref(false), busy=ref(false), formVisible=ref(false), detailVisible=ref(false);
const format=(value:unknown)=>typeof value==='object'?JSON.stringify(value,null,2):String(value??'-');
function resetList(){rows.value=[];parentId.value='';}
async function load(){if(!/^\d+$/.test(parentId.value.trim())){ElMessage.warning(`请输入${parentLabel.value}`);return;}loading.value=true;try{rows.value=await exchangeConfigApi.list(kind.value,parentId.value.trim());}catch(e){rows.value=[];ElMessage.error(apiErrorMessage(e,'查询失败'));}finally{loading.value=false;}}
function showResult(value:ConfigRecord){detail.value=value;detailVisible.value=true;}
function openForm(row?:ConfigRecord){editingId.value=row?String(row.id):'';form.value={};for(const field of definition.value.fields){const value=row?.[field.key]??field.initial??'';form.value[field.key]=field.type==='json'&&typeof value!=='string'?JSON.stringify(value,null,2):value;}const parentKey={version:'profileId',dataset:'profileVersionId',rule:'datasetId',case:'profileVersionId',binding:'projectSpaceId'}[kind.value];if(!row&&parentId.value)form.value[parentKey]=parentId.value;formVisible.value=true;}
async function save(){const payload:ConfigRecord={};for(const field of definition.value.fields){const value=form.value[field.key];if(field.required&&(value===undefined||value===null||String(value).trim()==='')){ElMessage.warning(`请填写${field.label}`);return;}if(value===''||value===null||value===undefined)continue;if(field.key.endsWith('Id')&&!/^\d+$/.test(String(value))){ElMessage.warning(`${field.label}必须是数字字符串`);return;}try{payload[field.key]=field.type==='json'?JSON.parse(value):value;}catch{ElMessage.warning(`${field.label}格式不正确`);return;}}
  busy.value=true;try{const result=await exchangeConfigApi.save(kind.value,payload,editingId.value||undefined);formVisible.value=false;showResult(result);ElMessage.success('保存成功');const parentKey={version:'profileId',dataset:'profileVersionId',rule:'datasetId',case:'profileVersionId',binding:'projectSpaceId'}[kind.value];parentId.value=String(payload[parentKey]);await load();}catch(e){ElMessage.error(apiErrorMessage(e,'保存失败'));}finally{busy.value=false;}}
async function versionAction(row:ConfigRecord,action:'test'|'publish'){try{await ElMessageBox.confirm(action==='publish'?'确认发布该规范版本？':'确认执行该版本的一致性用例？','确认操作',{type:'warning'});}catch{return;}busy.value=true;try{showResult(await exchangeConfigApi.versionAction(String(row.id),action));ElMessage.success(action==='publish'?'发布成功':'测试已执行，请查看结果');await load();}catch(e){ElMessage.error(apiErrorMessage(e,'操作失败'));}finally{busy.value=false;}}
</script>
<style scoped>.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}</style>
