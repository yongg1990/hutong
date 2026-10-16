<template>
  <div class="business-page">
    <PageHeader
      title="处方代煎配送工作台"
      subtitle="医疗机构处方接收、代煎中心加工与包煎配送"
    >
      <template #actions>
        <el-button @click="openEvent('DECOCTION_PROCESSED')">记录代煎过程</el-button>
        <el-button @click="openEvent('DECOCTION_DELIVERED')">记录配送 / 签收</el-button>
        <el-button type="primary" @click="openEvent('PRESCRIPTION_RECEIVED')">
          接收医疗机构处方
        </el-button>
      </template>
    </PageHeader>
    <el-alert v-if="isStaticMode()" type="info" :closable="false" :title="'当前批次：' + (incomingBatch() || selectedOrder?.batchNo || '未选择')" style="margin-bottom:12px" />

    <div class="grid-two">
      <div class="panel">
        <div class="panel-header">
          <h2>代煎处方任务队列</h2>
        </div>
        <el-table :data="orders" highlight-current-row @row-click="selectPrescription">
          <el-table-column label="脱敏处方 Token *" min-width="160">
            <template #default="{ row }">
              <SensitiveValue :value="row.prescriptionNoToken" />
            </template>
          </el-table-column>
          <el-table-column prop="hospitalName" label="医疗机构 *" min-width="150" />
          <el-table-column prop="centerName" label="代煎中心 *" min-width="150" />
          <el-table-column label="阶段 *" width="100">
            <template #default="{ row }">
              <StatusTag :code="row.stage" />
            </template>
          </el-table-column>
          <el-table-column prop="itemCount" label="味数 *" width="60" />
          <el-table-column label="操作 / 溯源" width="140" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="router.push({path:'/trust/lineage',query:{batchNo:row.batchNo}})">
                血缘图谱
              </el-button>
              <el-button size="small" link @click="router.push({path:'/business/coding',query:{batchNo:row.batchNo}})">
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
          <template v-if="selectedOrder"><p>{{ selectedOrder.prescriptionNoToken }}</p><PrescriptionItemGrid v-model="prescriptionItems" /><el-button v-if="isStaticMode()" style="margin-top:12px" @click="saveItems">保存处方明细</el-button></template>
          <el-empty v-else description="选择处方或登记新处方" />
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
import { demo, isStaticMode, activity } from '@/stores/demoStore';
import { useBusinessFlow } from '@/composables/useBusinessFlow';
import { ElMessage } from 'element-plus';
import type { DecoctionOrder } from '@/types';

const router = useRouter();
const orders = ref<DecoctionOrder[]>([]);
const loading = ref(false);
const selectedOrder = ref<any>(null), prescriptionItems = ref<any[]>([]);
const { incomingBatch, openEvent } = useBusinessFlow(() => selectedOrder.value?.batchNo, () => selectedOrder.value?.id);
function selectPrescription(row:any) { selectedOrder.value=row; prescriptionItems.value=JSON.parse(JSON.stringify(row.items || [])); }
function saveItems() { if(!prescriptionItems.value.length||prescriptionItems.value.some(r=>!r.pieceName||!r.qty||!/^\d{16}$/.test(r.insuranceCode||''))) { ElMessage.warning('请填写饮片名称、剂量和16位医保编码'); return; } const row=demo.prescriptions.find(r=>r.id===selectedOrder.value?.id); if(!row)return; if(row.stage!=='RECEIVED'){ElMessage.warning('仅待加工处方可修改明细');return;} row.items=JSON.parse(JSON.stringify(prescriptionItems.value));row.itemCount=row.items.length;activity('处方明细保存',row.prescriptionNoToken);ElMessage.success('已保存'); }

const loadOrders = async () => {
  loading.value = true;
  try {
    const rows = isStaticMode() ? demo.prescriptions : await decoctionApi.getDecoctionOrders();
    orders.value = incomingBatch() ? rows.filter((r:any)=>r.batchNo===incomingBatch()) : rows;
    if(orders.value.length) selectPrescription(orders.value[0]);
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
