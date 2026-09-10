<template>
  <el-dialog
    v-model="visible"
    title="Schema 版本差异可视化对比 (Diff Inspector)"
    width="720px"
    append-to-body
  >
    <div class="diff-header">
      <div class="version-tag left">
        <span class="label">基准版本:</span>
        <strong>1.0.0 (PUBLISHED)</strong>
      </div>
      <div class="diff-arrow">→</div>
      <div class="version-tag right">
        <span class="label">对比版本:</span>
        <strong>1.1.0 (DRAFT)</strong>
      </div>
    </div>

    <div class="diff-table-wrapper">
      <table class="diff-table">
        <thead>
          <tr>
            <th>字段 Key</th>
            <th>字段名称</th>
            <th>变更类型</th>
            <th>规则差异说明</th>
          </tr>
        </thead>
        <tbody>
          <tr class="diff-row added">
            <td class="mono">medicalInsurancePieceCode</td>
            <td>国家医保饮片编码</td>
            <td><span class="diff-badge add">新增</span></td>
            <td>新增必选校验规则 pattern: ^\d{16}$</td>
          </tr>
          <tr class="diff-row modified">
            <td class="mono">quantity</td>
            <td>入仓数量</td>
            <td><span class="diff-badge mod">修改</span></td>
            <td>精度限制从 2 位小数升级为 6 位小数 decimal(20,6)</td>
          </tr>
          <tr class="diff-row removed">
            <td class="mono">legacyTag</td>
            <td>旧版监管标签</td>
            <td><span class="diff-badge del">废弃</span></td>
            <td>已从 1.1.0 版本的 required 必选中移除</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="visible = false">确认应用差异</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const visible = ref(false);

const open = () => {
  visible.value = true;
};

defineExpose({ open });
</script>

<style scoped>
.diff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-canvas);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 14px;
}

.version-tag .label {
  color: var(--color-muted);
  font-size: 12px;
  margin-right: 6px;
}

.diff-arrow {
  font-size: 18px;
  color: var(--color-brand);
  font-weight: 700;
}

.diff-table-wrapper {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.diff-table {
  width: 100%;
  border-collapse: collapse;
}

.diff-table th {
  background: #f6f8f7;
  padding: 8px 12px;
  font-size: 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.diff-table td {
  padding: 8px 12px;
  font-size: 13px;
  border-bottom: 1px solid #edf0ee;
}

.diff-row.added {
  background: #e8f5ee;
}

.diff-row.modified {
  background: #fff8ed;
}

.diff-row.removed {
  background: #fce9e7;
}

.diff-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
}

.diff-badge.add {
  background: #d1e7dd;
  color: var(--color-success);
}

.diff-badge.mod {
  background: #ffe69c;
  color: var(--color-warn);
}

.diff-badge.del {
  background: #f8d7da;
  color: var(--color-danger);
}
</style>
