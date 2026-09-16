# 项目交接文档

## 1. 文档信息

- 文档版本：v1.2.0
- 交接日期：2026-09-16
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

## 11. 后续接手建议

1. 联调前先确认租户 ID、项目空间 ID、来源系统 ID 已正确写入本地上下文。
2. 逐页核对真实响应，重点检查列表响应外层结构、分页字段和枚举值。
3. 后端新增列表端点或返回字段后，同步更新页面查询条件、表头及 `*[0m 标识。
4. 新增正式接口时同步维护接口模块、页面注册配置和 `swaggerEndpointPatterns[0m。

