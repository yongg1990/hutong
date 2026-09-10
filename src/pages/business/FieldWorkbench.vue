<template>
  <div class="business-page">
    <PageHeader
      title="田间种植工作台"
      subtitle="基地、地块与作物批次溯源事件控制视图"
    >
      <template #actions>
        <el-button @click="exportData">导出结果</el-button>
        <el-button type="primary" @click="router.push('/business/events/new/PLANTED')">
          记录种植建档
        </el-button>
      </template>
    </PageHeader>

    <!-- Interactive Scenario Stages Header Bar -->
    <div class="stages-bar">
      <div
        v-for="stage in stages"
        :key="stage.code"
        class="stage-item"
        :class="{ active: currentStage === stage.code }"
        @click="selectStage(stage.code)"
      >
        <div class="stage-header">
          <strong>{{ stage.title }}</strong>
          <span class="stage-badge">{{ getStageCount(stage.code) }}</span>
        </div>
        <span class="stage-sub">{{ stage.subtitle }}</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input
        v-model="searchKeyword"
        placeholder="输入批次号/药材/地块"
        clearable
        style="width: 200px"
      />
      <el-select v-model="selectedBase" placeholder="全部基地" clearable style="width: 170px">
        <el-option label="全部基地" value="" />
        <el-option label="文山三七示范基地" value="文山" />
        <el-option label="大理当归种植基地" value="大理" />
        <el-option label="丽江木香云药基地" value="丽江" />
        <el-option label="楚雄滇重楼基地" value="楚雄" />
        <el-option label="昭通乌蒙天麻基地" value="昭通" />
      </el-select>

      <template v-if="currentStage !== 'ALL'">
        <el-tag closable type="success" @close="currentStage = 'ALL'">
          当前阶段过滤: {{ currentStageName }}
        </el-tag>
      </template>
    </FilterBar>

    <!-- Main Content Grid -->
    <div class="grid-two">
      <div class="panel">
        <div class="panel-header">
          <div class="header-title">
            <h2>作物批次列表</h2>
            <el-tag v-if="currentStage !== 'ALL'" size="small" type="info">
              阶段: {{ currentStageName }}
            </el-tag>
          </div>
          <span class="count-text">筛选共 {{ filteredBatches.length }} / {{ allBatches.length }} 条</span>
        </div>
        <el-table
          :data="filteredBatches"
          @row-click="selectBatch"
          highlight-current-row
          empty-text="暂无匹配该阶段或条件的作物批次"
        >
          <el-table-column prop="batchNo" label="作物批次号" min-width="140" class-name="mono" />
          <el-table-column label="基地 / 地块" min-width="160">
            <template #default="{ row }">{{ row.baseName }} / {{ row.plotName }}</template>
          </el-table-column>
          <el-table-column prop="herbName" label="药材" width="90" />
          <el-table-column prop="plantDate" label="种植日期" width="110" />
          <el-table-column prop="lastEvent" label="最近农事/事件" min-width="170" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }"><StatusTag :code="row.status" /></template>
          </el-table-column>
          <el-table-column label="操作 / 协同" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="router.push('/trust/lineage?batchNo=' + row.batchNo)">
                血缘图谱
              </el-button>
              <el-button size="small" link @click.stop="router.push('/business/process-quality?sourceBatchNo=' + row.batchNo)">
                转初加工 ➔
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Right Side Batch Details Card -->
      <div class="panel" v-if="selectedRow">
        <div class="panel-header">
          <h2>批次档案: {{ selectedRow.batchNo }}</h2>
          <el-button size="small" link type="primary" @click="router.push('/master-data/objects')">
            查看物化主数据
          </el-button>
        </div>
        <div class="panel-body">
          <div class="kv-row"><span>基地地块:</span> <b>{{ selectedRow.baseName }} / {{ selectedRow.plotName }}</b></div>
          <div class="kv-row"><span>药材基原:</span> <b>{{ selectedRow.herbName }}</b></div>
          <div class="kv-row"><span>当前阶段:</span> <b><el-tag size="small" type="success">{{ getStageTitle(selectedRow.stage) }}</el-tag></b></div>
          <div class="kv-row"><span>种植日期:</span> <b>{{ selectedRow.plantDate }}</b></div>
          <div class="kv-row"><span>责任主体:</span> <b>云南示范中药材种植合作社</b></div>
          <div class="kv-row"><span>最近农事:</span> <b>{{ selectedRow.lastEvent }}</b></div>

          <div class="card-actions">
            <el-button type="primary" size="small" @click="router.push('/business/events/new/PLANTED')">
              记录农事作业
            </el-button>
            <el-button size="small" @click="router.push('/business/events/new/PLANTED')">
              记录投入品施用
            </el-button>
          </div>

          <el-divider style="margin: 14px 0 10px;" />
          <div class="cross-actions-title">全链协同与追溯穿透：</div>
          <div class="card-actions secondary">
            <el-button size="small" type="success" plain @click="router.push('/business/process-quality?sourceBatchNo=' + selectedRow.batchNo)">
              流转至加工与质检 ➔
            </el-button>
            <el-button size="small" type="info" plain @click="router.push('/trust/lineage?batchNo=' + selectedRow.batchNo)">
              查看此批次溯源图谱
            </el-button>
          </div>
        </div>
      </div>
      <div class="panel empty-panel" v-else>
        <div class="empty-tip">请在左侧列表选择作物批次查看详情</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { fieldApi } from '@/api/field';
import type { FieldCropBatch } from '@/types';

const router = useRouter();
const searchKeyword = ref('');
const selectedBase = ref('');
const currentStage = ref<string>('ALL');
const loading = ref(false);

const allBatches = ref<FieldCropBatch[]>([]);

const loadBatches = async () => {
  loading.value = true;
  try {
    const res = await fieldApi.getFieldBatches({
      keyword: searchKeyword.value,
      baseName: selectedBase.value,
      stage: currentStage.value
    });
    allBatches.value = res;
  } catch (err) {
    console.error('Failed to load field batches', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadBatches();
});

const stages = [
  { code: 'ALL', title: '全部批次', subtitle: '全流程概览' },
  { code: 'PLANTING', title: '种植建档', subtitle: '地块绑定与播种' },
  { code: 'AGRICULTURAL', title: '农事作业', subtitle: '灌溉/除草/遮阴' },
  { code: 'INPUTS', title: '投入品', subtitle: '有机肥/农药核对' },
  { code: 'HARVEST_PREP', title: '采收准备', subtitle: '农残预检与准备' },
  { code: 'HARVEST_DONE', title: '采收完成', subtitle: '鲜重核验与归档' }
];

const getStageTitle = (code: string) => {
  const matched = stages.find(s => s.code === code);
  return matched ? matched.title : code;
};

const currentStageName = computed(() => getStageTitle(currentStage.value));

const getStageCount = (code: string) => {
  if (code === 'ALL') return allBatches.value.length;
  return allBatches.value.filter(b => b.stage === code).length;
};

const selectStage = (code: string) => {
  if (currentStage.value === code && code !== 'ALL') {
    currentStage.value = 'ALL';
  } else {
    currentStage.value = code;
  }
};

const filteredBatches = computed(() => {
  return allBatches.value.filter((b) => {
    const matchesStage = currentStage.value === 'ALL' || b.stage === currentStage.value;
    const kw = (searchKeyword.value || '').trim().toLowerCase();
    const matchesKw = !kw ||
      (b.batchNo || '').toLowerCase().includes(kw) ||
      (b.herbName || '').toLowerCase().includes(kw) ||
      (b.plotName || '').toLowerCase().includes(kw);
    const matchesBase = !selectedBase.value || (b.baseName || '').includes(selectedBase.value);
    return matchesStage && matchesKw && matchesBase;
  });
});

const selectedRow = ref<FieldCropBatch | null>(filteredBatches.value[0] || null);

watch(filteredBatches, (newList) => {
  if (newList.length > 0) {
    if (!selectedRow.value || !newList.find(item => item.id === selectedRow.value?.id)) {
      selectedRow.value = newList[0];
    }
  } else {
    selectedRow.value = null;
  }
}, { immediate: true });

const selectBatch = (row: FieldCropBatch) => {
  selectedRow.value = row;
};

const handleSearch = () => {
  ElMessage.success(`查询完成，找到 ${filteredBatches.value.length} 条记录`);
};

const handleReset = () => {
  searchKeyword.value = '';
  selectedBase.value = '';
  currentStage.value = 'ALL';
  ElMessage.info('刷新已重置为全部数据');
};

const exportData = () => {
  ElMessage.success(`阶段 [${currentStageName.value}] 田间批次导出一份 CSV 文件！`);
};
</script>

<style scoped>
.stages-bar {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-bottom: 14px;
}

.stage-item {
  padding: 12px 14px;
  border-right: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.stage-item:last-child {
  border-right: 0;
}

.stage-item:hover {
  background: #f4f8f6;
}

.stage-item.active {
  box-shadow: inset 0 3px var(--color-brand);
  background: #ebf4f0;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.stage-item strong {
  font-size: 13px;
  color: var(--color-ink);
}

.stage-item.active strong {
  color: var(--color-brand);
  font-weight: 700;
}

.stage-badge {
  font-size: 11px;
  font-weight: 600;
  background: rgba(23, 107, 77, 0.12);
  color: var(--color-brand);
  padding: 1px 6px;
  border-radius: 10px;
}

.stage-sub {
  display: block;
  font-size: 11px;
  color: var(--color-muted);
}

.grid-two {
  display: grid;
  grid-template-columns: 1.45fr 0.75fr;
  gap: 14px;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--color-muted);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-header h2 {
  font-size: 15px;
  margin: 0;
  font-weight: 600;
}

.count-text {
  font-size: 12px;
  color: var(--color-muted);
}

.panel-body {
  padding: 16px;
}

.kv-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #edf0ee;
  font-size: 13px;
}

.kv-row span {
  color: var(--color-muted);
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.cross-actions-title {
  font-size: 12px;
  font-weight: 600;
  color: #435b50;
  margin-bottom: 8px;
}

.card-actions.secondary {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-actions.secondary .el-button {
  width: 100%;
  justify-content: center;
}
</style>
