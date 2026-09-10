<template>
  <div class="master-data-page">
    <PageHeader
      title="饮片与监管编码主数据"
      subtitle="中药饮片品种规格、医保饮片编码 (16位) 与药监编码双轨标准"
    >
      <template #actions>
        <el-button type="primary" @click="openCreateModal">
          登记饮片与监管编码
        </el-button>
      </template>
    </PageHeader>

    <div class="grid-two">
      <div class="panel">
        <div class="panel-header">
          <h2>中药饮片品种批次清单</h2>
        </div>
        <el-table :data="herbPieces">
          <el-table-column prop="speciesName" label="品种" width="90" />
          <el-table-column prop="processMethod" label="炮制方法/规格" min-width="120" />
          <el-table-column prop="medicalInsuranceCode" label="医保饮片编码 (16位)" min-width="170" class-name="mono" />
          <el-table-column prop="nmpaCode" label="药监饮片码" width="130" class-name="mono" />
          <el-table-column prop="batchNo" label="批次号" width="130" class-name="mono" />
        </el-table>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>追溯码包装层级结构 (Packaging Hierarchy)</h2>
        </div>
        <div class="panel-body">
          <PackagingTreeInspector />
        </div>
      </div>
    </div>

    <!-- Register Herb Piece Modal -->
    <el-dialog v-model="createModalVisible" title="登记中药饮片与监管编码标准" width="540px">
      <el-form :model="createForm" label-position="top">
        <el-form-item label="品种名称" required>
          <el-input v-model="createForm.speciesName" placeholder="如: 三七、天麻、黄芪" />
        </el-form-item>
        <el-form-item label="炮制方法与规格" required>
          <el-input v-model="createForm.processMethod" placeholder="如: 切片 (500g/袋)" />
        </el-form-item>
        <el-form-item label="生产批次号" required>
          <el-input v-model="createForm.batchNo" placeholder="如: SQ-260808-01" />
        </el-form-item>
        <el-form-item label="国家医保饮片编码 (16位标准码)" required>
          <el-input v-model="createForm.medicalInsuranceCode" placeholder="如: 8691234567890199" maxlength="16" />
        </el-form-item>
        <el-form-item label="药监饮片追溯码">
          <el-input v-model="createForm.nmpaCode" placeholder="如: Y20265300099" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createModalVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmCreatePiece">确认登记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import PackagingTreeInspector from '@/components/specialized/PackagingTreeInspector.vue';
import { masterDataApi } from '@/api/masterData';
import type { HerbPiece } from '@/types';

const herbPieces = ref<HerbPiece[]>([]);
const loading = ref(false);
const saving = ref(false);
const createModalVisible = ref(false);

const createForm = ref({
  speciesName: '三七',
  processMethod: '切片 (250g/袋)',
  batchNo: 'SQ-260810-09',
  medicalInsuranceCode: '8691234567890188',
  nmpaCode: 'Y20265300088'
});

const openCreateModal = () => {
  createForm.value = {
    speciesName: '三七',
    processMethod: '切片 (250g/袋)',
    batchNo: `SQ-2608${Date.now().toString().slice(-4)}`,
    medicalInsuranceCode: `8691234567890${Math.floor(Math.random() * 899 + 100)}`,
    nmpaCode: `Y202653000${Math.floor(Math.random() * 89 + 10)}`
  };
  createModalVisible.value = true;
};

const confirmCreatePiece = async () => {
  if (!createForm.value.speciesName || !createForm.value.medicalInsuranceCode) {
    ElMessage.warning('请填写品种名称与16位医保编码');
    return;
  }
  saving.value = true;
  try {
    const res = await masterDataApi.createHerbPiece(createForm.value);
    herbPieces.value.unshift(res);
    createModalVisible.value = false;
    ElMessage.success(`饮片品种 [${res.speciesName}] 及其双轨编码成功登记！`);
  } catch (err) {
    ElMessage.error('登记失败，请稍后重试');
  } finally {
    saving.value = false;
  }
};

const loadHerbPieces = async () => {
  loading.value = true;
  try {
    herbPieces.value = await masterDataApi.getHerbPieces();
  } catch (err) {
    console.error('Failed to load herb pieces', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadHerbPieces();
});
</script>

<style scoped>
.grid-two {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h2 {
  font-size: 15px;
  margin: 0;
  font-weight: 600;
}

.panel-body {
  padding: 16px;
}
</style>
