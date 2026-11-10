<template>
  <div>
    <PageHeader title="查询方案目录" />
    <ResourceWorkbench ref="workbench" list-path="/openapi/v1/exchange-query/profiles" detail-path="/openapi/v1/exchange-query/profiles/{id}" :filters="filters" :columns="columns" :fields="fields" :paginated="false" editable create-label="新建查询方案">
      <template #filter-actions><el-button @click="$router.push('/exchange/profile-config')">版本与字段配置</el-button><el-button @click="$router.push('/exchange/profile-bindings')">授权绑定</el-button><el-button @click="copyVisible = true">复制为独立方案</el-button></template>
    </ResourceWorkbench>
    <el-dialog v-model="copyVisible" title="复制独立方案" width="min(560px,94vw)" :close-on-click-modal="false"><el-form label-position="top"><el-form-item v-for="f in copyFields" :key="f.key" :label="f.label" required><el-input v-model="copyForm[f.key]" /></el-form-item></el-form><template #footer><el-button @click="copyVisible = false">取消</el-button><el-button type="primary" :loading="copying" @click="copy">复制</el-button></template></el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { request, apiErrorMessage } from '@/api/client';
import PageHeader from '@/components/common/PageHeader.vue';
import ResourceWorkbench from '@/components/common/ResourceWorkbench.vue';
const filters = [{ key: 'profileCode', label: '方案代码' }, { key: 'limit', label: '返回上限' }];
const workbench = ref<InstanceType<typeof ResourceWorkbench>>(), copyVisible = ref(false), copying = ref(false);
const copyForm = ref<Record<string,string>>({ sourceVersionId: '', profileCode: '', profileName: '', version: '' });
const copyFields = [{ key: 'sourceVersionId', label: '来源版本 ID' }, { key: 'profileCode', label: '新方案代码' }, { key: 'profileName', label: '新方案名称' }, { key: 'version', label: '初始版本号' }];
async function copy() { if (Object.values(copyForm.value).some(v => !v.trim()) || !/^\d+$/.test(copyForm.value.sourceVersionId)) return ElMessage.warning('请完整填写复制信息和有效版本 ID'); copying.value = true; try { await request.post('/openapi/v1/exchange-query/profiles/copy', copyForm.value); copyVisible.value = false; ElMessage.success('方案已复制'); await workbench.value?.load(); } catch (e) { ElMessage.error(apiErrorMessage(e, '复制失败')); } finally { copying.value = false; } }
const columns = [{ key: 'id', label: '方案 ID', width: 200 }, { key: 'profileCode', label: '方案代码' }, { key: 'profileName', label: '方案名称', width: 220 }, { key: 'sourceEventType', label: '来源事件类型', width: 200 }, { key: 'description', label: '方案说明', width: 240 }, { key: 'status', label: '状态' }, { key: 'createdAt', label: '创建时间', width: 180 }, { key: 'updatedAt', label: '更新时间', width: 180 }];
const fields = [{ key: 'profileCode', label: '方案代码', required: true }, { key: 'profileName', label: '方案名称', required: true }, { key: 'sourceEventType', label: '来源事件类型', required: true, immutable: true }, { key: 'description', label: '方案说明' }, { key: 'status', label: '状态', required: true, options: ['ACTIVE', 'INACTIVE'], initial: 'ACTIVE' }];
</script>
