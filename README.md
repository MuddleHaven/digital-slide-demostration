# 数字切片质控与诊断系统（Digital Slide Demonstration）

一个基于 Vue 3 + Vite 的数字病理切片管理、AI 辅助诊断与质控系统。支持大规模切片管理、AI结果可视化、质控记录与报告导出，面向科室级应用与科研级评估。

## 项目亮点与价值

- 科室/个人数据看板：实时统计上传量、处理进度、诊断类型分布与AI性能指标，用数据驱动管理与科研（参考 `src/service/slice.js:447, 455, 462, 470, 478, 486, 494, 502, 510`）。
- 双服务架构：诊断主服务与质控服务分离，登录并行、权限独立，保证可靠性与可扩展性（`src/views/LoginView.vue:50`）。
- 高性能可视化：OpenSeadragon 深度缩放 + Konva/Deck.gl 叠加，支持热力图、轮廓线与交互批注（`src/components/OpenseadragonViewer.vue:256`，`src/composables/use-quality-visualization.js:34`，`src/composables/use-ai-visualization.js:341`）。
- 完整工作流：列表筛选→批次选择→详情复核→签名→PDF 报告导出，全流程可追溯（`src/views/SlideDetailView.vue`、`src/views/SlideQualityDetailView.vue`）。

## 系统架构

- 前端：`Vue 3` + `Pinia` + `Vue Router` + `Ant Design Vue` + `OpenSeadragon`
- 可视化：`Konva`（图层叠加/交互）、`Deck.gl`（WebGL 热力图）
- HTTP 客户端：
  - 主服务客户端：`src/service/request.js:1`（`VITE_BASE_URL`，Token `token`）
  - 质控客户端：`src/service/request-quality.js:1`（`VITE_QUALITY_BASE_URL`，Token `qualityToken`）
- 路由守卫：`src/router/index.js:32`（无主服务 `token` 时强制跳转登录）

## 技术栈

- 框架与核心库：`vue@^3`、`pinia@^3`、`vue-router@^4`、`ant-design-vue@^4`、`vite@^7`
- 图像与可视化：`openseadragon@^5`、`konva@^10`、`deck.gl@^9`、`@annotorious/openseadragon`
- 网络与辅助：`axios`、`lodash`、`dayjs`

## 目录结构

- `src/views`：页面视图（列表、详情、质控详情、登录）
- `src/components`：通用与业务组件（查看器、面板、对话框等）
- `src/composables`：组合式函数，封装业务逻辑与状态（核心）
- `src/service`：后端 API 封装（`slice.js`、`user.js` 等）
- `src/stores`：Pinia 状态（`slice-store.js`）
- `src/common`：选项与枚举、业务常量（如 `options.js`、`sliceTypes.js`）
- `src/router/index.js`：路由配置

## 核心功能

- 切片管理：上传、过滤、分页、批量操作（`src/service/slice.js:11, 21, 30, 39, 48, 57, 66`）
- 深度缩放查看：大图查看器 + 导航 + 图层叠加（`src/components/OpenseadragonViewer.vue`，`src/composables/use-openseadragon.js:63`）
- AI 辅助诊断：加载诊断结果、可视化热力图/轮廓线（`src/service/slice.js:376`，`src/composables/use-ai-visualization.js`）
- 质控工作流：列表、详情、缺陷标注与保存、报告导出（`src/composables/use-slide-quality-list.js:57, 140`，`src/composables/use-slide-quality.js:95, 229`，`src/service/slice.js:403, 411, 420, 429, 437`）
- 报告生成：诊断/质控 PDF 导出（`src/service/slice.js:393, 437`）

## API 架构与示例

- 双客户端与并行登录：
  - 主服务登录 + 质控服务登录并行执行（`src/views/LoginView.vue:50-58`），分别写入 `token` 与 `qualityToken`。
  - Axios 实例在请求拦截中自动附加对应 Token（`src/service/request.js:44`，`src/service/request-quality.js:24`）。

- 切片列表与处理进度：
  - 分页列表：`getSliceList(current,size)`（`src/service/slice.js:11`）
  - AI 处理进度轮询：`getAIProcessProgress()`（`src/service/slice.js:103`，前端轮询逻辑见 `src/composables/use-slide-list.js:143`）

- 诊断数据：
  - 加载诊断结果：`getResult(sliceId)`（`src/service/slice.js:368`）
  - 保存诊断并导出 PDF：`updateResult(params)`（`src/service/slice.js:360`）、`exportPDF(data)`（`src/service/slice.js:393`）

- 质控数据：
  - 加载已保存与 AI 质控：`getQCResult(sliceId)`（`src/service/slice.js:411`）、`getAIQCResult(sliceId)`（`src/service/slice.js:420`）
  - 保存质控：`updateQCResult(data)`（`src/service/slice.js:403`）
  - 导出质控报告：`exportQCPDF(data)`（`src/service/slice.js:437`）

- 数据看板与指标：
  - 科室维度：`getDepartmentSliceAccount()`（`src/service/slice.js:447`）、`getRecentSlicesByDepartment(type)`（`src/service/slice.js:454`）、`getDiagnosisStatisticsByDepartment()`（`src/service/slice.js:462`）
  - 个人维度：`getUserSliceAccountByUserId(userId)`（`src/service/slice.js:470`）、`getDiagnosisResultListByUserId(userId)`（`src/service/slice.js:478`）、`getRecentSlicesByUserId(userId,type)`（`src/service/slice.js:494`）、`getDiagnosisStatisticsByUserId(userId)`（`src/service/slice.js:502`）
  - AI 指标：`getAIMetrics()`（`src/service/slice.js:510`）

## AI 质量轮廓示例

`getAIQualityContours(sliceId)` 返回质量轮廓的坐标数组与图像尺寸，用于在查看器上叠加展示（`src/service/slice.js:303`）。

示例返回（节选）：

```json
{
  "code": 200,
  "data": {
    "curveCols": 6457,
    "curveRows": 11160,
    "curveList": [
      {
        "points": "[[2696,5488],[2580,5510],...,[2696,5488]]",
        "type": "3"
      }
    ]
  }
}
```

渲染流程：

- 查看器初始化与打开切片：`src/composables/use-openseadragon.js:63`、`src/components/OpenseadragonViewer.vue:256`
- 质量轮廓绘制与视口同步：`src/composables/use-quality-visualization.js:34`（`syncViewport` 保证缩放/平移一致）

## 状态管理与批处理工作流

- Pinia Store 持久化批次 ID 与列表数据（会话级）：
  - `setDetailIds` 写入 `sessionStorage`（`src/stores/slice-store.js:27, 29`）
  - 列表/批次到详情跳转时写入与读取（`src/composables/use-slide-list.js:232, 245`，`src/composables/use-slide-quality-list.js:140, 155`）
- 详情页按批次加载与切换：`src/composables/use-slide-detail.js:26, 65`，`src/composables/use-slide-quality-detail.js:24, 61`

## 数据约定（重要）

- 选项值统一使用数值：`0=无/阴性`，`10=有/阳性`
- AI 标记显示规则：当 `AIAnalyze=10` 显示 “AI” 徽章（`src/components/CheckBoxWithTitle.vue:1, 20, 49`）
- 质控总体质量值：`0=合格`，`10=不合格`
- 质控缺陷选择使用 `CheckBoxWithTitle` 组件的第二项（值 10）

## 环境与部署

- 安装依赖：`pnpm install`
- 开发运行：`pnpm run dev`
- 构建产物：`pnpm run build`；本地预览：`pnpm run preview`
- 环境变量（`.env` 示例）：

```env
VITE_BASE_URL=http://<主服务URL>
VITE_QUALITY_BASE_URL=http://<质控服务URL>
VITE_APP_TISSUE_TYPE=multiple
VITE_APP_TISSUE_NAME=多部位组织
VITE_APP_TITLE=组织病理图像处理软件
VITE_APP_MODELNUMBER=UI-UNIThink
```

- 生产配置：主服务客户端支持从 `/config.json` 动态加载 `backendUrl`（`src/service/request.js:16-28`），用于部署时灵活切换后端地址。

## 大文件数据（Slices）
本地压缩（7-Zip，最大压缩 + 分卷）示例：

```bash
7z a -t7z -mx=9 -m0=lzma2 -md=1024m -mfb=273 -ms=on -mmt=on -v490m "Slices_ultra.7z" "Slices"
```

说明：

- 分卷大小设置为 490MB 便于在“单文件大小受限”的平台上传
- 如果需要显著减小体积，通常必须重新编码 JPEG（可能降低画质）或只保留抽样数据用于演示

## 路由与页面

- 登录：`/login`
- 列表：`/list`
- 详情（诊断）：`/detail`
- 质控详情：`/quality-detail`
- 守卫：`src/router/index.js:32`（无主 `token` 时跳转登录；已登录访问 `/login` 时跳转 `/list`）

## 文档入口

- `docs/composables.md`：核心逻辑与状态管理（重点）
- `docs/views.md`：页面（视图）功能与流程说明
- `docs/components.md`：可复用组件的使用说明

## 常见问题

- 质控项未高亮：确认使用了值为 `10` 的选项；并检查 `AIAnalyze` 与 `modelValue` 类型为数值。
- AI 徽章未显示：确认 `AIAnalyze` 为数值 `10`（`src/components/CheckBoxWithTitle.vue:49`）。
- 查看器叠加不对齐：检查 `syncViewport` 是否执行（`src/composables/use-quality-visualization.js:34`）。
