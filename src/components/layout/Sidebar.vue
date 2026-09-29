<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-header-title">功能导航</span>
    </div>

    <el-menu
      :default-active="activePath"
      class="sidebar-menu"
      :router="true"
      unique-opened
    >
      <!-- 1. Workspace -->
      <el-menu-item index="/workspace">
        <el-icon><DataBoard /></el-icon>
        <span class="menu-name">{{ workspaceMenu.title }}</span>
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
      { title: '接入批次与原始记录', path: '/governance/batches', hasApi: true, apiPath: '/openapi/v1/batches, /openapi/v1/raw-records' },
      { title: '字段映射预检', path: '/governance/mappings', hasApi: true, apiPath: '/openapi/v1/mappings/test' },
      { title: '治理异常案卷', path: '/governance/cases', hasApi: false, apiPath: '' },
      { title: '数据元与值域', path: '/governance/standards', hasApi: false, apiPath: '' },
      { title: '事件 Schema 配置', path: '/governance/events', hasApi: true, apiPath: '/openapi/v1/event-fact/config' }
    ]
  },
  {
    title: '主数据中心',
    index: 'master-data',
    icon: OfficeBuilding,
    items: [
      { title: '主体', path: '/master-data/parties', hasApi: true, apiPath: '/openapi/v1/parties' },
      { title: '标识命名空间', path: '/master-data/identifier-namespaces', hasApi: true, apiPath: '/openapi/v1/identifiers/namespaces' },
      { title: '业务对象登记', path: '/master-data/objects', hasApi: true, apiPath: '/openapi/v1/business-objects' },
      { title: '标识绑定', path: '/master-data/identifier-bindings', hasApi: true, apiPath: '/openapi/v1/identifiers/resolve, /openapi/v1/identifiers/bindings' },
      { title: '监管编码主数据', path: '/master-data/code-schemes', hasApi: true, apiPath: '/openapi/v1/code-schemes' },
      { title: '饮片品种管理', path: '/master-data/decoction-pieces', hasApi: true, apiPath: '/openapi/v1/decoction-piece-products' }
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
      { title: '文件上传与凭证', path: '/trust/files-credentials', hasApi: true, apiPath: '/openapi/v1/files/upload-sessions, /openapi/v1/credentials' },
      { title: '存证单与 Merkle', path: '/trust/proofs', hasApi: false, apiPath: '' }
    ]
  },
  {
    title: '数据交换与物化',
    index: 'exchange',
    icon: Share,
    items: [
      { title: '互通规范包', path: '/exchange/profiles', hasApi: false, apiPath: '' },
      { title: '互通规范配置', path: '/exchange/profile-config', hasApi: true, apiPath: '/exchange-query/profile-versions' },
      { title: '交换数据查询', path: '/exchange/queries', hasApi: true, apiPath: '/exchange-query/objects, /exchange-query/events' },
      { title: '互通投影与交付', path: '/exchange/projections', hasApi: false, apiPath: '' }
    ]
  },
  {
    title: '平台配置与组织权限',
    index: 'platform',
    icon: Tools,
    items: [
      { title: '租户管理', path: '/settings/tenants', hasApi: true, apiPath: '/tenant-access/tenants' },
      { title: '角色与权限', path: '/settings/roles', hasApi: true, apiPath: '/tenant-access/roles, /permissions' },
      { title: '通用字典', path: '/settings/dictionaries', hasApi: true, apiPath: '/tenant-access/dictionaries' },
      { title: '用户管理', path: '/settings/users', hasApi: true, apiPath: '/tenant-access/users' },
      { title: '项目协同空间', path: '/settings/tenant-project', hasApi: true, apiPath: '/openapi/v1/project-spaces' },
      { title: '前置节点部署', path: '/settings/deployments-edge', hasApi: true, apiPath: '/openapi/v1/deployment-instances' },
      { title: '订阅与异步任务', path: '/operations/subscriptions-jobs', hasApi: false, apiPath: '' },
      { title: '审计与告警', path: '/operations/audit-alerts', hasApi: false, apiPath: '' }
    ]
  }
];
</script>

<style scoped>
.sidebar {
  width: 252px;
  flex-shrink: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfa 100%);
  border-right: 1px solid #d2e2de;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 13px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: transparent;
}
.sidebar-header-title { color: var(--color-muted); font-size: 10px; font-weight: 750; letter-spacing: 1px; text-transform: uppercase; }
.sidebar-menu { flex: 1; border-right: none; padding: 5px 0 12px; }
.menu-name, .group-title { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:deep(.el-menu) { background: transparent; border-right: 0; }
:deep(.el-sub-menu__title) { height: 46px; margin: 3px 10px 0; border-radius: 7px; color: #4a6662; font-size: 13px; font-weight: 700; line-height: 46px; }
:deep(.el-sub-menu__title:hover) { background: #eef7f5; color: var(--color-brand); }
:deep(.el-menu-item) { display: flex !important; align-items: center !important; height: 41px; margin: 1px 10px; padding-right: 14px !important; border-radius: 7px; color: #58716e; font-size: 13px; line-height: 41px; }
:deep(.el-menu-item:hover) { background: #eef7f5; color: var(--color-brand); }
:deep(.el-menu-item.is-active) { color: var(--color-brand) !important; font-weight: 700; background: linear-gradient(90deg, #e2f4f0, #eff9f7); border-right: 0; box-shadow: inset 3px 0 var(--color-brand), 0 2px 7px rgba(15, 118, 110, 0.08); }
:deep(.el-sub-menu .el-menu) { background: transparent; }
:deep(.el-menu-item .el-icon), :deep(.el-sub-menu__title .el-icon) { color: #79a19b; font-size: 17px; }
:deep(.el-menu-item.is-active .el-icon), :deep(.el-sub-menu.is-opened > .el-sub-menu__title .el-icon) { color: var(--color-brand); }
.sidebar-footer { flex-shrink: 0; padding: 16px 18px; border-top: 1px solid var(--color-border); background: rgba(239, 247, 245, 0.72); }
.footer-spec-title { margin-bottom: 8px; color: #58716d; font-size: 11px; font-weight: 700; letter-spacing: 0.2px; }
.spec-pills { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
.spec-pill { padding: 3px 6px; border: 1px solid #c5e1db; border-radius: 4px; background: #eaf6f3; color: #18776d; font-size: 9.5px; font-weight: 700; }
.footer-meta { color: #8da6a1; font-size: 10px; }
@media (max-width: 900px) { .sidebar { width: 220px; } }
</style>
