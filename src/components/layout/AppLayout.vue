<template>
  <div class="app-layout">
    <Navbar />
    <div class="app-body">
      <Sidebar />
      <main class="app-main">
        <el-select class="mobile-navigation" :model-value="$route.path" placeholder="页面导航" @change="$router.push($event)"><el-option v-for="item in mobilePages" :key="item.path" :label="item.title" :value="item.path" /></el-select>
        <div class="query-progress" :class="{ active: queryActivity.visible }" role="status" :aria-label="queryActivity.pending ? '正在查询数据' : '查询已完成'" :aria-hidden="!queryActivity.visible">
          <span class="query-progress-bar"></span>
          <span class="query-progress-label"><el-icon class="is-loading"><Loading /></el-icon> 正在查询数据</span>
        </div>
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <div :key="$route.fullPath" class="page-wrapper">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue';
import { queryActivity } from '@/api/client';
import Navbar from './Navbar.vue';
import Sidebar from './Sidebar.vue';
const mobilePages=[{path:'/workspace',title:'工作台'},{path:'/business/field',title:'田间种植'},{path:'/business/process-quality',title:'加工与质量'},{path:'/business/coding',title:'饮片赋码'},{path:'/business/supply',title:'供销交割'},{path:'/business/decoction',title:'处方代煎'},{path:'/trust/events',title:'事件查询'},{path:'/trust/lineage',title:'血缘分析图谱'},{path:'/trust/evidence',title:'证据文件'},{path:'/trust/proofs',title:'存证'},{path:'/exchange/projections',title:'互通投影'},{path:'/governance/cases',title:'治理案卷'},{path:'/operations/subscriptions-jobs',title:'订阅与任务'},{path:'/operations/audit-alerts',title:'审计与告警'}];
</script>

<style scoped>
.mobile-navigation { display:none; }
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: linear-gradient(135deg, #f3f7f6 0%, #f8fbfa 48%, #eef5f3 100%);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
  max-width: 100%;
  padding: 22px 26px 30px;
  background-color: var(--color-bg);
  position: relative;
  box-sizing: border-box;
}

.query-progress {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease;
}

.query-progress.active { opacity: 1; }
.query-progress-bar {
  position: absolute;
  top: -22px;
  left: -26px;
  width: calc(100% + 52px);
  height: 3px;
  overflow: hidden;
  background: #d6e9df;
}
.query-progress-bar::after {
  content: '';
  display: block;
  width: 35%;
  height: 100%;
  background: var(--color-brand);
  animation: query-sweep 1.15s ease-in-out infinite;
}
.query-progress-label {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border: 1px solid var(--color-brand-border);
  border-radius: 4px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  color: var(--color-brand-dark);
  font-size: 12px;
  font-weight: 650;
}
@keyframes query-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(300%); }
}
@media (prefers-reduced-motion: reduce) {
  .query-progress-bar::after { animation: none; width: 100%; }
}
@media (max-width: 800px) {
  .mobile-navigation { display:block; width:100%;margin-bottom:12px; }
  :deep(.sidebar) { display:none; }
  .app-main { padding:14px; }
  :deep(.navbar) { flex-wrap:wrap; height:auto; min-height:64px; padding:8px 12px; gap:8px; }
  :deep(.header-center), :deep(.header-actions .user-badge), :deep(.brand-text .sub) { display:none; }
  :deep(.brand), :deep(.header-actions) { min-width:0; max-width:100%; flex-wrap:wrap; }
  :deep(.brand-text .title) { font-size:13px; white-space:normal; }
  :deep(.grid-two), :deep(.grid-three), :deep(.form-layout-grid), :deep(.fields-grid) { grid-template-columns:minmax(0,1fr); }
  :deep(.fixed-submit-bar) { left:8px;right:8px;padding:8px;flex-wrap:wrap;gap:6px; }
  :deep(.submit-actions) { flex-wrap:wrap;gap:4px; }
  :deep(.anchor-nav-bar), :deep(.nav-links) { flex-wrap:wrap;gap:8px; }
  :deep(.indicator-grid-wrapper), :deep(.prescription-grid-wrapper) { overflow-x:auto; }
  :deep(.indicator-table), :deep(.item-table) { min-width:650px; }
  :deep(.stages-bar) { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .query-progress-bar { top: -14px; left: -14px; width: calc(100% + 28px); }
}

.page-wrapper {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

/* Page Transition: Slide in from right (Subtle) */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(15px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}
</style>
