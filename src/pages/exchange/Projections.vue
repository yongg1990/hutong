<template>
  <div class="exchange-page flex flex-col h-full gap-4">
    <PageHeader
      title="互通投影"
      subtitle="数据集投影与外发规范包管理，实时追踪对外数据推送结果与验证状态"
    >
      <template #actions>
        <el-button type="primary" @click="createDialogVisible = true">
          <el-icon class="mr-1"><RefreshRight /></el-icon>
          新建投影任务
        </el-button>
      </template>
    </PageHeader>

    <div class="panel flex-1 flex flex-col bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
          全部投影任务 ({{ projections.length }})
        </div>
        <div class="projection-query">
          <el-input-number
            v-model="searchQuery" 
            placeholder="投影 ID"
            :min="1"
            style="width: 180px"
            @keyup.enter="loadProjections"
          />
          <el-input-number v-model="projectSpaceId" :min="1" placeholder="项目空间 ID" />
          <el-input v-model="purposeCode" placeholder="访问用途" style="width: 150px" />
          <el-checkbox v-model="includeOutput">输出</el-checkbox>
          <el-checkbox v-model="includeValidationDetails">校验详情</el-checkbox>
          <el-button type="primary" :loading="loading" @click="loadProjections">查询</el-button>
        </div>
      </div>
      
      <div class="p-4 flex-1 overflow-auto">
        <el-table :data="filteredProjections" style="width: 100%" height="100%" border stripe>
          <el-table-column type="expand">
            <template #default="props">
              <div class="projection-detail">
                <div><strong>输出数据 (output)</strong><pre>{{ formatJson(props.row.output) }}</pre></div>
                <div><strong>字段溯源 (traceback)</strong><pre>{{ formatJson(props.row.traceback) }}</pre></div>
                <div><strong>错误详情 (errors)</strong><pre>{{ formatJson(props.row.errors) }}</pre></div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="任务编号" prop="projectionNo" width="190" class-name="mono text-xs text-gray-600" />
          <el-table-column label="规范版本 ID" prop="profileVersionId" width="140" class-name="mono" />
          <el-table-column label="数据集代码" prop="datasetCode" width="170" class-name="mono" />
          
          <el-table-column label="规范包 & 数据集 *" min-width="300">
            <template #default="{ row }">
              <div class="flex flex-col gap-1 py-1">
                <span class="font-medium text-gray-800">{{ row.profileName }}</span>
                <span class="text-xs text-gray-500">
                  <el-tag size="small" type="info" class="mr-1">{{ row.profileCode }}</el-tag>
                  v{{ row.version }} | {{ row.datasetName }}
                </span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="数据截止时间" prop="asOfTime" width="180" />
          <el-table-column label="输出摘要" prop="outputDigest" min-width="200" class-name="mono" show-overflow-tooltip />
          <el-table-column label="替代投影 ID" prop="supersedesProjectionId" width="140" class-name="mono" />
          
          <el-table-column label="输出记录数 *" prop="recordCount" width="120" align="right">
            <template #default="{ row }">
              <span class="font-semibold text-gray-700">{{ row.recordCount }}</span>
            </template>
          </el-table-column>

          <el-table-column label="异常数 *" prop="errorCount" width="90" align="right">
            <template #default="{ row }">
              <span :class="row.errorCount > 0 ? 'text-red-500 font-bold' : 'text-gray-400'">
                {{ row.errorCount }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="130" align="center">
            <template #default="{ row }">
              <StatusTag :code="row.status" />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewDetails(row)">
                任务详情
              </el-button>
              <el-button link type="primary" size="small" :disabled="row.status !== 'GENERATED'">
                下载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="createDialogVisible" title="新建投影任务" width="620px">
      <el-form :model="createForm" label-position="top">
        <div class="form-grid">
          <el-form-item label="规范包代码" required><el-input v-model="createForm.profileCode" /></el-form-item>
          <el-form-item label="规范包版本" required><el-input v-model="createForm.profileVersion" /></el-form-item>
          <el-form-item label="主体类型" required>
            <el-select v-model="createForm.subjectType" style="width: 100%">
              <el-option label="EVENT" value="EVENT" /><el-option label="OBJECT" value="OBJECT" /><el-option label="BATCH" value="BATCH" />
            </el-select>
          </el-form-item>
          <el-form-item label="项目空间 ID" required><el-input-number v-model="createForm.projectSpaceId" :min="1" style="width: 100%" /></el-form-item>
        </div>
        <el-form-item label="主体 ID（逗号分隔）" required><el-input v-model="subjectIdsText" /></el-form-item>
        <el-form-item label="数据集代码（逗号分隔，可选）"><el-input v-model="datasetCodesText" /></el-form-item>
        <el-form-item label="数据截止时间（可选）"><el-date-picker v-model="createForm.asOfTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="generateNew">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { RefreshRight } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { exchangeApi } from '@/api/exchange';
import type { ExchangeProjection } from '@/types';

const projections = ref<ExchangeProjection[]>([]);
const searchQuery = ref<number | undefined>();
const loading = ref(false);
const projectSpaceId = ref(Number(localStorage.getItem('tcmirp_project_space_id')) || 1);
const purposeCode = ref(localStorage.getItem('tcmirp_purpose_code') || 'TRACE');
const includeOutput = ref(true);
const includeValidationDetails = ref(true);
const createDialogVisible = ref(false);
const creating = ref(false);
const subjectIdsText = ref('1');
const datasetCodesText = ref('');
const createForm = ref({
  projectSpaceId: Number(localStorage.getItem('tcmirp_project_space_id')) || 1,
  profileCode: '', profileVersion: '1.0.0', subjectType: 'BATCH', asOfTime: ''
});

const loadProjections = async () => {
  if (!searchQuery.value) {
    projections.value = [];
    return;
  }
  loading.value = true;
  try {
    const item = await exchangeApi.getProjection(searchQuery.value, {
      projectSpaceId: projectSpaceId.value, purposeCode: purposeCode.value,
      includeOutput: includeOutput.value, includeValidationDetails: includeValidationDetails.value
    });
    const errors = Array.isArray(item.errors) ? item.errors : item.errors ? [item.errors] : [];
    projections.value = [{
      id: String(item.projectionId), projectionNo: String(item.projectionId), profileCode: '', profileName: '',
      version: '', datasetName: item.datasetCode, asOfTime: item.asOfTime, status: item.status, recordCount: 0,
      outputHash: item.outputDigest, errorCount: errors.length, profileVersionId: item.profileVersionId,
      datasetCode: item.datasetCode, outputDigest: item.outputDigest, output: item.output,
      traceback: item.traceback, errors: item.errors, supersedesProjectionId: item.supersedesProjectionId
    }];
  } catch (err) {
    console.error('Failed to load projections', err);
    projections.value = [];
  } finally {
    loading.value = false;
  }
};

const filteredProjections = computed(() => {
  return projections.value;
});

const generateNew = async () => {
  const subjectIds = subjectIdsText.value.split(',').map(item => Number(item.trim())).filter(item => Number.isFinite(item) && item > 0);
  if (!createForm.value.profileCode || !createForm.value.profileVersion || !subjectIds.length) {
    ElMessage.warning('请填写规范包代码、版本和有效主体 ID');
    return;
  }
  creating.value = true;
  try {
    const result = await exchangeApi.createProjection({
      ...createForm.value, subjectIds,
      datasetCodes: datasetCodesText.value.split(',').map(item => item.trim()).filter(Boolean),
      asOfTime: createForm.value.asOfTime || undefined, deliveryMode: 'QUERY_ONLY'
    });
    createDialogVisible.value = false;
    if (result?.projectionId) {
      searchQuery.value = Number(result.projectionId) || undefined;
      await loadProjections();
    }
    ElMessage.success('投影任务已受理');
  } catch (err) {
    ElMessage.error('投影任务提交失败');
  } finally {
    creating.value = false;
  }
};

const viewDetails = (row: ExchangeProjection) => {
  ElMessage.info(`正在查看投影任务 [${row.projectionNo}] 的日志详情...`);
};

const formatJson = (value: any) => JSON.stringify(value ?? null, null, 2);
</script>

<style scoped>
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.projection-detail {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 18px;
}

.projection-query {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.projection-detail pre {
  max-height: 260px;
  overflow: auto;
  padding: 10px;
  background: #f6f8f7;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
