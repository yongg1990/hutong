<template>
  <div class="business-page">
    <PageHeader
      title="饮片赋码工作台"
      subtitle="品种、饮片批次、医保编码与追溯码赋码登记"
    >
      <template #actions>
        <el-button type="primary" @click="router.push('/business/events/new/TRACE_CODE_ASSIGNED')">
          赋码登记与绑定
        </el-button>
      </template>
    </PageHeader>

    <div class="grid-two">
      <div class="panel">
        <div class="panel-header">
          <div class="header-title">
            <h2>饮片品种与赋码状态清单</h2>
            <el-tag size="small" type="success">国家16位医保码</el-tag>
          </div>
          <el-button size="small" link type="primary" @click="router.push('/master-data/decoction-pieces')">
            查看中药饮片标准库 ➔
          </el-button>
        </div>
        <el-table :data="herbPieces">
          <el-table-column prop="speciesName" label="品种" width="85" />
          <el-table-column prop="batchNo" label="批次号" width="130" class-name="mono" />
          <el-table-column prop="medicalInsuranceCode" label="国家医保饮片编码 (16位)" min-width="170" class-name="mono" />
          <el-table-column prop="traceCodeCount" label="赋码数" width="80" />
          <el-table-column label="操作 / 协同流转" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="router.push('/trust/lineage?batchNo=' + row.batchNo)">
                血缘追溯
              </el-button>
              <el-button size="small" link @click="router.push('/business/supply?batchNo=' + row.batchNo)">
                交割入库 ➔
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>追溯码层次结构定义器</h2>
        </div>
        <div class="panel-body">
          <TraceCodeHierarchyInput />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '@/components/common/PageHeader.vue';
import TraceCodeHierarchyInput from '@/components/specialized/TraceCodeHierarchyInput.vue';
import { codingApi } from '@/api/coding';
import type { HerbPiece } from '@/types';

const router = useRouter();
const herbPieces = ref<HerbPiece[]>([]);
const loading = ref(false);

const loadData = async () => {
  loading.value = true;
  try {
    herbPieces.value = await codingApi.getCodingPieces();
  } catch (err) {
    console.error('Failed to load coding pieces', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
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
