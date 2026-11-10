<template>
<div>
<PageHeader title="数据元目录" />
      <div class="query-table-section">
        <FilterBar @search="searchElements" @reset="resetElements">
          <el-input v-model="elementFilters.elementCode" placeholder="数据元编码" clearable style="width: 150px" />
          <el-input v-model="elementFilters.elementName" placeholder="数据元名称" clearable style="width: 150px" />
          <el-select v-model="elementFilters.dataType" placeholder="数据类型" clearable style="width: 130px"><el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" /></el-select>
          <el-input v-model="elementFilters.valueSetCode" placeholder="关联值域编码" clearable style="width: 150px" />
          <el-select v-model="elementFilters.securityClass" placeholder="安全级别" clearable style="width: 140px"><el-option v-for="item in securityClasses" :key="item" :label="item" :value="item" /></el-select>
          <el-select v-model="elementFilters.status" placeholder="状态" clearable style="width: 110px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select>
          <template #actions><el-button @click="downloadTemplate">下载导入模板</el-button><el-button @click="importVisible = true">导入数据元</el-button><el-button type="primary" @click="openDataElementModal"><el-icon><Plus /></el-icon>新增</el-button></template>
        </FilterBar>
        <div class="table-surface">
          <el-table
            :data="dataElements"
            v-loading="state.elementsLoading.value"
            style="width: 100%"
          >
            <el-table-column prop="code" label="数据元编码" width="180" class-name="mono" />
            <el-table-column prop="name" label="中文名称" min-width="140" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="valueSet" label="关联值域" min-width="150" class-name="mono" />
            <el-table-column prop="securityClass" label="安全级别" width="130" />
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column prop="lockVersion" label="锁版本" width="90" />
            <el-table-column label="操作" width="130"><template #default="{ row }"><el-button link @click.stop="editElement(row)">编辑</el-button><el-button link @click.stop="toggleElement(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button></template></el-table-column>
          </el-table>
          <div class="pagination-row"><el-pagination v-model:current-page="elementPage" :page-size="10" :total="elementTotal" layout="total, prev, pager, next" @current-change="loadElements" /></div>
        </div>
      </div>

    <el-dialog v-model="elementModalVisible" :title="editingElement ? '编辑数据元' : '新增数据元'" width="520px" :close-on-click-modal="false">
      <el-form :model="elementForm" label-position="top">
        <el-form-item label="数据元编码 (DE_CODE)" required>
          <el-input v-model="elementForm.code" :disabled="!!editingElement" placeholder="如: DE_HERB_WATER_CONTENT" />
        </el-form-item>
        <el-form-item label="中文名称" required>
          <el-input v-model="elementForm.name" placeholder="如: 水分含量(%)" />
        </el-form-item>
        <el-form-item label="数据类型" required>
          <el-select v-model="elementForm.type" style="width: 100%">
            <el-option v-for="type in ['STRING', 'DECIMAL', 'INTEGER', 'BOOLEAN', 'DATE', 'DATETIME', 'OBJECT', 'ARRAY']" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联值域代码集 (ValueSet)">
          <el-input v-model="elementForm.valueSet" placeholder="如: VS_WATER_TEST_METHOD 或留空" />
        </el-form-item>
        <el-form-item label="安全级别" required><el-select v-model="elementForm.securityClass" style="width: 100%"><el-option v-for="item in ['PUBLIC', 'INTERNAL', 'SENSITIVE', 'STRICT_SENSITIVE']" :key="item" :label="item" :value="item" /></el-select></el-form-item>
        <el-form-item label="字符串最大长度"><el-input-number v-model="elementForm.maxLength" :min="0" :precision="0" /></el-form-item>
        <el-form-item label="数值精度"><el-input-number v-model="elementForm.numericPrecision" :min="1" :precision="0" /></el-form-item>
        <el-form-item label="数值小数位"><el-input-number v-model="elementForm.numericScale" :min="0" :precision="0" /></el-form-item>
        <el-form-item label="标准依据"><el-input v-model="elementForm.sourceReference" maxlength="512" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="elementModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDataElement">确认保存</el-button>
      </template>
    </el-dialog>


</div>
<el-dialog v-model="importVisible" title="导入数据元" width="min(480px, 94vw)" :close-on-click-modal="false"><el-form label-position="top"><el-form-item label="已上传文件 ID" required><el-input v-model="importFileId" /></el-form-item></el-form><template #footer><el-button @click="$router.push('/settings/uploaded-files')">上传文件</el-button><el-button type="primary" :loading="importing" @click="importElements">提交导入</el-button></template></el-dialog>
<el-drawer v-model="importResultVisible" title="数据元导入结果" size="min(800px,94vw)"><template v-if="importResult"><el-descriptions :column="2" border><el-descriptions-item label="文件 ID">{{ importResult.fileId }}</el-descriptions-item><el-descriptions-item label="总行数">{{ importResult.totalRows }}</el-descriptions-item><el-descriptions-item label="成功行数">{{ importResult.successCount }}</el-descriptions-item><el-descriptions-item label="未导入行数">{{ importResult.failedCount }}</el-descriptions-item><el-descriptions-item label="错误行数">{{ importResult.errorRowCount }}</el-descriptions-item></el-descriptions><LocalPaginatedTable :data="importResult.errors || []"><el-table-column prop="row" label="Excel 行号" width="120" /><el-table-column prop="field" label="字段" min-width="160" /><el-table-column prop="message" label="错误原因" min-width="280" /></LocalPaginatedTable></template></el-drawer>
</template>
<script setup lang="ts">
import LocalPaginatedTable from '@/components/common/LocalPaginatedTable.vue';
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { request, apiErrorMessage } from '@/api/client';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { useStandards } from '@/composables/useStandards';
const state = useStandards();
const { standards, valueSets, selectedValueSet, onlyActiveItems, editingElement, editingValueSet, editingItem, valueSetModalVisible, valueSetForm, elementPage, valuePage, itemPage, elementTotal, valueTotal, itemTotal, elementModalVisible, valueModalVisible, dataTypes, securityClasses, emptyElementFilters, emptyValueFilters, emptyItemFilters, elementFilters, appliedElementFilters, valueFilters, appliedValueFilters, itemFilters, appliedItemFilters, queryParams, searchElements, resetElements, searchValueSets, resetValueSets, searchItems, resetItems, activeValueSet, elementForm, valueForm, dataElements, valueSetItems, activeValueSetItems, reportError, loadElements, loadValueSets, loadItems, loadRemote, selectValueSet, openDataElementModal, editElement, saveDataElement, openValueSetModal, editValueSet, saveValueSet, toggleElement, toggleValueSet, openValueSetItemModal, editItem, saveValueSetItem, toggleItem } = state;
onMounted(() => { void loadElements(); });
const importVisible = ref(false), importFileId = ref(''), importing = ref(false);
const importResult = ref<any>(null), importResultVisible = ref(false);
async function importElements() {
  if (importing.value) return;
  if (!/^\d+$/.test(importFileId.value.trim())) return ElMessage.warning('请输入已上传文件 ID');
  importing.value = true;
  try { const result: any = await request.post('/openapi/v1/data-elements/imports', { fileId: importFileId.value.trim() }); importResult.value = result; importVisible.value = false; importResultVisible.value = true; if (result.failedCount > 0 || result.errors?.length) ElMessage.warning('导入未写入，请查看行级错误'); else ElMessage.success(`已导入 ${result.successCount} 行`); await loadElements(); }
  catch (error) { ElMessage.error(apiErrorMessage(error, '导入失败')); } finally { importing.value = false; }
}
async function downloadTemplate() { try { const blob = await request.get<Blob, Blob>('/openapi/v1/data-elements/import-template', { responseType: 'blob' }); const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'data-elements-template.xlsx'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (error) { ElMessage.error(apiErrorMessage(error, '模板下载失败')); } }
</script>
<style scoped>.pagination-row{display:flex;justify-content:flex-end;margin:14px 0}.panel{margin-bottom:16px}.panel-header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0}.panel-header h2{font-size:15px;margin:0}</style>
