<template>
  <div class="governance-page">
    <PageHeader
      title="治理异常案卷"
      subtitle="规则校验不通过的异常案卷人工研判、批量修复与二次重放"
    >
      <template #actions>
      </template>
    </PageHeader>
    <el-alert v-if="isStaticMode()" type="info" :closable="false" title="静态治理案卷" style="margin-bottom:12px" />
    <el-dialog v-model="visible" title="修正并重放" width="min(600px,94vw)"><el-form label-position="top"><el-form-item label="原始内容"><JsonEditor v-model="payload" :rows="6" /></el-form-item><el-form-item label="处理说明" required><el-input v-model="note" type="textarea" /></el-form-item></el-form><p v-for="item in active?.history" :key="item">{{ item }}</p><template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" @click="resolve">修正、重放并关闭</el-button></template></el-dialog>

    <div class="panel">
      <el-table :data="cases">
        <el-table-column prop="caseNo" label="案卷编号 *" width="160" class-name="mono" />
        <el-table-column prop="ruleCode" label="规则码 *" width="180" class-name="mono" />
        <el-table-column prop="sourceSystem" label="来源系统 *" width="120" />
        <el-table-column prop="errorDetail" label="错误描述与定位 *" min-width="220" />
        <el-table-column prop="resolutionNote" label="处理说明" min-width="150" />
        <el-table-column v-if="isStaticMode()" label="操作" width="130"><template #default="{row}"><el-button link type="primary" :disabled="row.status==='RESOLVED'" @click="open(row)">修正并重放</el-button></template></el-table-column>
        <el-table-column label="状态 *" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
      </el-table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { isStaticMode, resolveCase } from '@/stores/demoStore';
import JsonEditor from '@/components/common/JsonEditor.vue';
import { ElMessage } from 'element-plus';
const visible=ref(false),active=ref<any>(null),payload=ref('{}'),note=ref('');
function open(row:any){active.value=row;payload.value=row.rawPayloadSnippet;note.value='';visible.value=true;}
function resolve(){try{resolveCase(active.value.id,JSON.parse(payload.value),note.value);visible.value=false;ElMessage.success('已重放并关闭案卷');}catch(e){ElMessage.error(e instanceof Error?e.message:'处理失败');}}
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { governanceApi } from '@/api/governance';
import type { GovernanceCase } from '@/types';

const cases = ref<GovernanceCase[]>([]);
const loading = ref(false);

const loadCases = async () => {
  loading.value = true;
  try {
    cases.value = await governanceApi.getCases();
  } catch (err) {
    console.error('Failed to load cases', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCases();
});

</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
