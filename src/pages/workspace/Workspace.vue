<template>
  <div class="workspace-page">
    <PageHeader
      title="工作台"
      :subtitle="contextStore.projectName + ' · 只展示当前权限范围内的事项与待办'"
    >
      <template #actions>
        <el-button @click="refreshData">刷新</el-button>
      </template>
    </PageHeader>

    <!-- Top Metrics Row -->
    <div class="metric-row">
      <div class="metric-card metric-warn clickable" @click="router.push('/governance/cases')" title="点击跳转至治理异常案卷">
        <div class="metric-card-top">
          <span class="label">待处理治理异常</span>
          <div class="metric-icon-badge warn">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        <div class="metric-number-row">
          <b class="number mono">{{ stats.pendingGovernanceCases }}</b>
          <span class="metric-unit">件待督办</span>
        </div>
        <div class="metric-bottom">
          <span class="tag warn">前往案卷 ➔</span>
          <span class="metric-trend">2件超期高危</span>
        </div>
      </div>

      <div class="metric-card metric-info clickable" @click="router.push('/governance/batches')" title="点击跳转至接入批次监控">
        <div class="metric-card-top">
          <span class="label">处理中接入批次</span>
          <div class="metric-icon-badge info">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        </div>
        <div class="metric-number-row">
          <b class="number mono">{{ stats.processingIngestBatches }}</b>
          <span class="metric-unit">批在途解析</span>
        </div>
        <div class="metric-bottom">
          <span class="tag info">接入监控 ➔</span>
          <span class="metric-trend">平均耗时 1.2s</span>
        </div>
      </div>

      <div class="metric-card metric-danger clickable" @click="router.push('/trust/proofs')" title="点击跳转至区块链存证与补偿单">
        <div class="metric-card-top">
          <span class="label">待补偿存证</span>
          <div class="metric-icon-badge danger">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        <div class="metric-number-row">
          <b class="number mono">{{ stats.pendingProofs }}</b>
          <span class="metric-unit">单待重试</span>
        </div>
        <div class="metric-bottom">
          <span class="tag bad">存证核验 ➔</span>
          <span class="metric-trend">重试通道就绪</span>
        </div>
      </div>

      <div class="metric-card metric-success clickable" @click="router.push('/trust/events')" title="点击跳转至可信事件查询">
        <div class="metric-card-top">
          <span class="label">今日接受事件</span>
          <div class="metric-icon-badge success">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        <div class="metric-number-row">
          <b class="number mono">{{ stats.todayAcceptedEvents.toLocaleString() }}</b>
          <span class="metric-unit">条上链</span>
        </div>
        <div class="metric-bottom">
          <span class="tag ok">事件流水 ➔</span>
          <span class="metric-trend">核验通过率 {{ stats.todaySuccessRate }}</span>
        </div>
      </div>
    </div>

    <!-- End-to-End Pipeline Walkthrough Banner -->
    <div class="pipeline-walkthrough-panel">
      <div class="pipeline-header">
        <div class="header-left">
          <span class="pulse-indicator"></span>
          <div>
            <h3 class="pipeline-title">全产业链可信协同与追溯贯通流水线</h3>
            <span class="pipeline-sub">覆盖中药材「种植 ➔ 加工 ➔ 赋码 ➔ 流通 ➔ 代煎 ➔ 存证」完整闭环，点击任意阶段直达作业与血缘穿透</span>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="primary" size="small" @click="openGuideModal">
            全流程演示指引
          </el-button>
        </div>
      </div>

      <div class="pipeline-steps">
        <div
          v-for="(step, idx) in pipelineSteps"
          :key="step.path"
          class="step-card"
          @click="router.push(step.path)"
        >
          <div class="step-card-top">
            <div class="step-badge-group">
              <span class="step-num">{{ String(idx + 1).padStart(2, '0') }}</span>
              <span class="step-icon">{{ step.icon }}</span>
            </div>
            <span class="step-tag mono">{{ step.object.split(' ')[0] }}</span>
            <span class="step-arrow-mark" v-if="idx < pipelineSteps.length - 1">➔</span>
          </div>
          <div class="step-name">{{ step.name }}</div>
          <div class="step-desc" :title="step.desc">{{ step.desc }}</div>
          <div class="step-footer">
            <span class="step-event-code mono">{{ step.event.split(' ')[0] }}</span>
            <span class="step-enter-btn">进入协同 ➔</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Grid: Todo Items + Recent Activity -->
    <div class="grid-two">
      <!-- Todo Items Section -->
      <div class="panel">
        <div class="panel-header">
          <h2>待我处理事项</h2>
          <el-button size="small" link type="primary" @click="router.push('/governance/cases')">
            查看全部
          </el-button>
        </div>
        <div class="panel-body">
          <div
            v-for="item in workItems"
            :key="item.id"
            class="todo-item"
          >
            <StatusTag :code="item.status" />
            <div class="todo-info">
              <strong>{{ item.title }}</strong>
              <small>{{ item.source }} · {{ item.occurredAt }}</small>
            </div>
            <el-button size="small" type="primary" link @click="router.push(item.route)">
              处理
            </el-button>
          </div>
        </div>
      </div>

      <!-- Recent Activity Section -->
      <div class="panel">
        <div class="panel-header">
          <h2>最近动态与日志</h2>
        </div>
        <div class="panel-body">
          <div class="activity-timeline">
            <div
              v-for="act in activityLogs"
              :key="act.id"
              class="timeline-node"
            >
              <div class="node-title">{{ act.title }}</div>
              <div class="node-detail">{{ act.detail }} · {{ act.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Scenario Navigation Grid -->
    <div class="quick-nav-section">
      <div class="section-header">
        <h3 class="section-title">全产业链业务协同快速入口</h3>
        <span class="section-sub">支持跨主体数据协同录入、赋码追溯与供应链交割</span>
      </div>
      <div class="quick-grid">
        <div class="quick-card" @click="router.push('/business/field')">
          <div class="quick-card-header">
            <span class="quick-icon">🌱</span>
            <span class="quick-tag">12个基地</span>
          </div>
          <strong>田间种植</strong>
          <span>种植建档、地块管理、农事作业与投入品</span>
          <div class="quick-card-footer">进入基地档案 ➔</div>
        </div>

        <div class="quick-card" @click="router.push('/business/process-quality')">
          <div class="quick-card-header">
            <span class="quick-icon">⚙️</span>
            <span class="quick-tag">4批在检</span>
          </div>
          <strong>初加工与质量</strong>
          <span>趁鲜切制、浸润烘干、LIMS检验报告</span>
          <div class="quick-card-footer">查看质检报告 ➔</div>
        </div>

        <div class="quick-card" @click="router.push('/business/coding')">
          <div class="quick-card-header">
            <span class="quick-icon">🏷️</span>
            <span class="quick-tag">32万码</span>
          </div>
          <strong>饮片赋码</strong>
          <span>国家16位医保码、药监追溯码、包装树</span>
          <div class="quick-card-footer">赋码包装管理 ➔</div>
        </div>

        <div class="quick-card" @click="router.push('/business/supply')">
          <div class="quick-card-header">
            <span class="quick-icon">📦</span>
            <span class="quick-tag">8笔交割</span>
          </div>
          <strong>供销交割</strong>
          <span>中心仓入库、出库流转、电子仓单质押</span>
          <div class="quick-card-footer">进入仓储流转 ➔</div>
        </div>

        <div class="quick-card" @click="router.push('/business/decoction')">
          <div class="quick-card-header">
            <span class="quick-icon">🍵</span>
            <span class="quick-tag">16张处方</span>
          </div>
          <strong>处方代煎</strong>
          <span>医院Token核验、智能煎药、配送核验</span>
          <div class="quick-card-footer">处方协同流转 ➔</div>
        </div>
      </div>
    </div>

    <!-- Walkthrough Guide Dialog -->
    <el-dialog v-model="guideModalVisible" title="云南中药材全产业链协同与可信追溯全流程演练指南" width="680px">
      <div class="guide-content">
        <p style="margin-bottom: 16px; color: #3f4e48; font-size: 13px;">
          本平台已完成从<strong>源头田间种植</strong>至<strong>终端处方代煎</strong>的完整数据链路贯通。您可以按照以下 6 个标准业务阶段顺序体验全链条协同与数据穿透：
        </p>

        <el-timeline>
          <el-timeline-item
            v-for="(step, idx) in pipelineSteps"
            :key="idx"
            type="primary"
            size="large"
          >
            <div class="guide-step-item">
              <div class="guide-step-header">
                <strong>阶段 {{ idx + 1 }}：{{ step.name }}</strong>
                <el-button size="small" type="primary" link @click="goToStep(step.path)">
                  立即进入此环节 ➔
                </el-button>
              </div>
              <p class="guide-step-desc">{{ step.desc }}</p>
              <div class="guide-step-tip">
                <span>关键业务对象：<code>{{ step.object }}</code></span>
                <span>核心事件：<code>{{ step.event }}</code></span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
      <template #footer>
        <el-button @click="guideModalVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToStep('/business/field')">从第 1 步田间种植开始体验</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useContextStore } from '@/stores/contextStore';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { workspaceApi, type WorkspaceStats } from '@/api/workspace';
import type { WorkItem, ActivityLog } from '@/types';

const router = useRouter();
const contextStore = useContextStore();

const loading = ref(false);
const guideModalVisible = ref(false);
const workItems = ref<WorkItem[]>([]);
const activityLogs = ref<ActivityLog[]>([]);
const stats = ref<WorkspaceStats>({
  pendingGovernanceCases: 12,
  processingIngestBatches: 4,
  pendingProofs: 3,
  todayAcceptedEvents: 1286,
  todaySuccessRate: '99.2%'
});

const pipelineSteps = [
  {
    name: '田间种植建档',
    icon: '🌱',
    desc: '录入三七种植基地地块、作物批次与播种、施肥农事记录',
    path: '/business/field',
    object: 'CROP_BATCH (BATCH-2026-SQ-01)',
    event: 'PLANTED / FARM_WORK'
  },
  {
    name: '初加工与质检',
    icon: '⚙️',
    desc: '以种植批次为原料趁鲜切制，挂接 LIMS 检验合格报告',
    path: '/business/process-quality',
    object: 'PROCESS_BATCH (PROC-SQ-2608-01)',
    event: 'PRIMARY_PROCESSED / QUALITY_INSPECTED'
  },
  {
    name: '饮片赋码包装',
    icon: '🏷️',
    desc: '绑定国家16位医保饮片编码与药监码，建立袋-盒-箱层级包装树',
    path: '/business/coding',
    object: 'HERB_PACKAGE (8691234567890100)',
    event: 'TRACE_CODE_ASSIGNED'
  },
  {
    name: '供销交割入库',
    icon: '📦',
    desc: '中心仓入库签收、出库交割流转与供应链仓单质押核验',
    path: '/business/supply',
    object: 'ORDER / STOCK (SO-2026-0808-01)',
    event: 'WAREHOUSED / DELIVERED'
  },
  {
    name: '医院处方代煎',
    icon: '🍵',
    desc: '接收医疗机构处方Token，饮片调剂调配，煎药打包配送',
    path: '/business/decoction',
    object: 'PRESCRIPTION (RX-202608-091)',
    event: 'PRESCRIPTION_RECEIVED / DECOCTED'
  },
  {
    name: '血缘图谱与存证',
    icon: '🔗',
    desc: '查看全链条完整因果DAG血缘拓扑、Merkle上链根哈希与证据链',
    path: '/trust/lineage',
    object: 'MERKLE_ROOT / PROOF (PF-202608-0912)',
    event: 'PROVED_ON_CHAIN'
  }
];

const openGuideModal = () => {
  guideModalVisible.value = true;
};

const goToStep = (path: string) => {
  guideModalVisible.value = false;
  router.push(path);
};

const loadData = async () => {
  loading.value = true;
  try {
    const [items, logs, statData] = await Promise.all([
      workspaceApi.getWorkItems(),
      workspaceApi.getActivityLogs(),
      workspaceApi.getStats()
    ]);
    workItems.value = items;
    activityLogs.value = logs;
    stats.value = statData;
  } catch (error) {
    console.error('Failed to load workspace data', error);
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  await loadData();
  ElMessage.success('工作台待处理事项已刷新！');
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.workspace-page {
  padding-bottom: 24px;
}

/* Metric Cards Grid */
.metric-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

@media (max-width: 1100px) {
  .metric-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 580px) {
  .metric-row {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(14, 95, 64, 0.04);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.metric-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3.5px;
}

.metric-card.metric-warn::before {
  background: #d97706;
}

.metric-card.metric-info::before {
  background: #2563eb;
}

.metric-card.metric-danger::before {
  background: #dc2626;
}

.metric-card.metric-success::before {
  background: var(--color-brand);
}

.metric-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(14, 95, 64, 0.08);
  border-color: var(--color-brand);
}

.metric-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-card-top .label {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 500;
}

.metric-icon-badge {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon-badge.warn {
  background: #fef3c7;
  color: #b45309;
}

.metric-icon-badge.info {
  background: #dbeafe;
  color: #1d4ed8;
}

.metric-icon-badge.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.metric-icon-badge.success {
  background: #d1fae5;
  color: #047857;
}

.metric-number-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 10px 0 6px;
}

.metric-card .number {
  font-size: 28px;
  line-height: 1.1;
  color: var(--color-ink);
  font-weight: 700;
}

.metric-unit {
  font-size: 12px;
  color: var(--color-muted);
}

.metric-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed var(--color-border-subtle);
  padding-top: 8px;
  margin-top: 4px;
}

.metric-card .tag {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
}

.metric-card .tag.warn {
  color: #b45309;
  background: #fef3c7;
}

.metric-card .tag.info {
  color: #1d4ed8;
  background: #dbeafe;
}

.metric-card .tag.bad {
  color: #b91c1c;
  background: #fee2e2;
}

.metric-card .tag.ok {
  color: #065f46;
  background: #d1fae5;
}

.metric-trend {
  font-size: 11px;
  color: var(--color-muted);
}

/* End-to-End Pipeline Banner */
.pipeline-walkthrough-panel {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(14, 95, 64, 0.04);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.pipeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 260px;
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-brand);
  box-shadow: 0 0 0 3px rgba(14, 95, 64, 0.2);
  flex-shrink: 0;
}

.pipeline-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
  line-height: 1.3;
}

.pipeline-sub {
  font-size: 12px;
  color: var(--color-muted);
  display: block;
  margin-top: 2px;
}

.pipeline-steps {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 1400px) {
  .pipeline-steps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .pipeline-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .pipeline-steps {
    grid-template-columns: 1fr;
  }
}

.step-card {
  display: flex;
  flex-direction: column;
  background: #f8faf9;
  border: 1px solid #e1eee7;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  box-sizing: border-box;
  position: relative;
}

.step-card:hover {
  background: #edf6f1;
  border-color: var(--color-brand);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 95, 64, 0.08);
}

.step-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  min-width: 0;
}

.step-badge-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.step-num {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-brand);
  background: rgba(14, 95, 64, 0.09);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: var(--font-mono);
}

.step-icon {
  font-size: 16px;
  line-height: 1;
}

.step-tag {
  font-size: 10px;
  color: var(--color-muted);
  background: #ffffff;
  border: 1px solid var(--color-border-subtle);
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.step-arrow-mark {
  color: #9ab4a7;
  font-size: 11px;
  margin-left: 2px;
}

.step-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.step-desc {
  font-size: 11.5px;
  color: var(--color-muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 33px;
  flex: 1;
}

.step-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--color-border-subtle);
  font-size: 11px;
}

.step-event-code {
  color: var(--color-muted);
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.step-enter-btn {
  color: var(--color-brand);
  font-weight: 600;
  white-space: nowrap;
}

/* Main Grid: Todo & Recent Activity */
.grid-two {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.8fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 1100px) {
  .grid-two {
    grid-template-columns: 1fr;
  }
}

.todo-item {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 11px 8px;
  border-bottom: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  transition: background 0.15s;
}

.todo-item:hover {
  background: #f8faf9;
}

.todo-item:last-child {
  border-bottom: 0;
}

.todo-info strong {
  display: block;
  font-size: 13px;
  color: var(--color-ink);
  font-weight: 600;
}

.todo-info small {
  color: var(--color-muted);
  font-size: 11.5px;
  margin-top: 2px;
  display: block;
}

.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-node {
  position: relative;
  padding-left: 16px;
  border-left: 2px solid #cfe0d7;
}

.timeline-node::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-brand);
}

.node-title {
  font-weight: 600;
  font-size: 12.5px;
  color: var(--color-ink);
}

.node-detail {
  font-size: 11.5px;
  color: var(--color-muted);
  margin-top: 2px;
}

/* Quick Scenario Navigation */
.quick-nav-section {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(14, 95, 64, 0.03);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
}

.section-sub {
  font-size: 12px;
  color: var(--color-muted);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1300px) {
  .quick-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
}

.quick-card {
  background: #fbfdfc;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.15s ease;
}

.quick-card:hover {
  border-color: var(--color-brand);
  background: #edf6f1;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(14, 95, 64, 0.08);
}

.quick-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.quick-icon {
  font-size: 20px;
}

.quick-tag {
  font-size: 10.5px;
  background: #eef5f1;
  color: var(--color-brand);
  border: 1px solid #d4e7dd;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
}

.quick-card strong {
  display: block;
  font-size: 13.5px;
  color: var(--color-ink);
  margin-bottom: 4px;
}

.quick-card span {
  font-size: 11.5px;
  color: var(--color-muted);
  line-height: 1.4;
  flex: 1;
}

.quick-card-footer {
  margin-top: 10px;
  font-size: 11.5px;
  color: var(--color-brand);
  font-weight: 600;
  display: flex;
  align-items: center;
}

.guide-step-item {
  padding-bottom: 8px;
}

.guide-step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.guide-step-desc {
  font-size: 13px;
  color: #4a5c53;
  margin: 4px 0 6px;
}

.guide-step-tip {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #6b7f75;
  background: #f5f9f6;
  padding: 6px 10px;
  border-radius: 4px;
}

.guide-step-tip code {
  color: var(--color-brand);
  font-weight: 600;
}
</style>
