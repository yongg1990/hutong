<template>
  <div class="business-page">
    <PageHeader
      title="处方代煎配送工作台"
      subtitle="医疗机构处方接收、代煎中心加工与包煎配送"
    >
      <template #actions>
        <el-button type="primary" @click="router.push('/business/events/new/PRESCRIPTION_RECEIVED')">
          接收医疗机构处方
        </el-button>
      </template>
    </PageHeader>

    <div class="grid-two">
      <div class="panel">
        <div class="panel-header">
          <h2>代煎处方任务队列</h2>
        </div>
        <el-table :data="orders">
          <el-table-column label="脱敏处方 Token" min-width="160">
            <template #default="{ row }">
              <SensitiveValue :value="row.prescriptionNoToken" />
            </template>
          </el-table-column>
          <el-table-column prop="hospitalName" label="医疗机构" min-width="150" />
          <el-table-column prop="centerName" label="代煎中心" min-width="150" />
          <el-table-column label="阶段" width="100">
            <template #default="{ row }">
              <StatusTag :code="row.stage" />
            </template>
          </el-table-column>
          <el-table-column prop="itemCount" label="味数" width="60" />
          <el-table-column label="操作 / 溯源" width="140" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="router.push('/trust/lineage')">
                血缘图谱
              </el-button>
              <el-button size="small" link @click="router.push('/business/coding')">
                调剂赋码
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>处方饮片明细与医保校验控件</h2>
        </div>
        <div class="panel-body">
          <PrescriptionItemGrid />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import SensitiveValue from '@/components/common/SensitiveValue.vue';
import PrescriptionItemGrid from '@/components/specialized/PrescriptionItemGrid.vue';
import { decoctionApi } from '@/api/decoction';
import type { DecoctionOrder } from '@/types';

const router = useRouter();
const orders = ref<DecoctionOrder[]>([]);
const loading = ref(false);

const loadOrders = async () => {
  loading.value = true;
  try {
    orders.value = await decoctionApi.getDecoctionOrders();
  } catch (err) {
    console.error('Failed to load decoction orders', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadOrders();
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
