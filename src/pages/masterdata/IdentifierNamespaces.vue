<template>
  <div class="master-data-page namespace-page">
    <PageHeader title="标识命名空间" subtitle="统一管理外部标识规则、目标类型和启停状态">
      <template #actions>
        <el-button :loading="loading" @click="loadNamespaces">刷新</el-button>
        <el-button type="primary" @click="openCreate">新增命名空间</el-button>
      </template>
    </PageHeader>

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="filters.namespaceCode" clearable placeholder="编码关键字" style="width: 190px" @keyup.enter="handleSearch" />
      <el-input v-model="filters.namespaceName" clearable placeholder="名称关键字" style="width: 190px" @keyup.enter="handleSearch" />
      <el-select v-model="filters.targetType" clearable placeholder="目标类型" style="width: 150px">
        <el-option label="主体 PARTY" value="PARTY" /><el-option label="业务对象 OBJECT" value="OBJECT" />
      </el-select>
      <el-select v-model="filters.status" clearable placeholder="状态" style="width: 130px">
        <el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" />
      </el-select>
    </FilterBar>

    <section class="panel table-panel">
      <div class="panel-header"><h2>命名空间列表 ({{ total }})</h2><span v-if="inactiveCount" class="panel-hint">本页停用 {{ inactiveCount }}</span></div>
      <div class="panel-body">
        <el-table :data="namespaces" v-loading="loading" row-key="namespaceId" empty-text="暂无命名空间记录" style="width: 100%">
          <el-table-column prop="namespaceId" label="命名空间 ID" width="170"><template #default="{ row }"><span class="mono">{{ row.namespaceId }}</span></template></el-table-column>
          <el-table-column prop="namespaceCode" label="命名空间编码" min-width="180"><template #default="{ row }"><span class="mono code-text">{{ row.namespaceCode }}</span></template></el-table-column>
          <el-table-column prop="namespaceName" label="命名空间名称" min-width="190" show-overflow-tooltip />
          <el-table-column prop="targetType" label="目标类型" width="130"><template #default="{ row }"><el-tag size="small" effect="plain">{{ targetTypeLabel(row.targetType) }}</el-tag></template></el-table-column>
          <el-table-column prop="valuePattern" label="标识值格式" min-width="230" show-overflow-tooltip><template #default="{ row }"><span class="mono pattern-text">{{ row.valuePattern || '不限制' }}</span></template></el-table-column>
          <el-table-column label="状态" width="90"><template #default="{ row }"><StatusTag :code="row.status" :label="statusLabel(row.status)" /></template></el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="175" />
          <el-table-column prop="updatedAt" label="更新时间" width="175" />
          <el-table-column label="操作" width="140" fixed="right"><template #default="{ row }"><el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button><el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button></template></el-table-column>
        </el-table>
        <div class="pagination-row"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next" @current-change="loadNamespaces" @size-change="handleSizeChange" /></div>
      </div>
    </section>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑命名空间' : '新增命名空间'" width="620px" destroy-on-close :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="form-grid">
          <el-form-item label="命名空间编码" prop="namespaceCode"><el-input v-model="form.namespaceCode" maxlength="128" :disabled="editing" placeholder="例如 CREDIT_CODE" @input="normalizeCode" /></el-form-item>
          <el-form-item label="命名空间名称" prop="namespaceName"><el-input v-model="form.namespaceName" maxlength="200" placeholder="例如 统一社会信用代码" /></el-form-item>
        </div>
        <el-form-item v-if="!editing" label="允许绑定的目标类型" prop="targetType"><el-radio-group v-model="form.targetType"><el-radio-button label="PARTY">主体 PARTY</el-radio-button><el-radio-button label="OBJECT">业务对象 OBJECT</el-radio-button></el-radio-group></el-form-item>
        <el-form-item label="标识值正则表达式" prop="valuePattern"><el-input v-model="form.valuePattern" maxlength="512" placeholder="可选，例如 ^[0-9A-Z]{18}$" /></el-form-item>
        <el-form-item v-if="editing" label="状态" prop="status"><el-radio-group v-model="form.status"><el-radio-button label="ACTIVE">启用</el-radio-button><el-radio-button label="INACTIVE">停用</el-radio-button></el-radio-group></el-form-item>
        <el-alert title="服务端会将标识值去除首尾空格并转为大写后匹配正则" type="info" show-icon :closable="false" />
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="命名空间详情" size="480px">
      <el-skeleton v-if="detailLoading" :rows="6" animated />
      <el-descriptions v-else-if="detail" :column="1" border>
        <el-descriptions-item label="命名空间 ID"><span class="mono">{{ detail.namespaceId }}</span></el-descriptions-item>
        <el-descriptions-item label="编码"><span class="mono">{{ detail.namespaceCode }}</span></el-descriptions-item>
        <el-descriptions-item label="名称">{{ detail.namespaceName }}</el-descriptions-item>
        <el-descriptions-item label="目标类型">{{ targetTypeLabel(detail.targetType) }}</el-descriptions-item>
        <el-descriptions-item label="标识值格式"><span class="mono break-all">{{ detail.valuePattern || '不限制' }}</span></el-descriptions-item>
        <el-descriptions-item label="状态"><StatusTag :code="detail.status" :label="statusLabel(detail.status)" /></el-descriptions-item>
        <el-descriptions-item label="乐观锁版本"><span class="mono">{{ detail.lockVersion ?? '-' }}</span></el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createdAt || '-' }}</el-descriptions-item><el-descriptions-item label="更新时间">{{ detail.updatedAt || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { masterDataApi, type NamespaceDefResponse } from '@/api/masterData';
import { apiErrorMessage } from '@/api/client';

const namespaces = ref<NamespaceDefResponse[]>([]); const loading = ref(false); const page = ref(1); const pageSize = ref(20); const total = ref(0);
const filters = reactive({ namespaceCode: '', namespaceName: '', targetType: '', status: '' });
const inactiveCount = computed(() => namespaces.value.filter(item => item.status === 'INACTIVE').length);
const dialogVisible = ref(false); const detailVisible = ref(false); const detailLoading = ref(false); const detail = ref<NamespaceDefResponse | null>(null); const editing = ref(false); const editingId = ref(''); const submitting = ref(false); const formRef = ref<FormInstance>();
const blankForm = () => ({ namespaceCode: '', namespaceName: '', targetType: 'PARTY' as 'PARTY' | 'OBJECT', valuePattern: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE', lockVersion: 0 });
const form = reactive(blankForm());
const rules: FormRules = { namespaceCode: [{ required: true, message: '请输入命名空间编码', trigger: 'blur' }], namespaceName: [{ required: true, message: '请输入命名空间名称', trigger: 'blur' }], targetType: [{ required: true, message: '请选择目标类型', trigger: 'change' }], status: [{ required: true, message: '请选择状态', trigger: 'change' }] };
const targetTypeLabel = (value?: string) => value === 'OBJECT' ? '业务对象 OBJECT' : value === 'PARTY' ? '主体 PARTY' : value || '-';
const statusLabel = (value?: string) => value === 'ACTIVE' ? '启用' : value === 'INACTIVE' ? '停用' : value || '-';
const normalizeCode = (value: string) => { form.namespaceCode = value.trimStart().toUpperCase().replace(/\s+/g, '_'); };
const loadNamespaces = async () => { loading.value = true; try { const result = await masterDataApi.getNamespacePage({ ...filters, page: page.value, size: pageSize.value }); namespaces.value = result.records; total.value = result.total; page.value = result.page; pageSize.value = result.size; } catch (error) { namespaces.value = []; total.value = 0; ElMessage.error(apiErrorMessage(error, '命名空间列表加载失败')); } finally { loading.value = false; } };
const handleSearch = () => { page.value = 1; loadNamespaces(); }; const handleReset = () => { Object.assign(filters, { namespaceCode: '', namespaceName: '', targetType: '', status: '' }); page.value = 1; loadNamespaces(); }; const handleSizeChange = () => { page.value = 1; loadNamespaces(); };
const openCreate = () => { editing.value = false; editingId.value = ''; Object.assign(form, blankForm()); formRef.value?.clearValidate(); dialogVisible.value = true; };
const openEdit = (row: NamespaceDefResponse) => { editing.value = true; editingId.value = String(row.namespaceId); Object.assign(form, { ...blankForm(), ...row, lockVersion: row.lockVersion ?? 0 }); formRef.value?.clearValidate(); dialogVisible.value = true; };
const openDetail = async (row: NamespaceDefResponse) => { detailVisible.value = true; detailLoading.value = true; detail.value = null; try { detail.value = await masterDataApi.getNamespaceById(String(row.namespaceId)); } catch (error) { ElMessage.error(apiErrorMessage(error, '命名空间详情加载失败')); } finally { detailLoading.value = false; } };
const submit = async () => { if (!await formRef.value?.validate().catch(() => false)) return; submitting.value = true; try { if (editing.value) { await masterDataApi.updateNamespace(editingId.value, { namespaceName: form.namespaceName.trim(), valuePattern: form.valuePattern.trim(), status: form.status, lockVersion: form.lockVersion }); ElMessage.success('命名空间更新成功'); } else { await masterDataApi.registerNamespace({ namespaceCode: form.namespaceCode.trim(), namespaceName: form.namespaceName.trim(), targetType: form.targetType, valuePattern: form.valuePattern.trim() || undefined }); ElMessage.success('命名空间创建成功'); } dialogVisible.value = false; await loadNamespaces(); } catch (error) { ElMessage.error(apiErrorMessage(error, editing.value ? '命名空间更新失败' : '命名空间创建失败')); } finally { submitting.value = false; } };
onMounted(loadNamespaces);
</script>

<style scoped>
.namespace-page { padding-bottom: 24px; }
.panel-header > div { display: flex; align-items: baseline; gap: 10px; } .panel-hint { color: var(--color-muted); font-size: 12px; } .code-text { color: var(--color-brand); font-weight: 700; } .pattern-text { color: #475569; font-size: 12px; } .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } .break-all { word-break: break-all; }
@media (max-width: 760px) { .form-grid { grid-template-columns: 1fr; } }
</style>
