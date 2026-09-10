<template>
  <div class="lineage-container">
    <div class="lineage-toolbar">
      <div class="filter-group">
        <label>追踪方向:</label>
        <el-radio-group v-model="direction" size="small">
          <el-radio-button label="BOTH">双向</el-radio-button>
          <el-radio-button label="UPSTREAM">追溯 (上游源头)</el-radio-button>
          <el-radio-button label="DOWNSTREAM">追踪 (下游去向)</el-radio-button>
        </el-radio-group>
      </div>

      <div class="filter-group">
        <label>深度限制:</label>
        <el-select v-model="maxDepth" size="small" style="width: 100px">
          <el-option label="1 层" :value="1" />
          <el-option label="3 层" :value="3" />
          <el-option label="5 层" :value="5" />
        </el-select>
      </div>

      <div class="filter-group">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="CANVAS">ECharts 图谱视图</el-radio-button>
          <el-radio-button label="TABLE">等价表格视图</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- ECharts Canvas View -->
    <div v-show="viewMode === 'CANVAS'" ref="chartRef" class="chart-canvas"></div>

    <!-- Tabular Fallback View -->
    <div v-show="viewMode === 'TABLE'" class="table-fallback">
      <el-table :data="tableLineageData" border>
        <el-table-column prop="depth" label="层级深度" width="90" />
        <el-table-column prop="sourceNode" label="源节点对象" min-width="180" />
        <el-table-column prop="relation" label="演化/交易关系" width="140" />
        <el-table-column prop="targetNode" label="目标节点对象" min-width="180" />
        <el-table-column prop="eventId" label="关联事件 ID" width="210" class-name="mono" />
        <el-table-column prop="time" label="发生时间" width="160" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

const chartRef = ref<HTMLDivElement | null>(null);
const chartInstance = shallowRef<echarts.ECharts | null>(null);

const direction = ref('BOTH');
const maxDepth = ref(3);
const viewMode = ref<'CANVAS' | 'TABLE'>('CANVAS');

const tableLineageData = ref([
  { depth: 'L0', sourceNode: '文山三七种植批次 (CB-WS-2026-018)', relation: '采收原料', targetNode: '蒸三七初加工批次 (RAW-SQ-260731)', eventId: '01J7EVENT0KM2026080800005', time: '2026-07-28 09:15' },
  { depth: 'L1', sourceNode: '蒸三七初加工批次 (RAW-SQ-260731)', relation: '精深加工', targetNode: '三七饮片加工批次 (SQ-260731-08)', eventId: '01J7EVENT0KM2026080800010', time: '2026-07-31 14:00' },
  { depth: 'L2', sourceNode: '三七饮片加工批次 (SQ-260731-08)', relation: '入仓交割', targetNode: '昆明中心仓库存 (INV-SQ-260731-08)', eventId: '01J7EVENT0KM2026080800021', time: '2026-08-08 15:42' },
  { depth: 'L3', sourceNode: '昆明中心仓库存 (INV-SQ-260731-08)', relation: '处方调配', targetNode: '云南省中医医院处方 (PRE-8892102)', eventId: '01J7EVENT0KM2026080800030', time: '2026-08-08 16:10' }
]);

const initChart = () => {
  if (!chartRef.value) return;

  if (chartInstance.value) {
    chartInstance.value.dispose();
  }

  const chart = echarts.init(chartRef.value);
  chartInstance.value = chart;

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [
      {
        type: 'tree',
        data: [
          {
            name: '文山三七种植批次\n(CB-WS-2026-018)',
            itemStyle: { color: '#176B4D' },
            children: [
              {
                name: '蒸三七初加工\n(RAW-SQ-260731)',
                itemStyle: { color: '#166A8F' },
                children: [
                  {
                    name: '三七饮片加工批次\n(SQ-260731-08)',
                    itemStyle: { color: '#176B4D' },
                    children: [
                      {
                        name: '昆明中心仓\n(INV-SQ-260731-08)',
                        itemStyle: { color: '#A45C00' },
                        children: [
                          {
                            name: '云南省中医医院处方\n(PRE-8892102)',
                            itemStyle: { color: '#157347' }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        top: '10%',
        left: '15%',
        bottom: '10%',
        right: '20%',
        symbolSize: 14,
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 12
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left'
          }
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750
      }
    ]
  };

  chart.setOption(option);
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (chartInstance.value) {
    chartInstance.value.dispose();
    chartInstance.value = null;
  }
});

const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize();
  }
};

watch([direction, maxDepth, viewMode], () => {
  if (viewMode.value === 'CANVAS') {
    setTimeout(initChart, 50);
  }
});
</script>

<style scoped>
.lineage-container {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  overflow: hidden;
}

.lineage-toolbar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 16px;
  background: #f7f9f8;
  border-bottom: 1px solid var(--color-border);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.filter-group label {
  color: var(--color-muted);
}

.chart-canvas {
  width: 100%;
  height: 480px;
}

.table-fallback {
  padding: 14px;
}
</style>
