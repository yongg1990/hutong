<template>
  <div class="app-container" :class="{ collapsed: isCollapsed }">
    <!-- Brand / Sidebar Header -->
    <div class="brand-bar">
      <div class="brand-title" v-if="!isCollapsed">
        <span>中药互通互认平台</span>
        <small>TCM INTEROPERABILITY</small>
      </div>
      <div class="brand-short" v-else>互认</div>
      <button class="collapse-toggle" @click="isCollapsed = !isCollapsed" title="折叠/展开侧栏">
        <el-icon><Fold v-if="!isCollapsed" /><Expand v-else /></el-icon>
      </button>
    </div>

    <!-- Topbar -->
    <header class="topbar">
      <div class="context-controls">
        <el-dropdown trigger="click" @command="handleTenantChange">
          <button class="ctx-btn">
            <span class="ctx-label">租户:</span>
            <strong>{{ contextStore.tenantName }}</strong>
            <el-icon><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="TENANT-YN-DEMO">云南示范项目</el-dropdown-item>
              <el-dropdown-item command="TENANT-SH-HU">上海互认示范项目</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown trigger="click" @command="handleProjectChange">
          <button class="ctx-btn">
            <span class="ctx-label">空间:</span>
            <strong>{{ contextStore.projectName }}</strong>
            <el-icon><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="PROJ-KM-PILOT">昆明试点空间</el-dropdown-item>
              <el-dropdown-item command="PROJ-WS-SANQI">文山三七专项空间</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <span class="cap-tag">独立部署节点</span>
      </div>

      <div class="topbar-actions">
        <!-- Floating Task Button -->
        <button class="task-badge-btn" @click="taskStore.toggleFloatingDrawer()">
          <el-icon><Operation /></el-icon>
          <span>后台任务</span>
          <span class="badge" v-if="activeJobCount > 0">{{ activeJobCount }}</span>
        </button>

        <span class="time-str">{{ currentTimeStr }}</span>

        <div class="user-avatar" :title="sessionStore.displayName">
          {{ sessionStore.displayName.slice(0, 1) }}
        </div>
      </div>
    </header>

    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="nav-scroll">
        <template v-for="group in navGroups" :key="group.title">
          <div class="nav-group-title" v-if="!isCollapsed">{{ group.title }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.route"
            :to="item.route"
            class="nav-item"
            :class="{ active: currentRoute.path === item.route || currentRoute.path.startsWith(item.route + '/') }"
            :title="item.name"
          >
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            <span class="nav-text" v-if="!isCollapsed">{{ item.name }}</span>
            <span class="badge-mini" v-if="item.badge">{{ item.badge }}</span>
          </router-link>
        </template>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Floating Task Drawer Component -->
    <FloatingTaskDrawer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/stores/sessionStore';
import { useContextStore } from '@/stores/contextStore';
import { useTaskStore } from '@/stores/taskStore';
import FloatingTaskDrawer from '@/components/common/FloatingTaskDrawer.vue';
import {
  Fold,
  Expand,
  ArrowDown,
  Operation,
  DataBoard,
  Place,
  BOX,
  Collection,
  House,
  DocumentChecked,
  EditPen,
  Setting,
  DataAnalysis,
  Connection,
  Warning,
  List,
  Files,
  OfficeBuilding,
  Grape,
  Reading,
  Search,
  Tickets,
  Share,
  Lock,
  Management,
  Promotion,
  Cpu,
  Histogram,
  UserFilled
} from '@element-plus/icons-vue';

const isCollapsed = ref(false);
const currentRoute = useRoute();
const sessionStore = useSessionStore();
const contextStore = useContextStore();
const taskStore = useTaskStore();

const activeJobCount = computed(() => {
  return taskStore.jobs.filter((j) => j.status === 'RUNNING').length;
});

const currentTimeStr = ref('');
let timer: any = null;

const updateTime = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  currentTimeStr.value = `${y}-${m}-${d} ${hh}:${mm}`;
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 10000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const handleTenantChange = (cmd: string) => {
  if (cmd === 'TENANT-YN-DEMO') {
    contextStore.setTenant('TENANT-YN-DEMO', '云南示范项目');
  } else {
    contextStore.setTenant('TENANT-SH-HU', '上海互认示范项目');
  }
};

const handleProjectChange = (cmd: string) => {
  if (cmd === 'PROJ-KM-PILOT') {
    contextStore.setProject('PROJ-KM-PILOT', '昆明试点空间');
  } else {
    contextStore.setProject('PROJ-WS-SANQI', '文山三七专项空间');
  }
};

const navGroups = [
  {
    title: '工作台',
    items: [{ name: '工作台', route: '/workspace', icon: DataBoard }]
  },
  {
    title: '业务协同',
    items: [
      { name: '田间种植工作台', route: '/business/field', icon: Place },
      { name: '加工与质量工作台', route: '/business/process-quality', icon: BOX },
      { name: '饮片赋码工作台', route: '/business/coding', icon: Collection },
      { name: '供销仓储交割', route: '/business/supply', icon: House },
      { name: '处方代煎配送', route: '/business/decoction', icon: DocumentChecked },
      { name: '事件录入', route: '/business/events/new', icon: EditPen }
    ]
  },
  {
    title: '接入治理',
    items: [
      { name: '来源系统', route: '/governance/sources', icon: Connection },
      { name: '接入批次', route: '/governance/batches', icon: List },
      { name: '映射工作台', route: '/governance/mappings', icon: DataAnalysis },
      { name: '治理异常', route: '/governance/cases', icon: Warning, badge: '12' },
      { name: '数据元与值域', route: '/governance/standards', icon: Reading },
      { name: '事件与Schema配置', route: '/governance/event-config', icon: Setting }
    ]
  },
  {
    title: '主数据',
    items: [
      { name: '主体机构', route: '/master-data/parties', icon: OfficeBuilding },
      { name: '业务对象', route: '/master-data/objects', icon: Grape },
      { name: '饮片与监管编码', route: '/master-data/decoction-pieces', icon: Tickets }
    ]
  },
  {
    title: '可信查询',
    items: [
      { name: '事件查询', route: '/trust/events', icon: Search },
      { name: '血缘查询', route: '/trust/lineage', icon: Share },
      { name: '证据与文件', route: '/trust/evidence', icon: Files },
      { name: '存证与验真', route: '/trust/proofs', icon: Lock }
    ]
  },
  {
    title: '互通输出',
    items: [
      { name: '互通规范包', route: '/exchange/profiles', icon: Management },
      { name: '互通投影与交付', route: '/exchange/projections', icon: Promotion }
    ]
  },
  {
    title: '运行管理',
    items: [
      { name: '租户项目与服务账号', route: '/settings/tenant-project', icon: UserFilled },
      { name: '部署与前置节点', route: '/settings/deployments-edge', icon: Cpu },
      { name: '订阅与异步任务', route: '/operations/subscriptions-jobs', icon: Operation },
      { name: '审计与告警', route: '/operations/audit-alerts', icon: Histogram }
    ]
  }
];
</script>

<style scoped>
.app-container {
  display: grid;
  grid-template-columns: 216px 1fr;
  grid-template-rows: 56px 1fr;
  height: 100vh;
  min-width: 1024px;
  background-color: var(--color-canvas);
}

.app-container.collapsed {
  grid-template-columns: 64px 1fr;
}

.brand-bar {
  grid-row: 1;
  grid-column: 1;
  background-color: var(--color-sidebar);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid #2e3d36;
}

.brand-title {
  font-weight: 700;
  font-size: 15px;
}

.brand-title small {
  display: block;
  font-size: 9px;
  font-weight: 400;
  color: #a2b5ab;
  margin-top: 1px;
}

.brand-short {
  font-weight: 700;
  font-size: 16px;
  color: #e7f1ec;
}

.collapse-toggle {
  background: transparent;
  border: 0;
  color: #a2b5ab;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
}

.collapse-toggle:hover {
  color: #fff;
  background-color: #293830;
}

.topbar {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.context-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ctx-btn {
  height: 32px;
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--color-ink);
}

.ctx-btn:hover {
  border-color: var(--color-brand);
}

.ctx-label {
  color: var(--color-muted);
  font-weight: 400;
}

.cap-tag {
  font-size: 11px;
  background-color: #e7f2f7;
  color: var(--color-info);
  padding: 2px 8px;
  border-radius: 3px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.task-badge-btn {
  height: 32px;
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: 4px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-ink);
  position: relative;
}

.task-badge-btn:hover {
  background-color: #f7f9f8;
}

.task-badge-btn .badge {
  background-color: var(--color-danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 10px;
  padding: 0 6px;
  height: 16px;
  line-height: 16px;
}

.time-str {
  color: var(--color-muted);
  font-size: 13px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-brand-soft);
  color: var(--color-brand);
  font-weight: 700;
  display: grid;
  place-items: center;
  font-size: 14px;
}

.sidebar {
  grid-row: 2;
  grid-column: 1;
  background-color: var(--color-sidebar);
  color: #d6e0db;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.nav-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 10px 8px;
}

.nav-group-title {
  font-size: 11px;
  color: #8fa39a;
  padding: 14px 10px 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  color: #d6e0db;
  text-decoration: none;
  border-radius: 4px;
  margin: 2px 0;
  font-size: 13px;
  transition: background 0.15s;
  position: relative;
}

.nav-item:hover {
  background-color: #283730;
  color: #fff;
}

.nav-item.active {
  background-color: var(--color-brand-soft);
  color: var(--color-brand);
  font-weight: 700;
}

.nav-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.badge-mini {
  margin-left: auto;
  background-color: var(--color-warn);
  color: #fff;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.main-content {
  grid-column: 2;
  grid-row: 2;
  overflow-y: auto;
  padding: 20px;
}
</style>
