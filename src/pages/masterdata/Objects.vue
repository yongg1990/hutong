<template>
  <div class="master-data-page">
    <PageHeader
      title="业务对象主数据"
      subtitle="作物批次、加工批次、包装单元与订单对象版本管理"
    >
      <template #actions>
        <el-button type="primary" @click="openCreateModal">
          新增业务对象
        </el-button>
      </template>
    </PageHeader>

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="objectCode" placeholder="业务对象代码/名称" style="width: 200px" />
      <el-select v-model="objectType" placeholder="对象类型" style="width: 160px">
        <el-option label="全部类型" value="" />
        <el-option label="CROP_BATCH - 作物批次" value="CROP_BATCH" />
        <el-option label="PROCESS_BATCH - 加工批次" value="PROCESS_BATCH" />
        <el-option label="HERB_PACKAGE - 包装单元" value="HERB_PACKAGE" />
      </el-select>
    </FilterBar>

    <div class="panel">
      <el-table :data="objects" v-loading="loading">
        <el-table-column prop="objectCode" label="对象统一编码" width="180" class-name="mono" />
        <el-table-column prop="displayName" label="显示名称" min-width="200" />
        <el-table-column prop="objectType" label="对象类型" width="140" />
        <el-table-column prop="ownerParty" label="所属主体机构" min-width="180" />
        <el-table-column prop="version" label="当前版本" width="90" class-name="mono" />
        <el-table-column prop="lastEventTime" label="最近更新时间" width="160" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Create Object Modal -->
    <el-dialog v-model="createModalVisible" title="创建业务对象主数据" width="520px">
      <el-form :model="createForm" label-position="top">
        <el-form-item label="业务对象编码" required>
          <el-input v-model="createForm.objectCode" placeholder="如: CROP-2026-SQ-009" />
        </el-form-item>
        <el-form-item label="对象名称" required>
          <el-input v-model="createForm.displayName" placeholder="如: 文山三七春播规范化试验田批次" />
        </el-form-item>
        <el-form-item label="对象类型" required>
          <el-select v-model="createForm.objectType" style="width: 100%">
            <el-option label="CROP_BATCH - 作物种植批次" value="CROP_BATCH" />
            <el-option label="PROCESS_BATCH - 药材加工批次" value="PROCESS_BATCH" />
            <el-option label="HERB_PACKAGE - 包装单元对象" value="HERB_PACKAGE" />
          </el-select>
        </el-form-item>
        <el-form-item label="权属机构主体">
          <el-input v-model="createForm.ownerParty" placeholder="如: 文山三七标准化种植示范基地" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createModalVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmCreateObject">确认创建</el-button>
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
import type { MasterObject } from '@/types';

const objectCode = ref('');
const objectType = ref('');
const loading = ref(false);
const saving = ref(false);
const createModalVisible = ref(false);

const createForm = ref({
  objectCode: '',
  displayName: '',
  objectType: 'CROP_BATCH',
  ownerParty: '文山三七标准化种植示范基地'
});

const objects = ref<MasterObject[]>([]);

const openCreateModal = () => {
  createForm.value = {
    objectCode: `OBJ-${Date.now().toString().slice(-6)}`,
    displayName: '',
    objectType: 'CROP_BATCH',
    ownerParty: '文山三七标准化种植示范基地'
  };
  createModalVisible.value = true;
};

const confirmCreateObject = async () => {
  if (!createForm.value.objectCode || !createForm.value.displayName) {
    ElMessage.warning('请填写业务对象编码与名称');
    return;
  }
  saving.value = true;
  try {
    const res = await masterDataApi.createMasterObject(createForm.value);
    objects.value.unshift(res);
    createModalVisible.value = false;
    ElMessage.success(`业务对象 [${res.displayName}] 创建成功！`);
  } catch (err) {
    ElMessage.error('创建失败，请稍后重试');
  } finally {
    saving.value = false;
  }
};

const loadObjects = async () => {
  loading.value = true;
  try {
    objects.value = await masterDataApi.getMasterObjects({
      keyword: objectCode.value,
      objectType: objectType.value
    });
  } catch (err) {
    console.error('Failed to load objects', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadObjects();
});

const handleSearch = async () => {
  await loadObjects();
  ElMessage.success('业务对象检索成功！');
};

const handleReset = async () => {
  objectCode.value = '';
  objectType.value = '';
  await loadObjects();
};
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
