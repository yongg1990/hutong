<template>
  <aside id="main-sidebar" class="sidebar" :class="{ 'is-collapsed': collapsed }">
    <el-menu
      :default-active="activePath"
      class="sidebar-menu"
      :collapse="collapsed"
      :collapse-transition="true"
      :router="true"
      unique-opened
    >
      <!-- 1. Workspace -->
      <el-menu-item index="/workspace">
        <el-icon><DataBoard /></el-icon>
        <template #title><span class="menu-name">{{ workspaceMenu.title }}</span></template>
      </el-menu-item>

      <!-- 2. Menu Groups -->
      <el-sub-menu v-for="group in menuGroups" :key="group.index" :index="group.index">
        <template #title>
          <el-icon><component :is="group.icon" /></el-icon>
          <span class="group-title">{{ group.title }}</span>
        </template>
        <el-menu-item
          v-for="item in group.items"
          :key="item.path"
          :index="item.path"
        >
          <span class="menu-name">{{ item.title }}</span>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>

    <!-- Sidebar Compliance & Spec Footer -->
    <Transition name="sidebar-footer">
    <div v-show="!collapsed" class="sidebar-footer">
      <div class="footer-spec-title">标准规范支撑</div>
      <div class="spec-pills">
        <span class="spec-pill">GB/T 31774</span>
        <span class="spec-pill">国家16位医保码</span>
      </div>
      <div class="footer-meta">Hyperledger & Merkle 存证引擎</div>
    </div>
    </Transition>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { DataBoard } from '@element-plus/icons-vue';
import { menuGroups } from '@/config/navigation';
defineProps<{ collapsed: boolean }>();
const route = useRoute();
const activePath = computed(() => route.path);
const workspaceMenu = { title: '工作台' };
</script>

<style scoped>
.sidebar {
  width: 252px;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 300ms ease-in-out;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}
.sidebar-menu { flex: 1; width: 100%; border-right: none; padding: 5px 0 12px; }
.sidebar-menu { --menu-text: var(--color-text-secondary); --menu-highlight: var(--color-brand); --menu-icon: #98a2b3; --menu-hover: var(--color-brand-soft); }
.sidebar.is-collapsed { width: 64px; }
.sidebar.is-collapsed .sidebar-menu { width: 100%; }
.sidebar.is-collapsed :deep(.el-sub-menu__title .group-title), .sidebar.is-collapsed :deep(.el-sub-menu__title .el-sub-menu__icon-arrow) { display: none; }
.sidebar.is-collapsed :deep(.el-menu-item), .sidebar.is-collapsed :deep(.el-sub-menu__title) { margin-left: 6px; margin-right: 6px; padding: 0 !important; justify-content: center; }
.sidebar.is-collapsed :deep(.el-menu-item .el-icon), .sidebar.is-collapsed :deep(.el-sub-menu__title .el-icon) { margin-right: 0; }
.menu-name, .group-title { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:deep(.el-menu) { background: transparent; border-right: 0; }
:deep(.el-sub-menu__title) { height: 46px; margin: 3px 10px 0; border-radius: 7px; color: var(--menu-text); font-size: 13px; font-weight: 400; line-height: 46px; }
:deep(.el-sub-menu__title:hover) { background: var(--menu-hover); color: var(--menu-highlight); }
:deep(.el-menu-item) { display: flex !important; align-items: center !important; height: 41px; margin: 1px 10px; padding-right: 14px !important; border-radius: 7px; color: var(--menu-text); font-size: 13px; font-weight: 400; line-height: 41px; }
:deep(.el-menu-item:hover) { background: var(--menu-hover); color: var(--menu-highlight); }
:deep(.el-menu-item.is-active) { color: var(--menu-highlight) !important; font-weight: 700; background: transparent; border-right: 0; box-shadow: none; }
:deep(.el-sub-menu.is-active > .el-sub-menu__title) { color: var(--menu-highlight); font-weight: 700; }
:deep(.el-sub-menu .el-menu) { background: transparent; }
:deep(.el-menu-item .el-icon), :deep(.el-sub-menu__title .el-icon) { color: var(--menu-icon); font-size: 17px; }
:deep(.el-menu-item.is-active .el-icon), :deep(.el-sub-menu.is-active > .el-sub-menu__title .el-icon) { color: var(--menu-highlight); }
.sidebar-footer { flex-shrink: 0; padding: 16px 18px; border-top: 1px solid var(--color-border-subtle); background: var(--color-surface-subtle); }
.sidebar-footer-enter-active { transition: opacity 180ms ease 120ms; }
.sidebar-footer-leave-active { transition: opacity 120ms ease; }
.sidebar-footer-enter-from, .sidebar-footer-leave-to { opacity: 0; }
.footer-spec-title { margin-bottom: 8px; color: var(--color-text-secondary); font-size: 11px; font-weight: 700; letter-spacing: 0; }
.spec-pills { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
.spec-pill { padding: 3px 6px; border: 1px solid var(--color-brand-border); border-radius: 4px; background: var(--color-brand-soft); color: var(--color-brand); font-size: 9.5px; font-weight: 700; }
.footer-meta { color: var(--color-muted); font-size: 10px; }
@media (max-width: 900px) { .sidebar { width: 220px; } }
@media (prefers-reduced-motion: reduce) {
  .sidebar, .sidebar-footer-enter-active, .sidebar-footer-leave-active { transition: none; }
}
</style>
