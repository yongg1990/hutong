# 云南省中药材全产业链追溯与治理协同平台 · 项目交接文档 (HANDOVER)

> **文档版本**：v1.0.0  
> **交接日期**：2026-09-11  
> **平台名称**：云南省中药材全产业链追溯与治理协同平台（中药互通互认平台）  
> **开发团队**：前端工程与架构研发组  
> **适用对象**：接手开发人员、测试人员、运维人员、项目经理

---

## 目录
1. [项目概况与背景](#1-项目概况与背景)
2. [技术栈与核心依赖](#2-技术栈与核心依赖)
3. [系统架构与目录结构](#3-系统架构与目录结构)
4. [核心业务模块与路由清单](#4-核心业务模块与路由清单)
5. [接口联调与通信鉴权规范](#5-接口联调与通信鉴权规范)
6. [关键技术实现与避坑指南](#6-关键技术实现与避坑指南)
7. [本地开发与部署指南](#7-本地开发与部署指南)
8. [状态管理与本地持久化](#8-状态管理与本地持久化)
9. [后续演进建议与已知待办](#9-后续演进建议与已知待办)

---

## 1. 项目概况与背景

### 1.1 业务背景
中药材种植、加工、流通、处方代煎环节跨主体协同复杂，传统的孤岛式管理导致供应链断链、真伪难验、质量数据无法跨机构互通互认。  
本项目为**云南省中药材全产业链追溯与治理协同平台（中药互通互认平台）**前端控制台系统，对标国家及云南省级中药材追溯监管与互通互认标准（如 GB/T 31774），实现从中药材**源头田间种植 ➔ 产地趁鲜初加工 ➔ 检验检测 ➔ 饮片赋码包装（国家16位医保码/药监追溯码） ➔ 供销中心仓交割 ➔ 医疗机构处方代煎**的全链路可信存证、因果因缘拓扑穿透与跨域互认输出。

### 1.2 核心业务指标支撑
- **全链路溯源**：支持批次、作物、事件编号、追溯码、医保编码多维反查；
- **数据治理与接入**：多源异构数据清洗映射、异常案卷督办闭环；
- **区块链可信存证**：存证交易哈希核验、Merkle 路径校验、补偿单重试通道；
- **多租户与多项目空间**：原生支持联盟企业、医疗机构、监管机构多主体数据隔离与权限协同。

---

## 2. 技术栈与核心依赖

| 维度 | 技术选型 | 版本 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **基础框架** | Vue 3 (Composition API, `<script setup>`) | `^3.5.41` | 前端核心响应式框架 |
| **构建工具** | Vite | `^6.2.3` | 高性能模块构建与开发服务器 |
| **开发语言** | TypeScript | `~5.8.2` | 静态强类型支持 |
| **UI 组件库** | Element Plus | `^2.14.4` | 企业级后台管理界面标准组件库 |
| **样式方案** | Tailwind CSS + 原生 CSS 变量 | `^4.1.14` | 原子化工具类与主题色彩体系（草本墨绿深浅搭配） |
| **路由管理** | Vue Router | `^5.2.0` | 前端单页路由，支持动静态结合加载 |
| **状态管理** | Pinia | `^4.0.3` | 用户会话、多租户上下文、全局任务状态 |
| **数据可视化**| ECharts | `^6.1.0` | 统计图表、趋势分析与监控面板 |
| **网络请求** | Axios | `^1.20.0` | HTTP 接口通信，封装多租户请求头与 Fallback |
| **图标库** | `@element-plus/icons-vue` | `^2.3.2` | 系统菜单与业务按钮内置矢量图标 |

---

## 3. 系统架构与目录结构

```text
├── index.html                   # 应用主入口 HTML
├── vite.config.ts               # Vite 构建及开发代理配置
├── package.json                 # 依赖包与启动脚本
├── tsconfig.json                # TypeScript 编译配置
├── metadata.json                # 平台基础元数据定义
├── .env.example                 # 环境变量模板
├── HANDOVER.md                  # 【本文档】项目交接文档
└── src/
    ├── main.ts                  # Vue 应用初始化入口（挂载 ElementPlus, Pinia, Router）
    ├── App.vue                  # 顶层根组件
    ├── index.css / style.css    # 全局样式与 Tailwind 入口
    ├── env.d.ts                 # 全局环境变量类型声明
    │
    ├── api/                     # 接口通信与业务 API 封装层
    │   ├── client.ts            # Axios 客户端实例、拦截器、Fallback 与联调诊断
    │   ├── auth.ts              # 身份登录鉴权（/tenant-access/auth/login）
    │   ├── rbac.ts              # 用户、角色、权限矩阵数据与服务
    │   ├── field.ts             # 田间种植、农事作业接口
    │   ├── processQuality.ts    # 初加工、检验检测接口
    │   ├── coding.ts            # 赋码包装管理接口
    │   ├── supply.ts            # 供销仓储与交割接口
    │   ├── decoction.ts         # 处方代煎业务接口
    │   ├── governance.ts        # 接入治理、数据源、案卷接口
    │   ├── masterData.ts        # 主体名录、对象品规接口
    │   ├── trust.ts             # 可信存证、事件流水、因果血缘接口
    │   ├── exchange.ts          # 互通互认档案与数据投影接口
    │   ├── settings.ts          # 租户设置、边缘节点接口
    │   ├── workspace.ts         # 工作台统计指标与待办接口
    │   └── mockData.ts          # 离线与演示基准保底数据
    │
    ├── components/              # 公共及业务子组件
    │   ├── layout/              # 骨架布局组件
    │   │   ├── AppLayout.vue    # 主布局容器（包含侧边栏与顶部导航）
    │   │   ├── Navbar.vue       # 顶部导航栏（平台标题、项目空间切换、用户信息）
    │   │   └── Sidebar.vue      # 侧边导航菜单（带图标、角色权限及路由映射）
    │   ├── common/              # 常用通用业务组件
    │   │   ├── PageHeader.vue   # 页面级标题与操作栏
    │   │   ├── StatusTag.vue    # 业务状态标准化徽标
    │   │   ├── FilterBar.vue    # 统一查询筛选工具条
    │   │   └── DataTable.vue    # 表格封装组件
    │   └── specialized/         # 专业可视化与特有组件
    │       └── GraphvizLineageCanvas.vue # DAG 全链因果因缘图谱 SVG 画布组件
    │
    ├── pages/                   # 业务页面目录
    │   ├── auth/                # 登录页面 (Login.vue)
    │   ├── workspace/           # 工作台主页 (Workspace.vue)
    │   ├── business/            # 5大业务协同工作台
    │   │   ├── FieldWorkbench.vue          # 田间种植协同
    │   │   ├── ProcessQualityWorkbench.vue # 初加工与质检协同
    │   │   ├── CodingWorkbench.vue         # 赋码包装管理
    │   │   ├── SupplyWorkbench.vue         # 供销交割协同
    │   │   ├── DecoctionWorkbench.vue      # 处方代煎协同
    │   │   └── EventEntry.vue              # 业务事件快速录入
    │   ├── governance/          # 接入治理
    │   │   ├── Sources.vue      # 数据源接入配置
    │   │   ├── Batches.vue      # 接入批次监控
    │   │   ├── Mappings.vue     # 字段映射配置
    │   │   ├── Cases.vue        # 异常治理案卷与督办
    │   │   ├── Standards.vue    # 数据标准规范
    │   │   └── EventConfig.vue  # 事件类型与校验规则配置
    │   ├── masterdata/          # 主数据管理
    │   │   ├── Parties.vue      # 参与主体名录
    │   │   ├── Objects.vue      # 追溯对象定义
    │   │   └── DecoctionPieces.vue # 饮片标准库与品规
    │   ├── trust/               # 可信数据引擎
    │   │   ├── EventsQuery.vue  # 可信事件查询
    │   │   ├── EventDetail.vue  # 事件详情与存证核验
    │   │   ├── LineageQuery.vue # 全链因果因缘图谱分析
    │   │   ├── Evidence.vue     # 原始凭证包检索
    │   │   └── Proofs.vue       # 区块链存证单与重试补偿
    │   ├── exchange/            # 互通互认输出
    │   │   ├── Profiles.vue     # 跨系统互通档案
    │   │   └── Projections.vue  # 跨域数据投影与共享
    │   ├── settings/            # 系统设置
    │   │   ├── TenantProject.vue   # 租户与项目空间管理
    │   │   ├── Tenants.vue         # 租户名录与配额
    │   │   ├── Users.vue           # 用户账号管理
    │   │   ├── Roles.vue           # 角色与权限矩阵配置
    │   │   └── DeploymentsEdge.vue # 边缘网关节点监控
    │   └── operations/          # 运维监控
    │       ├── SubscriptionsJobs.vue # 数据订阅与定时任务
    │       └── AuditAlerts.vue       # 安全审计与风险告警
    │
    ├── router/
    │   └── index.ts             # 路由注册、守卫及加载容错机制
    ├── stores/                  # Pinia 状态仓库
    │   ├── authStore.ts         # 用户身份与登录会话
    │   ├── contextStore.ts      # 当前选中的租户、项目空间上下文
    │   └── sessionStore.ts      # 界面交互状态缓存
    └── types/                   # 全局 TypeScript 接口模型定义
```

---

## 4. 核心业务模块与路由清单

系统采用清晰的模块分层设计，全部路由配置在 `src/router/index.ts`：

| 模块 | 路由路径 (`path`) | 页面组件 | 功能说明 |
| :--- | :--- | :--- | :--- |
| **认证** | `/login` | `Login.vue` | 账号密码认证、租户识别、演示账号一键登录 |
| **工作台** | `/workspace` | `Workspace.vue` | 核心指标概览、全产业链穿透流水线、待我处理事项、协同动态 |
| **业务协同** | `/business/field` | `FieldWorkbench.vue` | 地块管理、种植农事作业登记、投入品台账 |
| | `/business/process-quality` | `ProcessQualityWorkbench.vue` | 趁鲜初加工切片、烘干、检验批次与 LIMS 报告 |
| | `/business/coding` | `CodingWorkbench.vue` | 16位国家医保编码/药监码生成、赋码包装层级关联 |
| | `/business/supply` | `SupplyWorkbench.vue` | 仓储出入库、冷链温湿度、电子仓单交割质押 |
| | `/business/decoction` | `DecoctionWorkbench.vue` | 处方 Token 核验、智能代煎工艺记录、顺丰冷链配送核验 |
| | `/business/events/new/:eventType?` | `EventEntry.vue` | 跨环节标准化事件录入（采收、质检、赋码、出库等） |
| **接入治理** | `/governance/sources` | `Sources.vue` | 异构系统 (ERP/MES/LIMS/HIS) 接入数据源配置 |
| | `/governance/batches` | `Batches.vue` | 数据接入批次监控、解析吞吐率、错误报文追踪 |
| | `/governance/mappings` | `Mappings.vue` | 源字段与平台标准数据字典映射规则 |
| | `/governance/cases` | `Cases.vue` | 质检超标、断链、溯源失败等异常案卷与督办流转 |
| | `/governance/standards` | `Standards.vue` | 中药材行业数据标准、编码体系规范 |
| | `/governance/events` | `EventConfig.vue` | 标准事件模型定义、校验断言规则配置 |
| **主数据** | `/master-data/parties` | `Parties.vue` | 合作社、加工厂、饮片厂、药检所、医院主体档案 |
| | `/master-data/objects` | `Objects.vue` | 批次、包装箱、托盘、处方袋等实体定义 |
| | `/master-data/decoction-pieces`| `DecoctionPieces.vue` | 云南道地药材饮片标准库（三七、天麻、重楼等） |
| **可信存证** | `/trust/events` | `EventsQuery.vue` | 全链可信事件流水多维检索 |
| | `/trust/events/:eventId` | `EventDetail.vue` | 事件详情穿透、区块链 Merkle 证明、原证据摘要 |
| | `/trust/lineage` | `LineageQuery.vue` | **DAG 全链路因果图谱**、节点穿透与合规断链预警 |
| | `/trust/evidence` | `Evidence.vue` | 质检报告、采购合同、农事记录原始存证包检索 |
| | `/trust/proofs` | `Proofs.vue` | 区块链上链交易核验、待重试补偿队列管理 |
| **互通输出** | `/exchange/profiles` | `Profiles.vue` | 省级/国家互通互认接口输出规范档案 |
| | `/exchange/projections` | `Projections.vue` | 数据脱敏脱密、对外共享数据投影规则配置 |
| **系统设置** | `/settings/tenant-project` | `TenantProject.vue` | 当前空间切换、成员协同关系维护 |
| | `/settings/tenants` | `Tenants.vue` | 平台租户创建、企业信用代码、配额管理 |
| | `/settings/users` | `Users.vue` | 平台操作员账号、启用/禁用、重置密码 |
| | `/settings/roles` | `Roles.vue` | 角色与功能权限/数据权限矩阵配置 |
| | `/settings/deployments-edge` | `DeploymentsEdge.vue` | 部署在种植基地/饮片车间的边缘节点网关监控 |
| **运维审计** | `/operations/subscriptions-jobs`| `SubscriptionsJobs.vue` | 外部系统数据订阅、定时抓取同步任务 |
| | `/operations/audit-alerts` | `AuditAlerts.vue` | 安全操作审计日志、篡改预警、合规告警 |

---

## 5. 接口联调与通信鉴权规范

### 5.1 后端接口与 Swagger 路径
- **Swagger 接口文档地址**：`http://192.168.1.39:8900/api/tcmirp/swagger-ui/index.html#/`
- **默认基础路径**：`/api/tcmirp`（通过 `vite.config.ts` 反向代理至实际开发服务）
- **环境变量控制**：可通过 `.env` 中的 `VITE_API_BASE_URL` 或 `VITE_BACKEND_TARGET` 动态修改后端目标 IP/域名。

### 5.2 鉴权凭证协议（重点）
后端 Swagger 接口明确约定：**所有受保护接口均在请求头附带令牌，其名称为 `weappauthorization`，其取值为登录接口返回的 `data.token`**。

#### (1) 登录接口
- **端点**：`POST /tenant-access/auth/login`
- **请求体**：
  ```json
  {
    "username": "admin",
    "password": "******"
  }
  ```
- **响应体示例**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "USER-1001",
        "username": "admin",
        "realName": "系统管理员",
        "tenantId": "TENANT-YN-DEMO"
      }
    }
  }
  ```
- **登录后处理**：
  前端将 `data.token` 存入 `localStorage.setItem('weappauthorization', token)`。

#### (2) 请求拦截器 Header 自动装配
位于 `src/api/client.ts`，每次发起 HTTP 请求时，自动注入以下标准化头信息：
```typescript
// 1. 业务鉴权头（兼容大小写与标准 Bearer）
config.headers.set('weappauthorization', token);
config.headers.set('WeAppAuthorization', token);
config.headers.set('Authorization', `Bearer ${token}`);

// 2. 多租户与业务上下文头
config.headers.set('X-Tenant-Id', tenantId);    // 如: TENANT-YN-DEMO
config.headers.set('X-Project-Id', projectId);  // 如: PRJ-YN-TCM-2026
config.headers.set('X-Request-Id', `REQ-${Date.now()}-${random}`);
```

#### (3) 离线/内网高可用 Fallback 机制 (`apiCall`)
为了在无内网直连（如云端预览、外部演示、专网隔离）时不影响界面操作，`src/api/client.ts` 封装了 `apiCall<T>(promise, fallbackData)` 方法：
- 若后端服务正常，优先使用真实返回数据；
- 若网络超时或服务离线（排除 401 鉴权过期），会自动回退至内置的标准 Mock 基准数据，并在控制台给出友好提示，保障平台始终可演示、可交付。
- 若接收到后端 `401 / 403`，则会主动清除已失效凭证并安全引导至 `/login` 页面。

---

## 6. 关键技术实现与避坑指南

### 6.1 【重要规避】绝不要在请求拦截器中拦截缺失的 Token
- **踩坑记录**：若在 Axios 请求拦截器中写 `if (!token) return Promise.reject(...)`，会导致**登录请求自身因为尚未拥有 Token 而被直接拒绝**，形成死锁。
- **现行规范**：登录接口及无 Token 状态下正常发送请求；拦截器只在 `token` 存在时负责将其附带到请求头，不做任何前置阻断。

### 6.2 【重要规避】SVG 图谱节点悬停抖动（Jitter Loop）
- **踩坑记录**：在 `GraphvizLineageCanvas.vue` 中，曾对 SVG 的 `<g class="graph-node">` 使用了 CSS `transform: translateY(-2px)` 动效。由于修改了 SVG 元素几何坐标，光标在卡片边缘会频繁触发 `mouseenter` 与 `mouseleave` 的快速交替振荡（高频抖动）。
- **现行规范**：
  - SVG 内元素**严禁使用改变坐标的 `translateY` 悬停动效**；
  - 统一使用 `<filter id="card-shadow-hover">` 微阴影加深滤镜结合边框高亮（`stroke-width: 2.2px`）实现平滑、稳定、不抖动的悬停反馈。

### 6.3 路由异步分包异常自愈
- **机制说明**：在 `src/router/index.ts` 中配置了 `router.onError`，当网络波动或热重载导致动态 chunk 404 时，基于 `sessionStorage` 的单次标记进行平滑恢复，避免页面无限重载死循环。
- **高频入口**：`Login.vue` 与 `Workspace.vue` 采用了静态直接加载，确保入口页面绝对秒开且无异步拉取失败风险。

---

## 7. 本地开发与部署指南

### 7.1 环境要求
- **Node.js**：`>= 18.0.0`（推荐 Node 20 LTS）
- **包管理器**：`npm` / `pnpm` / `bun`

### 7.2 常用命令
```bash
# 1. 安装项目依赖
npm install

# 2. 启动本地开发服务 (绑定 0.0.0.0:3000)
npm run dev

# 3. 运行 TypeScript 语法检查
npm run lint

# 4. 执行生产环境打包构建
npm run build

# 5. 本地预览打包产物
npm run preview
```

### 7.3 构建产物
执行 `npm run build` 后，生成的纯静态 SPA 资源位于项目根目录下的 `dist/` 文件夹。  
生产环境由 Nginx 或任何标准静态 Web 服务器（如 Cloud Run, Docker Nginx 容器）托管，将所有路径回退至 `dist/index.html` 即可。

---

## 8. 状态管理与本地持久化

系统主要状态持久化于 `localStorage`，键名命名统一前缀：

| Key 键名 | 存储内容 | 使用场景 |
| :--- | :--- | :--- |
| `weappauthorization` | 登录返回的 JWT Token 凭证 | 后端全量接口鉴权头 |
| `tcmirp_token` | 兼容备份 Token 字符串 | 辅助鉴权 |
| `tcmirp_user` | 用户信息 JSON（姓名、角色、权限） | 个人中心、侧边栏展示 |
| `tcmirp_tenant_id` | 当前选中的租户标识符 | `X-Tenant-Id` 请求头注入 |
| `tcmirp_tenant_name`| 当前租户中文名称 | 顶部导航及各类凭证显示 |
| `tcmirp_project_id` | 当前项目空间编号 | `X-Project-Id` 请求头注入 |
| `tcmirp_api_base` | 自定义接口基础路径（可选） | 联调时动态切换服务地址 |

---

## 9. 后续演进建议与已知待办

1. **真实区块链 RPC 直连对接**：目前存证上链部分采用后端代理验证，后续若开放前置链节点，可在 `src/api/trust.ts` 中直接接入联盟链 JSON-RPC 验签。
2. **WebSocket 实时告警推送**：针对质量异常案卷和上链失败补偿单，可在 `AppLayout.vue` 中挂载全局 WebSocket 长连接，实现右下角实时消息弹窗通知。
3. **数据大屏与 GIS 产地分布**：可在工作台进一步集成云南省各州市中药材示范基地（文山三七、昭通天麻、丽江当归等）的二维/三维地理大屏。

---
*本交接文档由工程团队整理，如有任何系统架构或接口联调疑问，请优先查阅 `src/api/client.ts` 与 `src/router/index.ts`。*
