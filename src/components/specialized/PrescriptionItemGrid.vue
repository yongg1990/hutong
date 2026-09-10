<template>
  <div class="prescription-grid-wrapper">
    <div class="grid-actions">
      <strong>处方饮片味数与医保编码校验明细</strong>
      <el-button size="small" type="primary" link @click="addRow">
        + 添加饮片味数
      </el-button>
    </div>

    <table class="item-table">
      <thead>
        <tr>
          <th width="140">饮片名称</th>
          <th width="120">炮制规格</th>
          <th width="90">剂量</th>
          <th width="140">国家医保饮片编码 (16位)</th>
          <th width="100">煎服用法</th>
          <th width="60">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in items" :key="idx">
          <td><el-input v-model="row.pieceName" size="small" placeholder="饮片名" /></td>
          <td><el-input v-model="row.spec" size="small" placeholder="如: 蒸制/切片" /></td>
          <td><el-input v-model="row.qty" size="small" placeholder="15g" /></td>
          <td>
            <el-input
              v-model="row.insuranceCode"
              size="small"
              placeholder="8691234567890123"
              :class="{ 'is-invalid': row.insuranceCode && !/^\d{16}$/.test(row.insuranceCode) }"
            />
          </td>
          <td><el-input v-model="row.usage" size="small" placeholder="冲服/包煎" /></td>
          <td>
            <el-button type="danger" link size="small" @click="removeRow(idx)">删除</el-button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface PrescriptionItem {
  pieceName: string;
  spec: string;
  qty: string;
  insuranceCode: string;
  usage: string;
}

const items = ref<PrescriptionItem[]>([
  { pieceName: '三七饮片', spec: '蒸制', qty: '15g', insuranceCode: '8691234567890123', usage: '冲服' },
  { pieceName: '酒当归片', spec: '酒制', qty: '10g', insuranceCode: '8691234567890124', usage: '煎服' },
  { pieceName: '蜜黄芪', spec: '蜜制', qty: '20g', insuranceCode: '8691234567890125', usage: '煎服' }
]);

const addRow = () => {
  items.value.push({ pieceName: '', spec: '', qty: '', insuranceCode: '', usage: '煎服' });
};

const removeRow = (index: number) => {
  items.value.splice(index, 1);
};
</script>

<style scoped>
.prescription-grid-wrapper {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  padding: 12px;
}

.grid-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
}

.item-table {
  width: 100%;
  border-collapse: collapse;
}

.item-table th {
  background: #f6f8f7;
  padding: 6px 8px;
  font-size: 12px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.item-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #edf0ee;
}

.is-invalid :deep(.el-input__wrapper) {
  border-color: var(--color-danger) !important;
  box-shadow: 0 0 0 1px var(--color-danger) inset !important;
}
</style>
