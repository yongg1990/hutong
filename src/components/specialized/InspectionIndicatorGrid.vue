<template>
  <div class="indicator-grid-wrapper">
    <div class="grid-actions">
      <strong>检验项目与指标参数列表</strong>
      <el-button size="small" type="primary" link @click="addRow">
        + 添加检验指标
      </el-button>
    </div>

    <table class="indicator-table">
      <thead>
        <tr>
          <th width="140">检验指标项目</th>
          <th width="120">实测结果值</th>
          <th width="100">计量单位</th>
          <th width="120">标准限值要求</th>
          <th width="90">单项判定</th>
          <th width="60">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in items" :key="idx">
          <td><el-input v-model="row.name" placeholder="如: 性状/水分" size="small" /></td>
          <td><el-input v-model="row.result" placeholder="实测值" size="small" /></td>
          <td><el-input v-model="row.unit" placeholder="%, mg/kg" size="small" /></td>
          <td><el-input v-model="row.limit" placeholder="标准要求" size="small" /></td>
          <td>
            <el-select v-model="row.status" size="small">
              <el-option label="合格" value="PASS" />
              <el-option label="不合格" value="FAIL" />
            </el-select>
          </td>
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

interface IndicatorItem {
  name: string;
  result: string;
  unit: string;
  limit: string;
  status: 'PASS' | 'FAIL';
}

const items = ref<IndicatorItem[]>([
  { name: '浸出物', result: '32.4', unit: '%', limit: '≥28.0%', status: 'PASS' },
  { name: '人参皂苷Rg1+Rb1', result: '6.8', unit: '%', limit: '≥5.0%', status: 'PASS' },
  { name: '重金属(铅)', result: '0.2', unit: 'mg/kg', limit: '≤5.0 mg/kg', status: 'PASS' }
]);

const addRow = () => {
  items.value.push({ name: '', result: '', unit: '', limit: '', status: 'PASS' });
};

const removeRow = (index: number) => {
  items.value.splice(index, 1);
};
</script>

<style scoped>
.indicator-grid-wrapper {
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

.indicator-table {
  width: 100%;
  border-collapse: collapse;
}

.indicator-table th {
  background: #f6f8f7;
  padding: 6px 8px;
  font-size: 12px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.indicator-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #edf0ee;
}
</style>
