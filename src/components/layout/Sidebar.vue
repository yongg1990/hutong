<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-header-title">功能导航</span>
      <span class="sidebar-api-summary" title="所有已接入Swagger后端API的页面均已标注备注">
        <span class="pulse-dot"></span> 接口已通
      </span>
    </div>

    <el-menu
      :default-active="activePath"
      class="sidebar-menu"
      :router="true"
      background-color="#ffffff"
      text-color="#1a2420"
      active-text-color="#176b4d"
    >
      <!-- 1. Workspace -->
      <el-menu-item index="/workspace" :title="workspaceMenu.title + (workspaceMenu.hasApi ? ' (已对接接口: ' + workspaceMenu.apiPath + ')' : '')">
        <el-icon><DataBoard /></el-icon>
        <span class="menu-name">{{ workspaceMenu.title }}</span>
        <span v-if="workspaceMenu.hasApi" class="menu-api-badge" :title="'已对接接口: ' + workspaceMenu.apiPath">
          <span class="api-dot"></span>
          <span class="api-text">已对接</span>
        </span>
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
          :title="item.title + (item.hasApi ? ' (已对接接口: ' + item.apiPath + ')' : '')"
        >
          <span class="menu-name">{{ item.title }}</span>
          <span v-if="item.hasApi" class="menu-api-badge" :title="'已对接接口: ' + item.apiPath">
            <span class="api-dot"></span>
            <span class="api-text">已对接</span>
          </span>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>

    <!-- Sidebar Compliance & Spec Footer -->
    <div class="sidebar-footer">
      <div class="footer-spec-title">标准规范支撑</div>
      <div class="spec-pills">
        <span class="spec-pill">GB/T 31774</span>
        <span class="spec-pill">国家16位医保码</span>
      </div>
      <div class="footer-meta">Hyperledger & Merkle 存证引擎</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  DataBoard,
  Goods,
  Filter,
  OfficeBuilding,
  Connection,
  Share,
  Tools
} from '@element-plus/icons-vue';

const route = useRoute();
const activePath = computed(() => route.path);

const workspaceMenu = {
  title: '工作台',
  path: '/workspace',
  hasApi: false,
  apiPath: ''
};

const menuGroups = [
  {
    title: '业务协同场景',
    index: 'business',
    icon: Goods,
    items: [
      { title: '田间种植', path: '/business/field', hasApi: false, apiPath: '' },
      { title: '加工与质量', path: '/business/process-quality', hasApi: false, apiPath: '' },
      { title: '饮片赋码', path: '/business/coding', hasApi: true, apiPath: '/openapi/v1/trace-codes' },
      { title: '供销交割', path: '/business/supply', hasApi: false, apiPath: '' },
      { title: '处方代煎', path: '/business/decoction', hasApi: false, apiPath: '' },
      { title: '通用事件录入', path: '/business/events/new', hasApi: false, apiPath: '' }
    ]
  },
  {
    title: '接入与治理',
    index: 'governance',
    icon: Filter,
    items: [
      { title: '来源系统', path: '/governance/sources', hasApi: true, apiPath: '/openapi/v1/source-systems' },
      { title: '接入批次', path: '/governance/batches', hasApi: true, apiPath: '/openapi/v1/batches, /raw-records' },
      { title: '字段映射', path: '/governance/mappings', hasApi: true, apiPath: '/openapi/v1/mappings/test' },
      { title: '治理异常案卷', path: '/governance/cases', hasApi: false, apiPath: '' },
      { title: '数据元与值域', path: '/governance/standards', hasApi: false, apiPath: '' },
      { title: '事件 Schema 配置', path: '/governance/events', hasApi: false, apiPath: '' }
    ]
  },
  {
    title: '主数据中心',
    index: 'master-data',
    icon: OfficeBuilding,
    items: [
      { title: '主体机构', path: '/master-data/parties', hasApi: true, apiPath: '/openapi/v1/parties' },
      { title: '业务对象', path: '/master-data/objects', hasApi: true, apiPath: '/openapi/v1/business-objects' },
      { title: '饮片与监管编码', path: '/master-data/decoction-pieces', hasApi: true, apiPath: '/openapi/v1/decoction-piece-products' }
    ]
  },
  {
    title: '可信数据引擎',
    index: 'trust',
    icon: Connection,
    items: [
      { title: '事件查询', path: '/trust/events', hasApi: false, apiPath: '' },
      { title: '血缘分析图谱', path: '/trust/lineage', hasApi: false, apiPath: '' },
      { title: '证据文件', path: '/trust/evidence', hasApi: false, apiPath: '' },
      { title: '存证单与 Merkle', path: '/trust/proofs', hasApi: false, apiPath: '' }
    ]
  },
  {
    title: '数据交换与物化',
    index: 'exchange',
    icon: Share,
    items: [
      { title: '互通规范包', path: '/exchange/profiles', hasApi: false, apiPath: '' },
      { title: '互通投影与交付', path: '/exchange/projections', hasApi: false, apiPath: '' }
    ]
  },
  {
    title: '平台配置与组织权限',
    index: 'platform',
    icon: Tools,
    items: [
      { title: '租户管理', path: '/settings/tenants', hasApi: true, apiPath: '/tenant-access/tenants' },
      { title: '用户管理', path: '/settings/users', hasApi: true, apiPath: '/tenant-access/users' },
      { title: '角色与权限', path: '/settings/roles', hasApi: true, apiPath: '/tenant-access/roles, /permissions' },
      { title: '项目协同空间', path: '/settings/tenant-project', hasApi: true, apiPath: '/admin/v1/project-spaces' },
      { title: '前置节点部署', path: '/settings/deployments-edge', hasApi: true, apiPath: '/admin/v1/deployment-instances' },
      { title: '订阅与异步任务', path: '/operations/subscriptions-jobs', hasApi: false, apiPath: '' },
      { title: '审计与告警', path: '/operations/audit-alerts', hasApi: false, apiPath: '' }
    ]
  }
];
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  flex-shrink: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fbfdfc;
}

.sidebar-header-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-api-summary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #137333;
  background: #e6f4ea;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1e8e3e;
  box-shadow: 0 0 0 2px rgba(30, 142, 62, 0.2);
}

.sidebar-menu {
  border-right: none;
  flex: 1;
}

.menu-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-title {
  flex: 1;
}

.menu-api-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 10px;
  background-color: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  font-weight: 500;
  margin-left: 6px;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.menu-api-badge .api-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #10b981;
  flex-shrink: 0;
}

.menu-api-badge .api-text {
  font-size: 10px;
  letter-spacing: 0.2px;
}

:deep(.el-sub-menu__title) {
  font-weight: 600;
  font-size: 13px;
  height: 44px;
  line-height: 44px;
}

:deep(.el-menu-item) {
  font-size: 13px;
  height: 40px;
  line-height: 40px;
  display: flex !important;
  align-items: center !important;
  padding-right: 14px !important;
}

:deep(.el-menu-item:hover) .menu-api-badge {
  background-color: #d1fae5;
  border-color: #6ee7b7;
}

:deep(.el-menu-item.is-active) {
  background-color: var(--color-brand-soft);
  font-weight: 600;
  border-right: 3.5px solid var(--color-brand);
  color: var(--color-brand) !important;
}

:deep(.el-menu-item.is-active) .menu-api-badge {
  background-color: var(--color-brand);
  color: #ffffff;
  border-color: var(--color-brand);
}

:deep(.el-menu-item.is-active) .menu-api-badge .api-dot {
  background-color: #a7f3d0;
}

.sidebar-footer {
  padding: 12px 14px;
  border-top: 1px solid var(--color-border);
  background-color: #fbfdfc;
  flex-shrink: 0;
}

.footer-spec-title {
  font-size: 11px;
  font-weight: 600;
  color: #5c7267;
  margin-bottom: 6px;
  letter-spacing: 0.2px;
}

.spec-pills {
  display: flex;
  gap: 5px;
  margin-bottom: 6px;
}

.spec-pill {
  font-size: 9.5px;
  color: #14724e;
  background: #eef6f2;
  border: 1px solid #cce3d7;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
}

.footer-meta {
  font-size: 10px;
  color: #8da498;
}
</style>
