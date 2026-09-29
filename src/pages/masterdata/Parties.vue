<template>
  <div class="master-data-page">
    <PageHeader title="主体登记" subtitle="登记生产、加工、仓储、物流及医疗机构主体主数据" />
    <div class="panel" style="padding:12px; margin-bottom:16px; display:flex; gap:8px; flex-wrap:wrap">
      <el-input v-model="query.partyName" placeholder="主体名称" clearable style="width:180px" />
      <el-select v-model="query.partyType" placeholder="主体类型" clearable style="width:160px"><el-option v-for="item in partyTypes" :key="item.value" :label="item.label" :value="item.value" /></el-select>
      <el-input v-model="query.regionCode" placeholder="行政区划编码" clearable style="width:160px" />
      <el-select v-model="query.status" placeholder="状态" clearable style="width:120px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select>
      <el-button type="primary" @click="page = 1; load()">查询</el-button><el-button @click="resetQuery">重置</el-button>
    </div>
    <div class="panel" style="margin-bottom:16px">
      <el-table :data="parties" v-loading="loading"><el-table-column prop="partyId" label="主体 ID" min-width="150" /><el-table-column prop="partyName" label="主体名称" min-width="200" /><el-table-column prop="partyType" label="类型" min-width="130" /><el-table-column prop="regionCode" label="地区" min-width="110" /><el-table-column prop="status" label="状态" width="100" /><el-table-column label="操作" width="135"><template #default="{ row }"><el-button link type="primary" @click="viewParty(row.partyId)">详情</el-button><el-button link @click="editParty(row.partyId)">编辑</el-button></template></el-table-column></el-table>
      <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total" layout="total, prev, pager, next" @current-change="load" />
    </div>
    <el-drawer v-model="detailVisible" title="主体详情" size="520px"><el-descriptions v-if="detail" :column="1" border><el-descriptions-item v-for="key in detailKeys" :key="key" :label="key">{{ detail[key] ?? '-' }}</el-descriptions-item></el-descriptions><template #footer><el-button v-if="detail" type="primary" @click="editParty(detail.partyId)">编辑</el-button></template></el-drawer>
    <el-dialog v-model="editVisible" title="编辑主体" width="620px"><el-form label-position="top"><el-form-item label="主体名称" required><el-input v-model="editForm.partyName" /></el-form-item><el-form-item label="主体类型" required><el-select v-model="editForm.partyType"><el-option v-for="item in partyTypes" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item><el-form-item label="行政区划编码"><el-input v-model="editForm.regionCode" /></el-form-item><el-form-item label="扩展属性 JSON"><el-input v-model="editForm.attributes" type="textarea" :rows="4" /></el-form-item><el-form-item label="状态"><el-select v-model="editForm.status"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select></el-form-item></el-form><template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="saveEdit">保存</el-button></template></el-dialog>

    <div class="workspace-grid">
      <section class="panel form-panel">
        <div class="panel-header"><h2>登记信息</h2></div>
        <div class="panel-body">
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <div class="form-grid">
              <el-form-item label="主体名称" prop="partyName">
                <el-input v-model="form.partyName" maxlength="200" placeholder="请输入主体全称" />
              </el-form-item>
              <el-form-item label="主体类型" prop="partyType">
                <el-select v-model="form.partyType" style="width: 100%">
                  <el-option v-for="item in partyTypes" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item label="行政区划编码" prop="regionCode">
              <el-input v-model="form.regionCode" maxlength="12" placeholder="例如：532601" />
            </el-form-item>
            <el-form-item label="扩展属性 JSON" prop="attributes">
              <el-input
                v-model="form.attributes"
                type="textarea"
                :rows="8"
                placeholder='{"creditCode":"91532600XXXXXXXXXX","contactName":"张三"}'
              />
            </el-form-item>
            <div class="form-actions">
              <el-button @click="resetForm">重置</el-button>
              <el-button type="primary" :loading="submitting" @click="submit">提交登记</el-button>
            </div>
          </el-form>
        </div>
      </section>

      <aside class="panel result-panel">
        <div class="panel-header"><h2>登记结果</h2></div>
        <div class="panel-body">
          <el-empty v-if="!result" description="提交后显示接口返回结果" :image-size="72" />
          <el-descriptions v-else :column="1" border>
            <el-descriptions-item label="主体 ID"><span class="mono">{{ result.partyId }}</span></el-descriptions-item>
            <el-descriptions-item label="主体状态"><StatusTag :code="result.status" /></el-descriptions-item>
            <el-descriptions-item label="主体名称">{{ submittedName }}</el-descriptions-item>
            <el-descriptions-item label="主体类型">{{ submittedType }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { masterDataApi, type PartyResponse, type PartyManagement } from '@/api/masterData';
import { apiErrorMessage } from '@/api/client';

const partyTypes = [
  { label: 'PRODUCER - 生产主体', value: 'PRODUCER' },
  { label: 'PROCESSOR - 加工企业', value: 'PROCESSOR' },
  { label: 'WAREHOUSE - 仓储主体', value: 'WAREHOUSE' },
  { label: 'LOGISTICS - 物流主体', value: 'LOGISTICS' },
  { label: 'HOSPITAL - 医疗机构', value: 'HOSPITAL' }
];

const initialForm = () => ({ partyName: '', partyType: 'PRODUCER', regionCode: '', attributes: '' });
const formRef = ref<FormInstance>();
const form = reactive(initialForm());
const submitting = ref(false);
const result = ref<PartyResponse | null>(null);
const submittedName = ref('');
const submittedType = ref('');
const query = reactive({ partyName:'', partyType:'', regionCode:'', status:'' });
const parties = ref<PartyManagement[]>([]);
const detail = ref<PartyManagement | null>(null);
const page = ref(1), size = ref(20), total = ref(0), loading = ref(false), detailVisible = ref(false), editVisible = ref(false), editingId = ref('');
const editForm = reactive({ partyName:'',partyType:'',regionCode:'',attributes:'',status:'ACTIVE',lockVersion:0 });
const detailKeys: (keyof PartyManagement)[] = ['partyId','tenantId','partyName','partyType','regionCode','status','attributes','lockVersion','createdAt','updatedAt'];
async function load() { loading.value = true; try { const res = await masterDataApi.getPartyPage({ ...query,page:page.value,size:size.value }); parties.value = res.records || []; total.value = Number(res.total || 0); } catch(e) { ElMessage.error(apiErrorMessage(e,'主体查询失败')); } finally { loading.value = false; } }
function resetQuery() { Object.assign(query,{partyName:'',partyType:'',regionCode:'',status:''}); page.value=1; void load(); }
async function viewParty(id:string) { try { detail.value=await masterDataApi.getPartyById(String(id)); detailVisible.value=true; } catch(e) { ElMessage.error(apiErrorMessage(e,'详情查询失败')); } }
async function editParty(id:string) { try { const item=await masterDataApi.getPartyById(String(id)); editingId.value=String(id); Object.assign(editForm,{partyName:item.partyName,partyType:item.partyType,regionCode:item.regionCode || '',attributes:item.attributes || '',status:item.status,lockVersion:item.lockVersion}); detailVisible.value=false; editVisible.value=true; } catch(e) { ElMessage.error(apiErrorMessage(e,'详情查询失败')); } }
async function saveEdit() { if (!editForm.partyName.trim() || !editForm.partyType) { ElMessage.warning('请填写名称和类型'); return; } try { if (editForm.attributes.trim()) JSON.parse(editForm.attributes); } catch { ElMessage.warning('扩展属性不是合法 JSON'); return; } submitting.value=true; try { await masterDataApi.updateParty(editingId.value,{...editForm}); editVisible.value=false; ElMessage.success('保存成功'); await load(); } catch(e) { ElMessage.error(apiErrorMessage(e,'更新失败')); } finally { submitting.value=false; } }
onMounted(load);

const validateJson = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value.trim()) return callback();
  try {
    JSON.parse(value);
    callback();
  } catch {
    callback(new Error('请输入合法的 JSON 字符串'));
  }
};

const rules: FormRules = {
  partyName: [{ required: true, message: '请输入主体名称', trigger: 'blur' }],
  partyType: [{ required: true, message: '请选择主体类型', trigger: 'change' }],
  attributes: [{ validator: validateJson, trigger: 'blur' }]
};

const resetForm = () => {
  Object.assign(form, initialForm());
  formRef.value?.clearValidate();
  result.value = null;
};

const submit = async () => {
  if (!await formRef.value?.validate().catch(() => false)) return;
  submitting.value = true;
  try {
    result.value = await masterDataApi.registerParty({
      partyName: form.partyName.trim(),
      partyType: form.partyType,
      regionCode: form.regionCode.trim() || undefined,
      attributes: form.attributes.trim() || undefined
    });
    submittedName.value = form.partyName.trim();
    submittedType.value = form.partyType;
    ElMessage.success('主体登记成功');
    await load();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '主体登记失败'));
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.workspace-grid { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.75fr); gap: 16px; align-items: start; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.result-panel { min-height: 260px; }
@media (max-width: 960px) { .workspace-grid, .form-grid { grid-template-columns: 1fr; } }
</style>
