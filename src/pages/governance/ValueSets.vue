<template>
<div>
<PageHeader title="值域定义与代码项" />
    <div class="query-table-section" style="margin-bottom: 14px">
      <FilterBar @search="searchValueSets" @reset="resetValueSets">
        <el-input v-model="valueFilters.valueSetCode" placeholder="值域编码" clearable style="width: 150px" />
        <el-input v-model="valueFilters.valueSetName" placeholder="值域名称" clearable style="width: 150px" />
        <el-input v-model="valueFilters.version" placeholder="版本" clearable style="width: 110px" />
        <el-select v-model="valueFilters.status" placeholder="状态" clearable style="width: 110px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select>
        <template #actions><el-button type="primary" @click="openValueSetModal"><el-icon><Plus /></el-icon>新增</el-button></template>
      </FilterBar>
      <div class="table-surface">
        <el-table :data="valueSets" v-loading="state.valueSetsLoading.value">
          <el-table-column prop="valueSetCode" label="编码" min-width="160" />
          <el-table-column prop="valueSetName" label="名称" min-width="160" />
          <el-table-column prop="version" label="版本" width="100" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column label="操作" width="220"><template #default="{ row }"><el-button link type="primary" @click="openValueSetDetails(row)">值域管理</el-button><el-button link @click.stop="editValueSet(row)">编辑</el-button><el-button link @click.stop="toggleValueSet(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button></template></el-table-column>
        </el-table>
        <div class="pagination-row"><el-pagination v-model:current-page="valuePage" :page-size="10" :total="valueTotal" layout="total, prev, pager, next" @current-change="loadValueSets" /></div>
      </div>
    </div>
    <el-drawer v-model="detailsVisible" :title="'值域管理：' + (selectedValueSet?.valueSetName || '')" size="min(1100px, 94vw)">
      <div class="query-table-section">
        <FilterBar v-if="selectedValueSet && !onlyActiveItems" @search="searchItems" @reset="resetItems">
          <el-input v-model="itemFilters.itemCode" placeholder="代码项编码" clearable style="width: 140px" />
          <el-input v-model="itemFilters.itemName" placeholder="代码项名称" clearable style="width: 140px" />
          <el-select v-model="itemFilters.status" placeholder="状态" clearable style="width: 110px"><el-option label="启用" value="ACTIVE" /><el-option label="停用" value="INACTIVE" /></el-select>
          <el-date-picker v-model="itemFilters.effectiveAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="生效时间" style="width: 185px" />
          <template #actions><el-button type="primary" @click="openValueSetItemModal"><el-icon><Plus /></el-icon>新增</el-button></template>
        </FilterBar>
        <div class="table-surface">
          <component :is="onlyActiveItems ? LocalPaginatedTable : ElTable" :data="activeValueSetItems" v-loading="state.itemsLoading.value">
            <template #empty>请选择值域</template>
            <el-table-column prop="code" label="代码" width="140" class-name="mono" />
            <el-table-column prop="name" label="名称" min-width="140" />
            <el-table-column prop="valueSet" label="所属值域" width="160" class-name="mono" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><StatusTag :code="row.status" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130"><template #default="{ row }"><el-button link @click="editItem(row)">编辑</el-button><el-button link @click="toggleItem(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button></template></el-table-column>
          </component>
          <div v-if="selectedValueSet && !onlyActiveItems" class="pagination-row"><el-pagination v-model:current-page="itemPage" :page-size="10" :total="itemTotal" layout="total, prev, pager, next" @current-change="loadItems" /></div>
        </div>
      </div>
    </el-drawer>
    <el-dialog v-model="valueSetModalVisible" :title="editingValueSet ? '编辑值域' : '新增值域'" width="480px">
      <el-form :model="valueSetForm" label-position="top">
        <el-form-item label="值域编码" required><el-input v-model="valueSetForm.valueSetCode" :disabled="!!editingValueSet" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="valueSetForm.valueSetName" /></el-form-item>
        <el-form-item label="版本" required><el-input v-model="valueSetForm.version" :disabled="!!editingValueSet" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="valueSetModalVisible = false">取消</el-button><el-button type="primary" @click="saveValueSet">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="valueModalVisible" :title="editingItem ? '编辑代码项' : '新增代码项'" width="480px" :close-on-click-modal="false">
      <el-form :model="valueForm" label-position="top">
        <el-form-item label="所属值域集 (ValueSet)" required>
          <el-input v-model="valueForm.valueSet" disabled />
        </el-form-item>
        <el-form-item label="代码 (Code)" required>
          <el-input v-model="valueForm.code" :disabled="!!editingItem" placeholder="如: QUALIFIED" />
        </el-form-item>
        <el-form-item label="中文名称 (Name)" required>
          <el-input v-model="valueForm.name" placeholder="如: 合格" />
        </el-form-item>
        <el-form-item label="生效时间" required><el-date-picker v-model="valueForm.validFrom" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item>
        <el-form-item label="失效时间"><el-date-picker v-model="valueForm.validTo" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item>
        <el-form-item label="扩展属性 (JSON)"><el-input v-model="valueForm.attributes" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="valueModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveValueSetItem">保存代码项</el-button>
      </template>
    </el-dialog>

</div>
</template>
<script setup lang="ts">
import { ElTable } from 'element-plus';
import LocalPaginatedTable from '@/components/common/LocalPaginatedTable.vue';
import { onMounted, ref } from 'vue';
import type { ValueSet } from '@/api/standards';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { useStandards } from '@/composables/useStandards';
const state = useStandards();
const { standards, valueSets, selectedValueSet, onlyActiveItems, editingElement, editingValueSet, editingItem, valueSetModalVisible, valueSetForm, elementPage, valuePage, itemPage, elementTotal, valueTotal, itemTotal, elementModalVisible, valueModalVisible, dataTypes, securityClasses, emptyElementFilters, emptyValueFilters, emptyItemFilters, elementFilters, appliedElementFilters, valueFilters, appliedValueFilters, itemFilters, appliedItemFilters, queryParams, searchElements, resetElements, searchValueSets, resetValueSets, searchItems, resetItems, activeValueSet, elementForm, valueForm, dataElements, valueSetItems, activeValueSetItems, reportError, loadElements, loadValueSets, loadItems, loadRemote, selectValueSet, openDataElementModal, editElement, saveDataElement, openValueSetModal, editValueSet, saveValueSet, toggleElement, toggleValueSet, openValueSetItemModal, editItem, saveValueSetItem, toggleItem } = state;
onMounted(() => { void loadValueSets(); });
const detailsVisible = ref(false);
function openValueSetDetails(row: ValueSet) {
  selectValueSet(row);
  detailsVisible.value = true;
}
</script>
<style scoped>.pagination-row{display:flex;justify-content:flex-end;margin:14px 0}.panel{margin-bottom:16px}.panel-header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0}.panel-header h2{font-size:15px;margin:0}</style>
