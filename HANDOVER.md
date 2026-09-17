# 项目交接文档

## 1. 文档信息

- 文档版本：v1.4.0
- 交接日期：2026-09-17
- 项目目录：[96mF:\codex\gitHub\hutong[0m
- 接口文档：[96mC:\Users\全栈架构师\Desktop\jk.txt[0m

## 2. 本次交接范围

本次工作依据 [96mjk.txt[0m 中的 OpenAPI 定义，完成相关页面和业务接口的对接与调整。登录接口此前已验证可用，本次未修改 [96msrc/api/auth.ts[0m。

主要完成内容：

- 接入租户、用户、权限、规范包等正式列表接口。
- 项目空间、部署实例、事件、证据、投影页面按文档提供的能力调整为按 ID 查询。
- 接入证据登记、存证状态查询、验真和血缘查询。
- 接入田间、质检、赋码、供销、代煎和主数据等业务写接口。
- 新增供应链事件统一接口模块，覆盖 15 类业务事件。
- 根据接口返回补充列表表头；页面已有但接口无对应字段的表头追加 `*[0m。
- 查询条件已按各查询接口实际支持的参数调整。

## 3. 关键目录与文件

`+src/
├─ api/
│  ├─ auth.ts                  # 登录接口，本次未修改
│  ├─ client.ts                # API 请求、正式接口识别及本地 fallback
│  ├─ events.ts                # 事件相关接口
│  └─ supplyChain.ts           # 供应链业务事件接口
├─ config/
│  └─ pageApiRegistry.ts       # 页面与接口注册配置
├─ pages/                      # 业务页面
└─ utils/                      # 通用工具（存在未跟踪内容，勿误删）
[0m

继续增加或修改正式接口时，需要同步检查 `src/api/client.ts[0m 中的 `swaggerEndpointPatterns[0m，避免正式接口被错误识别为未发布接口并走本地 fallback。

## 4. 接口调用约定

### 4.1 上下文请求头

当前业务请求使用数字型上下文 ID，主要请求头如下：

`http
X-Tenant-Id: <tenantId>
X-Project-Id: <projectId>
X-Project-Space-Id: <projectSpaceId>
X-Source-System-Id: <sourceSystemId>
[0m

投影创建接口还需携带：

`http
X-Purpose-Code: EXCHANGE_OUTPUT
[0m

不要再使用租户名称、租户编码或项目编码替代上述数字 ID。

### 4.2 正式列表接口

接口文档中明确支持列表查询的主要接口如下：

| 业务 | 方法与路径 | 查询参数 |
| --- | --- | --- |
| 租户列表 | `GET /tenant-access/tenants[0m | `tenantName[0m、`page[0m、`size[0m |
| 用户列表 | `GET /tenant-access/users[0m | `tenantId[0m |
| 权限列表 | `GET /tenant-access/permissions[0m | 以接口定义为准 |
| 规范包列表 | `GET /exchange-query/profiles[0m | `profileCode[0m、`limit[0m |

查询表单只能提供接口实际支持的查询条件，后续接口参数有变化时应同步调整页面查询项和请求参数映射。

### 4.3 仅支持按 ID 查询的接口

下列接口在当前文档中未提供列表查询能力，对应页面已按 ID 查询处理：

| 业务 | 方法与路径 |
| --- | --- |
| 项目空间 | `GET /admin/v1/project-spaces/{id}[0m |
| 部署实例 | `GET /admin/v1/deployment-instances/{id}[0m |
| 事件 | `GET /openapi/v1/event-fact/events/{id}[0m |
| 证据 | `GET /openapi/v1/evidence/{id}[0m |
| 投影 | `GET /exchange-query/projections/{id}[0m |

在后端补充正式列表接口前，不要从按 ID 接口推断或拼装列表请求。

## 5. 页面字段与查询规则

列表页面按以下规则维护：

1. 查询接口返回字段存在、页面未展示时，补充对应表头和单元格展示。
2. 页面已有表头、接口响应无对应字段时，在表头文字后追加 `*[0m，表示该字段目前没有接口数据支撑。
3. 查询条件、参数名称和参数类型必须与列表查询接口一致，不保留接口不支持的筛选条件。
4. 字段映射优先使用接口原始字段；确需格式化时保留空值处理，避免将无返回误显示为有效数据。
5. 接口文档新增字段或列表能力后，应同步移除已获得接口支撑字段上的 `*[0m。

## 6. 投影、证据与存证

### 6.1 投影

- 创建投影时使用 `X-Purpose-Code: EXCHANGE_OUTPUT[0m。
- 投影查询支持 `projectSpaceId[0m、`purposeCode[0m、`includeOutput[0m、`includeValidationDetails[0m。
- 页面查询项和布尔值传参需与上述参数保持一致。

### 6.2 存证与验真

- 存证状态查询：`GET /openapi/v1/proofs/{subjectType}/{subjectId}[0m
- 存证验真：`POST /openapi/v1/proofs/verify[0m
- 证据登记、证据查询及血缘查询已按接口文档接入。

## 7. 供应链业务事件

`src/api/supplyChain.ts[0m 统一维护以下 15 类供应链业务事件端点：

| 业务事件 | 接口路径 |
| --- | --- |
| 入库 | `/supply-chain/warehouse-receipts[0m |
| 出库 | `/supply-chain/warehouse-issues[0m |
| 追溯码赋码 | `/supply-chain/trace-code-assignments[0m |
| 供销订单 | `/supply-chain/supply-orders[0m |
| 供销交付 | `/supply-chain/supply-deliveries[0m |
| 质量检验 | `/supply-chain/quality-inspections[0m |
| 初加工 | `/supply-chain/primary-processes[0m |
| 处方 | `/supply-chain/prescriptions[0m |
| 质押 | `/supply-chain/pledges[0m |
| 种植 | `/supply-chain/plantings[0m |
| 投入品使用 | `/supply-chain/input-applications[0m |
| 采收 | `/supply-chain/harvests[0m |
| 农事操作 | `/supply-chain/farming-operations[0m |
| 代煎过程 | `/supply-chain/decoction-processes[0m |
| 代煎交付 | `/supply-chain/decoction-deliveries[0m |

田间、质检、赋码、供销、代煎和主数据相关写操作均应调用正式接口，不再仅更新页面本地状态。

## 8. 本地状态键

当前上下文主要通过以下本地存储键维护：

| 键 | 含义 |
| --- | --- |
| `tcmirp_tenant_id[0m | 当前租户 ID |
| `tcmirp_project_space_id[0m | 当前项目空间 ID |
| `tcmirp_source_system_id[0m | 当前来源系统 ID |
| `tcmirp_purpose_code[0m | 当前用途代码 |
| `tcmirp_project_id[0m | 兼容旧版本的项目 ID 键 |

`tcmirp_project_id[0m 仅用于兼容旧数据，新代码应优先使用项目空间相关上下文键。

## 9. 已知限制与维护注意事项

- OpenAPI 文档未提供列表接口的页面，目前保留本地基准数据或使用按 ID 查询；后端补齐列表接口后再切换为正式分页列表。
- `apiCall[0m 对未发布接口保留本地 fallback；登录接口不走 fallback，登录失败应直接反馈真实接口错误。
- 正式接口路径变化时，需要同步更新 `src/api/client.ts[0m 的 `swaggerEndpointPatterns[0m。
- 带 `*[0m 的表头表示当前接口无对应返回字段，不代表字段必填。
- 工作区原有未跟踪内容包括 `.idea/[0m、`src/utils/[0m 和 `yarn.lock[0m，后续处理版本控制时不要误删或回滚。

## 10. 本轮验证记录

本轮完成了接口代码与页面字段、查询条件的对接，但按照任务约束未执行构建、打包、测试、lint 或项目启动命令。因此本文档不声明上述检查已通过，后续需要验证时应根据项目现有脚本单独执行。

## 11. 2026-09-17 接口对接更新

当前 Swagger：http://192.168.1.39/api/tcmirp/swagger-ui/index.html#/ 。本节以当前代码为准，补充前文交接后的租户、用户、角色与权限页面。主要文件：`src/api/rbac.ts`、`src/api/client.ts`、`src/pages/settings/Tenants.vue`、`src/pages/settings/Users.vue`、`src/pages/settings/Roles.vue`。默认 API 基础路径为 `/api/tcmirp`，开发代理指向 `http://192.168.1.39`；浏览器 `tcmirp_api_base` 可覆盖默认路径。

### 11.1 租户管理（`/settings/tenants`）

| 页面时机 | 接口 | 说明 |
| --- | --- | --- |
| 进入、刷新、查询、重置、翻页 | `GET /tenant-access/tenants` | 服务端分页，仅传 `tenantName`、`page`、`size` |
| 详情 | `GET /tenant-access/tenants/{id}` | 按 ID 查询 |
| 新增 | `POST /tenant-access/tenants` | 名称、类型、可选编码 |
| 编辑、启用或停用 | `POST /tenant-access/tenants/{id}/update` | 名称、类型、状态 |
| 删除 | `GET /tenant-access/tenants/{id}/delete` | 成功后刷新列表 |

租户页不再以本地样例代替正式接口错误；联系人、资质、管理员、配额不在当前接口模型中，已从页面移除。行操作“冻结”已改为“停用”。

### 11.2 角色与权限（`/settings/roles`）

| 页面时机 | 接口 | 说明 |
| --- | --- | --- |
| 进入、刷新、创建角色或保存授权后 | `GET /tenant-access/roles`、`GET /tenant-access/permissions` | 列表与权限字典数量 |
| 查询、重置 | 无新增请求 | 角色编码/名称在已加载列表中本地筛选，重置恢复全部 |
| 创建角色 | `POST /tenant-access/roles/tenant` | 可选 `tenantId` query |
| 打开配置功能权限 | `GET /tenant-access/roles/{roleId}/permissions` | 根据 `granted` 初始化勾选 |
| 保存权限配置 | `POST /tenant-access/roles/{roleId}/permissions` | 提交最终 `permissionCodes` 数组 |

权限项创建、修改、删除接口虽在 API 模块和页面注册配置中列出，当前页面没有入口，也不会调用。当前 Swagger 无角色编辑、删除接口，页面未展示相应操作。

### 11.3 用户管理（`/settings/users`）

| 页面时机 | 接口 | 说明 |
| --- | --- | --- |
| 进入、刷新、按租户查询、重置 | `GET /tenant-access/users`、`GET /tenant-access/tenants`、`GET /tenant-access/roles` | 用户查询仅支持 `tenantId`，其余提供选择项 |
| 创建用户 | `POST /tenant-access/users` | 租户 ID、账号、显示名称、RSA 加密密码 |
| 创建后绑定初始角色 | `POST /tenant-access/users/{userId}/roles` | 独立于用户创建请求 |
| 打开绑定或解除弹框 | `GET /tenant-access/roles` | 每次重新获取；有租户 ID 时显示同租户及平台角色，空租户时显示全部 |
| 确认绑定 | `POST /tenant-access/users/{userId}/roles` | 多选，当前请求体为 `{ roleId: number[] }`；非空租户 ID 作为 query |
| 确认解除 | `GET /tenant-access/users/{userId}/roles/{roleId}/delete` | 单角色，当前页面要求非空租户 ID |

用户编辑、删除、重置密码及状态切换没有正式接口，页面未展示入口。接口没有提供用户已绑定角色列表，解除弹框目前无法只展示已绑定项。

### 11.4 契约差异与风险

- 当前 Swagger 的 `UserRoleBindRequest` 定义 `roleId` 为单个 `int64`，且 `tenantId` query 必填；前端按后续需求提交数组，空租户时省略 query。后端支持情况尚未确认，联调前需同步契约。
- 后端 `int64` ID 以 JSON 数字返回，可能超过 JavaScript 安全整数范围。Axios 仍默认解析 JSON；此前 `json-bigint` 修复已按要求撤回。显示、路径参数及 `Number(roleId)` 转换可能失真，需后端以字符串序列化 ID 或统一采用无损解析。
- `rbac.ts` 仍有部分未被页面调用的本地演示方法，不代表正式接口已接通。本轮只更新文档；未执行打包、测试、lint、项目启动或页面联调。

### 11.5 接入与治理（APP-03）

依据当前 Swagger 的 `APP-03 来源接入与数据治理` 调整了 `src/api/governance.ts`、`src/pages/governance/Sources.vue`、`Batches.vue`、`Mappings.vue`、`Cases.vue`、`Standards.vue` 及 `src/config/pageApiRegistry.ts`。该分组目前只有以下五个写接口；批次按 ID 查询属于 APP-08，但接入批次页一并使用。

| 页面与操作 | 接口 | 当前行为 |
| --- | --- | --- |
| 来源系统注册 | `POST /openapi/v1/source-systems` | 提交来源代码、名称、类型、主体 ID、接入方式、签名配置、信任级别、用途代码和状态；注册成功后把返回 ID 写入 `tcmirp_source_system_id` |
| 创建接入批次 | `POST /openapi/v1/batches` | 提交批次编码、来源系统 ID、映射配置、文件 ID、业务用途和处理策略；受理后用返回的 `batchId` 查询 |
| 查询接入批次 | `GET /openapi/v1/batches/{batchId}`（APP-08） | 仅按 ID 查询；`includeFailures`、`pageNo`、`pageSize` 为查询参数，失败明细显示接口返回的 `lineNo`、`code`、`fieldPath`、`ruleCode`、`message` |
| 留存原始记录 | `POST /openapi/v1/raw-records` | 提交项目空间 ID、来源系统 ID、来源业务键、内容类型及原始内容或文件片段引用；返回 `rawRecordId` 可用于重放 |
| 重放原始记录 | `POST /openapi/v1/raw-records/{rawRecordId}/replays` | `mappingVersion` 和 `reason` 作为必填 query 参数；不能用批次 ID 代替原始记录 ID |
| 字段映射预检 | `POST /openapi/v1/mappings/test` | 页面输入映射代码/版本、来源系统 ID、目标事件/Schema 版本及 JSON 对象样例，固定 `dryRun: true`，展示映射响应和 `issues` |

来源系统接口没有列表、详情、启停接口；页面只显示当前页面注册成功的结果，刷新后不会保留。批次接口没有列表能力，未填写任务 ID 时不请求也不显示示例批次。正式 APP-03 写请求不走 `apiCall` 的模拟成功 fallback，错误由页面反馈。

治理异常案卷、数据元与值域在 APP-03 没有查询或管理接口；页面明确标注本地参考数据，移除了会宣称保存、处置或重放成功的操作。事件与 Schema 配置页面属于 APP-04，不是本次 APP-03 对接范围。`src/api/client.ts` 已识别上述正式路径；后端增加列表或管理接口时需同步更新接口白名单与页面。

本次仅核对 Swagger 和代码并更新页面、接口及本文档，未执行打包、测试、lint、启动或页面联调；实际业务参数、鉴权及响应仍待环境联调。

## 12. 后续接手建议

1. 联调前先确认租户 ID、项目空间 ID、来源系统 ID 已正确写入本地上下文。
2. 逐页核对真实响应，重点检查列表响应外层结构、分页字段和枚举值。
3. 后端新增列表端点或返回字段后，同步更新页面查询条件、表头及 `*[0m 标识。
4. 新增正式接口时同步维护接口模块、页面注册配置和 `swaggerEndpointPatterns[0m。

