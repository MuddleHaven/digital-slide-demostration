# 交接文档

本交接文档内容覆盖：项目架构、运行环境、目录结构、每个核心文件的作用与关键代码位置、API 约定、可视化实现、数据规范。

## 项目总览

- 类型：数字病理切片管理、AI 辅助诊断与质控系统
- 前端：`Vue 3` + `Pinia` + `Vue Router` + `Ant Design Vue` + `Vite`
- 可视化：`OpenSeadragon`（深度缩放）、`Konva`（画布叠加）、`Deck.gl`（WebGL 热力图叠加）、`Annotorious`（只读标注叠加）
- 双服务客户端：
  - 主服务（诊断）：`src/service/request.js:46-56`（附加 `token`）
  - 质控服务：`src/service/request-quality.js:21-29`（附加 `qualityToken`）
- 路由守卫：`src/router/index.js:32`（无主服务 `token` → `/login`）
- 环境变量：`.env` 使用 `VITE_BASE_URL` 与 `VITE_QUALITY_BASE_URL`

## 运行与入口

- 入口：`src/main.js:1-14`
  - 创建应用 → 加载全局样式 → 安装路由与 Pinia → `#app` 挂载
- 应用外壳：`src/App.vue:1-24`
  - 全局 AntD 语系、主题；`<RouterView/>` 渲染当前页面
- 全局样式：`src/style.css:1-6`（Tailwind 引入 + 视口尺寸）

## 目录结构（src）

- `assets/` 静态资源（图标/背景）
- `common/` 选项与枚举（按部位的诊断条件与可选值）
- `components/` 通用与业务组件（查看器、面板、弹窗等）
- `composables/` 组合式函数（核心业务逻辑与可视化逻辑）
- `router/` 路由配置与守卫
- `service/` HTTP 客户端与后端 API 封装
- `stores/` Pinia 状态管理（会话级持久化）
- `utils/` 工具函数与事件总线
- `views/` 页面视图（列表、详情、质控详情、登录）

## 路由与状态

- 路由配置：`src/router/index.js:1-43`
  - 路由：`/login`、`/list`、`/detail`、`/quality-detail`
  - 守卫：无主服务 `token` → 登录；已登录访问 `/login` → 跳转 `/list`（`src/router/index.js:32-41`）
- Pinia Store：`src/stores/slice-store.js:1-51`
  - `detailIds/slideListData` 会话持久化（`sessionStorage`）（`src/stores/slice-store.js:27,29,33,35`）
  - 用途：从列表页批量选择后，详情页按批次加载与切换

## HTTP 客户端与拦截器

- 主服务客户端：`src/service/request.js`
  - 动态后端地址：生产环境支持从 `/config.json` 加载 `backendUrl`（`src/service/request.js:16-28`）
  - 请求拦截：附加 `token` 与 `baseURL`（`src/service/request.js:46-56`）
  - 响应拦截：统一处理业务码，401 清理登录并重定向（`src/service/request.js:61-119`）
- 质控客户端：`src/service/request-quality.js`
  - 请求拦截：附加 `qualityToken` 与 `baseURL`（`src/service/request-quality.js:21-29`）
  - 响应拦截：同主服务逻辑（`src/service/request-quality.js:34-92`）

## 服务 API（逐文件）

- `src/service/slice.js`
  - 切片管理：
    - 分页列表：`getSliceList(current,size)`（`src/service/slice.js:11`）
    - 上传/重传/取消/批量取消：`upload/reUpload/cancelUpload/cancelUploads`（`src/service/slice.js:21, 39, 48, 57`）
    - 删除：`deleteSlices`（主服务）、`deleteQualitySlices`（质控）（`src/service/slice.js:66, 72`）
    - 条件查询：`querySlideData/queryQualitySlideData`（`src/service/slice.js:90, 97`）
    - AI 进度：`getAIProcessProgress`（`src/service/slice.js:104`）
  - 诊断数据：
    - 获取与保存：`getResult`、`updateResult`（`src/service/slice.js:368,360`）
    - 打印预览/导出 PDF：`getPrintReport/exportPDF`（`src/service/slice.js:385,393`）
    - AI 诊断：`getAIResult/AIAnalyze`（`src/service/slice.js:376,517`）
  - 质控数据：
    - 医生与 AI：`getQCResult`（type=2）、`getAIQCResult`（type=1）（`src/service/slice.js:411,420`）
    - 保存与导出：`updateQCResult/exportQCPDF`（`src/service/slice.js:403,437`）
    - 质量轮廓（示例）：`getAIQualityContours`（`src/service/slice.js:303`）
  - 数据看板：
    - 科室统计：`getDepartmentSliceAccount/getRecentSlicesByDepartment/getDiagnosisStatisticsByDepartment`（`src/service/slice.js:447,454,462`）
    - 个人统计：`getUserSliceAccountByUserId/getDiagnosisResultListByUserId/getRecentSlicesByUserId/getDiagnosisStatisticsByUserId`（`src/service/slice.js:470,478,494,502`）
    - AI 指标：`getAIMetrics`（`src/service/slice.js:510`）
- `src/service/user.js`
  - 并行登录：`login`（主服务）与 `loginQuality`（质控）（`src/service/user.js:16,4`）
  - 用户与签名：`getUserInfo/updateUserInfo/getAllUsersInfo/...`（`src/service/user.js:37-67`）；`getElecNamePathAndDepartmentAndHospital`（`src/service/user.js:86-91`）
  - 密码：`changePassword/resetPassword`（`src/service/user.js:112-127`）

## 可视化与交互（核心实现）

- 查看器封装：`src/composables/use-openseadragon.js`
  - 默认配置与初始化：`defaultOptions/initViewer`（`src/composables/use-openseadragon.js:15-35,37-61`）
  - 打开切片：从后端获取 DeepZoom 元数据，拼接 `tileUrl`，`viewer.open`（`src/composables/use-openseadragon.js:63-104`）
- 叠加层同步：`src/composables/use-osd-konva.js`
  - Konva 舞台/图层 + 与 OSD 的事件同步（缩放/平移/旋转/翻转/绘制）（`src/composables/use-osd-konva.js:56-74,98-132`）
- 质量渲染：`src/composables/use-quality-visualization.js`
  - `initQualityKonva/syncViewport/drawQualityContours`（`src/composables/use-quality-visualization.js:34,64-111`）
- AI 可视化：`src/composables/use-ai-visualization.js`
  - 按钮态与徽章：`setupButtons`（`src/composables/use-ai-visualization.js:78-125`）
  - 热力图（Deck.gl）：`displayDeckGLHeatMap`（`src/composables/use-ai-visualization.js:341-390`）
  - 轮廓线（Annotorious POLYGON）：`displayAICurve`（`src/composables/use-ai-visualization.js:422-494`）
- 标注工具：`src/composables/use-annotation.js`
  - `Transformer` 与工具切换、绘制矩形/椭圆/三角/多边形、删除、加载旧标注（`src/composables/use-annotation.js:235-401,403-485`）
- 测量工具：`src/composables/use-measurement.js`
  - 箭头与距离标签、删除按钮；随缩放更新样式（`src/composables/use-measurement.js:121-186,215-293`）
- 查看器组件：`src/components/OpenseadragonViewer.vue`
  - 组合多种 Hook，统一渲染与交互；监听 `slideId/aiResult/currentQualityAreas`（`src/components/OpenseadragonViewer.vue:143-168,243-286,199-203`）

## 业务逻辑（组合式与视图）

- 辅助诊断列表：`src/composables/use-slide-list.js`
  - 拉取与轮询：`fetchData/getAIprogress`（`src/composables/use-slide-list.js:76-120,143-160`）
  - 批次跳转：写入 `slice-store` 后路由至 `/detail`（`src/composables/use-slide-list.js:232,245`）
- 辅助诊断详情：`src/composables/use-slide-detail.js`
  - 初始化批次 → 合并列表字段 → 切换/下一例（`src/composables/use-slide-detail.js:26-77`）
- 诊断结果：`src/composables/use-slide-result.js`
  - 并行加载 AI/医生结果、保存与弹窗（`src/composables/use-slide-result.js:13-45,75-90`）
- 上传队列：`src/composables/use-upload.js`
  - 去重、队列、取消、重传、进度刷新（`src/composables/use-upload.js:28-57,83-153,179-215,220-239`）
- 质控列表：`src/composables/use-slide-quality-list.js`
  - 拉取与进入详情（`src/composables/use-slide-quality-list.js:57-96,140-159`）
- 质控详情：`src/composables/use-slide-quality-detail.js`
  - 批次加载、切换、折叠栏（`src/composables/use-slide-quality-detail.js:24-61`）
- 质控数据核心：`src/composables/use-slide-quality.js`
  - 并行拉取医生/AI → 合并与轮廓解析 → 扁平化保存（`src/composables/use-slide-quality.js:95-144,160-196,229-277`）
- 页面视图：`src/views/*.vue`
  - 列表页：`src/views/SlideListView.vue`（双 Tab、URL 持久化、进度与上传）
  - 诊断详情：`src/views/SlideDetailView.vue`（查看器 + 右侧 `ResultPanel` + 签名与报告）
  - 质控详情：`src/views/SlideQualityDetailView.vue`（查看器 + 右侧 `QualityPanel` + 报告）
  - 登录页：`src/views/LoginView.vue`（并行登录主/质控服务；成功后跳转）

## 组件（选摘）

- `src/components/slide/ResultPanel.vue`：条件渲染与建议文本、保存与下一例（`src/components/slide/ResultPanel.vue:68-77,124-145`）
- `src/components/slide/ReportDialog.vue`：诊断报告（电子签名/结果过滤/下载保存）（`src/components/slide/ReportDialog.vue:77-88,122-145`）
- `src/components/slide/QualityPanel.vue`：AI 徽章与三个分区（`src/components/slide/QualityPanel.vue:14-37,51-55`）
- `src/components/slide/QualityReportDialog.vue`：质控报告（签名/医院科室/下载保存）（`src/components/slide/QualityReportDialog.vue:95-104,112-141`）
- `src/components/slide/SlideListSide.vue`：左侧列表与标签生成（`src/components/slide/SlideListSide.vue:86-104`）
- 通用二值组件：`CheckBox/CheckBoxWithTitle/SingleRadio`（数值 `0/10` 统一；AI 徽章）（`src/components/CheckBox.vue:67-76`，`src/components/CheckBoxWithTitle.vue:63-76`，`src/components/SingleRadio.vue:66-81`）

## 选项与枚举（业务字典）

- 部位选项与条件：
  - 胃：`src/common/options-stomach.js:46-61,89-97`
  - 肺：`src/common/options-lung.js:52-63,85-95`
  - 肠：`src/common/options-colon.js:56-67,89-99`
- 公共选项与工具：
  - 统一选项表与映射：`src/common/options.js:1-19,63-79`
  - 部位枚举：`SlicePart`（`src/common/options.js:56-60`）
  - 条件数组与键映射：`AllPartConditions/AllPartConditionKeys`（`src/common/options.js:63-73`）
  - 选项获取与值转标签：`getCheckoutOptionsArray/getCheckoutOptionLabel`（`src/common/options.js:87-107,116-133`）
- 状态枚举：
  - 切片状态：`SliceStatusEnum` 与显示字典（`src/common/sliceTypes.js:4-23,26-38`）
  - 质量状态：`QualityCheckStatusEnum` 与显示字典（`src/common/sliceTypes.js:41-53`）
  - 工具辅助：失败/处理中/已处理判断方法（`src/common/sliceTypes.js:95-124`）

## 工具与事件总线

- 路径拼接：`src/utils/index.js`
  - 图片前缀：`getImagePrefix(isQuality)`（`src/utils/index.js:36-44`）
  - DeepZoom 瓦片 URL：`getTileUrl(tileUrl)`（`src/utils/index.js:46-57`）
  - `debounce/throttle`（`src/utils/index.js:1-33`）
- 事件总线：`src/utils/eventBus.js:4-36`
  - 订阅/取消/发布简单实现（`on/off/emit`）

## 数据与值规范

- 二值统一：`0=无/阴性`、`10=有/阳性`（各组件/选项保持一致）
- 质控总体质量：`0=合格`、`10=不合格`
- AI 徽章显示：当某项 `AIAnalyze==10` 显示 “AI” 徽章（示例：`src/components/CheckBoxWithTitle.vue:63-76`）
- 质控保存：后端扁平结构，数值按字符串提交（`src/composables/use-slide-quality.js:229-277`）

## 环境与部署

- `.env` 示例：主/质控后端 URL 与产品信息（`VITE_BASE_URL/VITE_QUALITY_BASE_URL/...`）
- 生产后端地址：主服务客户端支持从 `/config.json` 动态加载（`src/service/request.js:16-28`）
- 启动与构建：`npm install` → `npm run dev` / `npm run build` / `npm run preview`

---

配合本文档，建议阅读：
- `docs/views.md`（页面与业务流程）
- `docs/components.md`（组件与交互）
- `docs/composables.md`（组合式函数逐文件详解）
