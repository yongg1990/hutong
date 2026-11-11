<template>
  <div class="app-layout">
    <Navbar />
    <div class="app-body">
      <Sidebar :collapsed="sidebarCollapsed" />
      <div class="app-content">
      <header class="breadcrumb-bar">
        <el-tooltip :content="sidebarCollapsed ? '展开菜单' : '收起菜单'" placement="bottom">
          <el-button class="sidebar-toggle" text :icon="sidebarCollapsed ? Expand : Fold" :aria-label="sidebarCollapsed ? '展开菜单' : '收起菜单'" :aria-expanded="!sidebarCollapsed" aria-controls="main-sidebar" @click="sidebarCollapsed = !sidebarCollapsed" />
        </el-tooltip>
        <el-select class="mobile-navigation" :model-value="$route.path" placeholder="页面导航" @change="$router.push($event)"><el-option v-for="item in mobilePages" :key="item.path" :label="item.title" :value="item.path" /></el-select>
        <el-breadcrumb class="page-breadcrumb" separator="/" aria-label="面包屑导航">
          <el-breadcrumb-item :to="route.path === '/workspace' ? undefined : { path: '/workspace' }">工作台</el-breadcrumb-item>
          <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.title" :to="item.path ? { path: item.path } : undefined">{{ item.title }}</el-breadcrumb-item>
        </el-breadcrumb>
      </header>
      <main class="app-main">
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Expand, Fold } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import Navbar from './Navbar.vue';
import Sidebar from './Sidebar.vue';
import { menuGroups, mobilePages } from '@/config/navigation';
import { providePageOptions } from '@/composables/usePageOptions';

const route = useRoute();
const resetPageOptions = providePageOptions();
watch(() => route.fullPath, resetPageOptions, { flush: 'sync' });
const sidebarCollapsed = ref(false);
const breadcrumbs = computed(() => {
  if (route.path === '/workspace') return [];
  const match = menuGroups.flatMap(group => group.items.map(item => ({ group, item })))
    .filter(({ item }) => route.path === item.path || route.path.startsWith(`${item.path}/`))
    .sort((a, b) => b.item.path.length - a.item.path.length)[0];
  if (match) {
    const items: { title: string; path?: string }[] = [{ title: match.group.title }, { title: match.item.title }];
    if (route.name === 'TrustEventDetail') {
      items[1].path = match.item.path;
      items.push({ title: '事件详情' });
    }
    return items;
  }
  const extraPages: Record<string, { group?: string; title: string }> = {
    '/governance/standards': { group: '接入与治理', title: '数据元与值域标准' },
    '/governance/events': { group: 'APP-04 事件配置与事实引擎', title: '事件与 Schema 配置' },
    '/page-load-error': { title: '页面加载失败' }
  };
  const page = extraPages[route.path];
  return page ? [...(page.group ? [{ title: page.group }] : []), { title: page.title }] : [];
});
</script>

<style scoped>
.mobile-navigation { display:none; }
.app-content { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; overflow: hidden; }
.breadcrumb-bar { display: flex; align-items: center; gap: 12px; flex-shrink: 0; padding: 10px 26px; background: var(--color-surface); border-bottom: 1px solid var(--color-border); }
.sidebar-toggle { flex: 0 0 32px; width: 32px; height: 32px; min-height: 32px; padding: 0; font-size: 19px; color: var(--color-text-secondary); }
.page-breadcrumb { flex: 1; min-width: 0; }
.page-breadcrumb { margin: 0; line-height: 22px; }
.page-breadcrumb :deep(.el-breadcrumb__item) { float: none; display: inline; }
.page-breadcrumb :deep(.el-breadcrumb__inner) { overflow-wrap: anywhere; }
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--color-bg);
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
  min-height: 0;
  min-width: 0;
  max-width: 100%;
  padding: 26px 30px 36px;
  background-color: var(--color-bg);
  position: relative;
  box-sizing: border-box;
}

@media (max-width: 800px) {
  .breadcrumb-bar { display: block; padding: 12px 14px; }
  .sidebar-toggle { display: none; }
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
