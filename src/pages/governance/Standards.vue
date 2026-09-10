<template>
  <div class="governance-page">
    <PageHeader
      title="数据元与值域标准"
      subtitle="全平台统一中药追溯数据字典、国家中药标准规范集与 Code/Name 代码表管理"
    >
      <template #actions>
        <el-button type="primary" @click="openDataElementModal">新增数据元</el-button>
        <el-button @click="openValueSetItemModal">新增代码值</el-button>
      </template>
    </PageHeader>

    <!-- Standards Overview Cards -->
    <div class="standards-banner">
      <div v-for="std in standards" :key="std.code" class="std-card">
        <div class="std-badge">国家标准</div>
        <div class="std-name">{{ std.name }}</div>
        <div class="std-meta">
          <span>代码: <strong class="mono">{{ std.code }}</strong></span>
          <span>版本: {{ std.version }}</span>
          <span v-if="std.mandatoryLength">编码长度: {{ std.mandatoryLength }}位</span>
        </div>
      </div>
    </div>

    <div class="grid-two">
      <div class="panel">
        <div class="panel-header flex-between">
          <h2>数据元目录 (Data Elements)</h2>
          <el-input v-model="filterKeyword" placeholder="搜索编码或名称..." size="small" style="width: 160px" clearable />
        </div>
        <el-table
          :data="filteredDataElements"
          highlight-current-row
          @current-change="handleSelectElement"
          style="width: 100%"
        >
          <el-table-column prop="code" label="数据元编码" width="180" class-name="mono" />
          <el-table-column prop="name" label="中文名称" min-width="140" />
          <el-table-column prop="type" label="类型" width="80" />
          <el-table-column prop="valueSet" label="关联值域" min-width="150" class-name="mono" />
        </el-table>
      </div>

      <div class="panel">
        <div class="panel-header flex-between">
          <h2>
            <span>值域明细: </span>
            <strong class="mono">{{ activeValueSet || '全部值域' }}</strong>
          </h2>
          <el-tag size="small" type="success">{{ activeValueSetItems.length }} 个代码项</el-tag>
        </div>
        <el-table :data="activeValueSetItems">
          <el-table-column prop="code" label="代码 (Code)" width="140" class-name="mono" />
          <el-table-column prop="name" label="名称 (Name)" min-width="140" />
          <el-table-column prop="valueSet" label="所属值域" width="160" class-name="mono" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }"><StatusTag :code="row.status" /></template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- New Data Element Dialog -->
    <el-dialog v-model="elementModalVisible" title="新增数据元标准定义" width="520px">
      <el-form :model="elementForm" label-position="top">
        <el-form-item label="数据元编码 (DE_CODE)" required>
          <el-input v-model="elementForm.code" placeholder="如: DE_HERB_WATER_CONTENT" />
        </el-form-item>
        <el-form-item label="中文名称" required>
          <el-input v-model="elementForm.name" placeholder="如: 水分含量(%)" />
        </el-form-item>
        <el-form-item label="数据类型" required>
          <el-select v-model="elementForm.type" style="width: 100%">
            <el-option label="string (字符串)" value="string" />
            <el-option label="number (数值型)" value="number" />
            <el-option label="boolean (布尔型)" value="boolean" />
            <el-option label="datetime (日期时间)" value="datetime" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联值域代码集 (ValueSet)">
          <el-input v-model="elementForm.valueSet" placeholder="如: VS_WATER_TEST_METHOD 或留空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="elementModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDataElement">确认保存</el-button>
      </template>
    </el-dialog>

    <!-- New Value Item Dialog -->
    <el-dialog v-model="valueModalVisible" title="新增值域代码明细 (Code Item)" width="480px">
      <el-form :model="valueForm" label-position="top">
        <el-form-item label="所属值域集 (ValueSet)" required>
          <el-select v-model="valueForm.valueSet" style="width: 100%">
            <el-option
              v-for="vs in uniqueValueSets"
              :key="vs"
              :label="vs"
              :value="vs"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="代码 (Code)" required>
          <el-input v-model="valueForm.code" placeholder="如: QUALIFIED" />
        </el-form-item>
        <el-form-item label="中文名称 (Name)" required>
          <el-input v-model="valueForm.name" placeholder="如: 合格" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="valueModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveValueSetItem">保存代码项</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { governanceApi } from '@/api/governance';

const standards = ref<any[]>([]);
const elementModalVisible = ref(false);
const valueModalVisible = ref(false);
const filterKeyword = ref('');
const activeValueSet = ref<string>('');

const elementForm = ref({
  code: '',
  name: '',
  type: 'string',
  valueSet: ''
});

const valueForm = ref({
  valueSet: 'VS_QUALITY_CONCLUSION',
  code: '',
  name: ''
});

const dataElements = ref([
  { code: 'DE_QUALITY_CONCLUSION', name: '质量检验结论', type: 'string', valueSet: 'VS_QUALITY_CONCLUSION' },
  { code: 'DE_UNIT_CODE', name: '标准计量单位', type: 'string', valueSet: 'VS_UNIT_CODE' },
  { code: 'DE_NHSA_PIECE_CODE', name: '国家医保饮片编码', type: 'string', valueSet: 'VS_NHSA_CODES' },
  { code: 'DE_PACKAGE_LEVEL', name: '包装追溯层级', type: 'string', valueSet: 'VS_PACKAGE_LEVEL' },
  { code: 'DE_STORAGE_CONDITION', name: '温湿度储存条件', type: 'string', valueSet: 'VS_STORAGE_COND' }
]);

const valueSetItems = ref([
  { valueSet: 'VS_QUALITY_CONCLUSION', code: 'QUALIFIED', name: '合格', status: 'ACTIVE' },
  { valueSet: 'VS_QUALITY_CONCLUSION', code: 'UNQUALIFIED', name: '不合格', status: 'ACTIVE' },
  { valueSet: 'VS_QUALITY_CONCLUSION', code: 'PENDING_REINSPECT', name: '待复检', status: 'ACTIVE' },
  { valueSet: 'VS_UNIT_CODE', code: 'kg', name: '千克/公斤', status: 'ACTIVE' },
  { valueSet: 'VS_UNIT_CODE', code: 'g', name: '克', status: 'ACTIVE' },
  { valueSet: 'VS_UNIT_CODE', code: 'bag', name: '袋', status: 'ACTIVE' },
  { valueSet: 'VS_UNIT_CODE', code: 'box', name: '箱', status: 'ACTIVE' },
  { valueSet: 'VS_NHSA_CODES', code: '8691234567890100', name: '三七切片标准品', status: 'ACTIVE' },
  { valueSet: 'VS_NHSA_CODES', code: '8691234567890101', name: '天麻切片特等品', status: 'ACTIVE' },
  { valueSet: 'VS_PACKAGE_LEVEL', code: 'PRIMARY', name: '一级小包装(袋)', status: 'ACTIVE' },
  { valueSet: 'VS_PACKAGE_LEVEL', code: 'SECONDARY', name: '二级中包装(盒)', status: 'ACTIVE' },
  { valueSet: 'VS_PACKAGE_LEVEL', code: 'TERTIARY', name: '三级大包装(箱)', status: 'ACTIVE' }
]);

const filteredDataElements = computed(() => {
  if (!filterKeyword.value) return dataElements.value;
  const kw = filterKeyword.value.toLowerCase();
  return dataElements.value.filter(
    e => (e.code || '').toLowerCase().includes(kw) || (e.name || '').toLowerCase().includes(kw) || (e.valueSet || '').toLowerCase().includes(kw)
  );
});

const activeValueSetItems = computed(() => {
  if (!activeValueSet.value) return valueSetItems.value;
  return valueSetItems.value.filter(v => v.valueSet === activeValueSet.value);
});

const uniqueValueSets = computed(() => {
  const sets = new Set(dataElements.value.map(e => e.valueSet).filter(Boolean));
  return Array.from(sets);
});

onMounted(async () => {
  try {
    standards.value = await governanceApi.getStandards();
  } catch (err) {
    console.error('Failed to load standards', err);
  }
});

const handleSelectElement = (row: any) => {
  if (row && row.valueSet) {
    activeValueSet.value = row.valueSet;
  } else {
    activeValueSet.value = '';
  }
};

const openDataElementModal = () => {
  elementForm.value = {
    code: 'DE_',
    name: '',
    type: 'string',
    valueSet: 'VS_'
  };
  elementModalVisible.value = true;
};

const saveDataElement = () => {
  if (!elementForm.value.code || !elementForm.value.name) {
    ElMessage.warning('请填写数据元编码与名称');
    return;
  }
  dataElements.value.unshift({ ...elementForm.value });
  elementModalVisible.value = false;
  ElMessage.success(`成功注册数据元 [${elementForm.value.code}]`);
};

const openValueSetItemModal = () => {
  valueForm.value = {
    valueSet: activeValueSet.value || uniqueValueSets.value[0] || 'VS_QUALITY_CONCLUSION',
    code: '',
    name: ''
  };
  valueModalVisible.value = true;
};

const saveValueSetItem = () => {
  if (!valueForm.value.code || !valueForm.value.name) {
    ElMessage.warning('请填写代码与名称');
    return;
  }
  valueSetItems.value.unshift({
    valueSet: valueForm.value.valueSet,
    code: valueForm.value.code,
    name: valueForm.value.name,
    status: 'ACTIVE'
  });
  valueModalVisible.value = false;
  ElMessage.success(`成功添加值域项 [${valueForm.value.code}]`);
};
</script>

<style scoped>
.standards-banner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.std-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px 14px;
  position: relative;
}

.std-badge {
  display: inline-block;
  font-size: 10px;
  background: #e8f4ec;
  color: var(--color-primary);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  margin-bottom: 6px;
}

.std-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.std-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--color-muted);
}

.grid-two {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
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

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  font-size: 15px;
  margin: 0;
  font-weight: 600;
}
</style>
