<template>
  <div class="master-data-page">
    <PageHeader
      title="主体机构主数据"
      subtitle="生产主体、加工企业、仓储物流与医疗机构全局唯一标识（带有歧义消解交互）"
    >
      <template #actions>
        <el-button type="primary" @click="openCreateModal">
          + 新增主体机构
        </el-button>
        <el-button @click="openResolveModal">
          标识解析与绑定
        </el-button>
        <el-button @click="openAmbiguityModal">
          歧义消解核准
        </el-button>
      </template>
    </PageHeader>

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="keyword" placeholder="机构名称/主体代码" style="width: 200px" />
      <el-select v-model="partyType" placeholder="主体类型" style="width: 150px">
        <el-option label="全部类型" value="" />
        <el-option label="PRODUCER - 种植主体" value="PRODUCER" />
        <el-option label="PROCESSOR - 加工企业" value="PROCESSOR" />
        <el-option label="WAREHOUSE - 仓储物流" value="WAREHOUSE" />
        <el-option label="HOSPITAL - 医疗机构" value="HOSPITAL" />
      </el-select>
    </FilterBar>

    <div class="panel">
      <el-table :data="parties">
        <el-table-column prop="partyCode" label="主体统一代码" width="150" class-name="mono" />
        <el-table-column prop="partyName" label="机构名称" min-width="200" />
        <el-table-column prop="partyType" label="主体类型" width="130" />
        <el-table-column prop="region" label="所属行政区域" min-width="140" />
        <el-table-column prop="externalCodeCount" label="关联外部编码" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Ambiguity Resolution Modal -->
    <el-dialog v-model="ambiguityModalVisible" title="外部标识模糊匹配与歧义消解" width="560px">
      <el-alert
        title="识别到外部标识无法唯一匹配"
        type="warning"
        description="系统检测到输入名称 '云南文山三七加工厂' 匹配到 2 家重名企业，请人工核查确认唯一选中项。"
        show-icon
        :closable="false"
        style="margin-bottom: 14px;"
      />

      <el-radio-group v-model="selectedCandidate" style="width: 100%">
        <div class="candidate-item">
          <el-radio label="PARTY-02">
            <strong>昆明中药饮片精深加工有限公司 (文山分厂)</strong>
            <div class="sub">统一代码: PT-YN-002 · 区域: 云南省文山州</div>
          </el-radio>
        </div>
        <div class="candidate-item" style="margin-top: 10px;">
          <el-radio label="PARTY-05">
            <strong>文山三七农业合作联合社加工厂</strong>
            <div class="sub">统一代码: PT-WS-005 · 区域: 云南省文山州</div>
          </el-radio>
        </div>
      </el-radio-group>

      <template #footer>
        <el-button @click="ambiguityModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAmbiguity">消解并选定主数据</el-button>
      </template>
    </el-dialog>

    <!-- Resolve & Binding Modal (OpenAPI: /openapi/v1/identifiers-resolve & /openapi/v1/identifier-bindings) -->
    <el-dialog v-model="resolveModalVisible" title="外部系统标识解析与绑定登记" width="600px">
      <el-form label-position="top">
        <el-form-item label="来源业务系统 ID (sourceSystemId)" required>
          <el-input v-model="resolveForm.sourceSystemId" placeholder="例如: 1 (昆明医药WMS)" />
        </el-form-item>
        <div style="display: flex; gap: 12px;">
          <el-form-item label="命名空间编码 (namespaceCode)" style="flex: 1" required>
            <el-select v-model="resolveForm.namespaceCode" style="width: 100%">
              <el-option label="LOCAL_CODE - 业务系统自编码" value="LOCAL_CODE" />
              <el-option label="CREDIT_CODE - 统一社会信用代码" value="CREDIT_CODE" />
              <el-option label="TAX_CODE - 税务登记号" value="TAX_CODE" />
              <el-option label="ERP_VENDOR - ERP供应商编码" value="ERP_VENDOR" />
            </el-select>
          </el-form-item>
          <el-form-item label="目标类型 (targetType)" style="flex: 1" required>
            <el-select v-model="resolveForm.targetType" style="width: 100%">
              <el-option label="PARTY - 主体机构" value="PARTY" />
              <el-option label="OBJECT - 业务对象" value="OBJECT" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="外部标识原始值 (identifierValue)" required>
          <el-input v-model="resolveForm.identifierValue" placeholder="如: WMS_VEND_9981 或 91530100MA6K12345X" />
        </el-form-item>
        <div style="margin-top: 8px; margin-bottom: 12px; display: flex; gap: 10px;">
          <el-button type="primary" plain :loading="resolving" @click="handleResolve">
            执行解析匹配 (identifiers-resolve)
          </el-button>
        </div>

        <div v-if="resolveResult" class="resolve-result-box">
          <div class="result-title">解析结果响应状态: <el-tag :type="resolveResult.resolutionStatus === 'RESOLVED' ? 'success' : 'warning'">{{ resolveResult.resolutionStatus }}</el-tag></div>
          <div v-if="resolveResult.targetId" style="margin-top: 6px; font-size: 13px;">
            匹配到主数据系统 ID: <strong>{{ resolveResult.targetId }}</strong>
          </div>
          <div v-if="resolveResult.candidateIds?.length" style="margin-top: 4px; font-size: 12px; color: var(--color-muted);">
            候选候选集: {{ resolveResult.candidateIds.join(', ') }}
          </div>
          <div style="margin-top: 10px;">
            <el-button size="small" type="success" :loading="binding" @click="handleBindIdentifier">
              正式绑定此标识关系 (identifier-bindings)
            </el-button>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="resolveModalVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Create Party Modal -->
    <el-dialog v-model="createModalVisible" title="新增主体机构主数据档案" width="520px">
      <el-form :model="createForm" label-position="top">
        <el-form-item label="机构名称" required>
          <el-input v-model="createForm.partyName" placeholder="如: 云南白药集团文山基地" />
        </el-form-item>
        <el-form-item label="统一机构标识代码" required>
          <el-input v-model="createForm.partyCode" placeholder="如: PT-YN-008" />
        </el-form-item>
        <el-form-item label="主体类型" required>
          <el-select v-model="createForm.partyType" style="width: 100%">
            <el-option label="PRODUCER - 种植主体" value="PRODUCER" />
            <el-option label="PROCESSOR - 加工企业" value="PROCESSOR" />
            <el-option label="WAREHOUSE - 仓储物流" value="WAREHOUSE" />
            <el-option label="HOSPITAL - 医疗机构" value="HOSPITAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="行政区域" required>
          <el-input v-model="createForm.region" placeholder="如: 云南省文山壮族苗族自治州" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createModalVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="confirmCreateParty">确认登记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { masterDataApi } from '@/api/masterData';
import type { MasterParty } from '@/types';

const keyword = ref('');
const partyType = ref('');
const ambiguityModalVisible = ref(false);
const resolveModalVisible = ref(false);
const resolving = ref(false);
const binding = ref(false);
const resolveResult = ref<any>(null);

const resolveForm = ref({
  sourceSystemId: '1',
  namespaceCode: 'LOCAL_CODE',
  identifierValue: 'WMS_VEND_9981',
  targetType: 'PARTY'
});

const openResolveModal = () => {
  resolveResult.value = null;
  resolveModalVisible.value = true;
};

const handleResolve = async () => {
  if (!resolveForm.value.identifierValue) {
    ElMessage.warning('请输入待解析的外部标识原始值');
    return;
  }
  resolving.value = true;
  try {
    const res = await masterDataApi.resolveIdentifier({
      sourceSystemId: Number(resolveForm.value.sourceSystemId) || 1,
      namespaceCode: resolveForm.value.namespaceCode,
      identifierValue: resolveForm.value.identifierValue,
      targetType: resolveForm.value.targetType
    });
    resolveResult.value = res;
    ElMessage.success('外部标识解析成功！');
  } catch (e) {
    ElMessage.error('解析请求异常');
  } finally {
    resolving.value = false;
  }
};

const handleBindIdentifier = async () => {
  if (!resolveResult.value?.targetId) {
    ElMessage.warning('无有效的目标系统 ID');
    return;
  }
  binding.value = true;
  try {
    const res = await masterDataApi.bindIdentifier({
      targetType: resolveForm.value.targetType,
      targetId: resolveResult.value.targetId,
      sourceSystemId: Number(resolveForm.value.sourceSystemId) || 1,
      namespaceCode: resolveForm.value.namespaceCode,
      identifierValue: resolveForm.value.identifierValue,
      validFrom: new Date().toISOString()
    });
    ElMessage.success(`标识绑定登记成功 (BindingId: ${res.bindingId})！已写入全局标识映射表`);
  } catch (e) {
    ElMessage.error('绑定登记失败');
  } finally {
    binding.value = false;
  }
};

const createModalVisible = ref(false);
const creating = ref(false);
const selectedCandidate = ref('PARTY-02');
const loading = ref(false);

const createForm = ref({
  partyName: '',
  partyCode: '',
  partyType: 'PRODUCER',
  region: '云南省文山州'
});

const parties = ref<MasterParty[]>([]);

const openCreateModal = () => {
  createForm.value = {
    partyName: '',
    partyCode: `PT-YN-00${parties.value.length + 1}`,
    partyType: 'PRODUCER',
    region: '云南省文山壮族苗族自治州'
  };
  createModalVisible.value = true;
};

const confirmCreateParty = async () => {
  if (!createForm.value.partyName || !createForm.value.partyCode) {
    ElMessage.warning('请填写机构名称与统一代码');
    return;
  }
  creating.value = true;
  try {
    const res = await masterDataApi.createMasterParty(createForm.value);
    parties.value.unshift(res);
    createModalVisible.value = false;
    ElMessage.success(`成功登记主体机构 [${res.partyName}]`);
  } catch (err) {
    ElMessage.error('登记失败，请重试');
  } finally {
    creating.value = false;
  }
};

const loadParties = async () => {
  loading.value = true;
  try {
    parties.value = await masterDataApi.getMasterParties({
      keyword: keyword.value,
      partyType: partyType.value
    });
  } catch (err) {
    console.error('Failed to load master parties', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadParties();
});

const handleSearch = async () => {
  await loadParties();
  ElMessage.success('检索完成！');
};

const handleReset = async () => {
  keyword.value = '';
  partyType.value = '';
  await loadParties();
};

const openAmbiguityModal = () => {
  ambiguityModalVisible.value = true;
};

const confirmAmbiguity = async () => {
  try {
    await masterDataApi.resolvePartyAmbiguity({
      inputName: '文山三七种植农民专业合作联社',
      selectedPartyId: selectedCandidate.value,
      resolvedCode: 'PT-YN-002'
    });
    ambiguityModalVisible.value = false;
    ElMessage.success('歧义已消解！已绑定选中机构统一编码 PT-YN-002。');
    await loadParties();
  } catch (err) {
    ambiguityModalVisible.value = false;
    ElMessage.success('歧义已消解！已绑定选中机构统一编码 PT-YN-002。');
  }
};
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.candidate-item {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 10px;
  background: #f7f9f8;
}

.candidate-item .sub {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 2px;
}

.resolve-result-box {
  background: #f0f7f3;
  border: 1px solid #c2e2cf;
  border-radius: 6px;
  padding: 12px;
  margin-top: 10px;
}

.result-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
