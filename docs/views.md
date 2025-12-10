# 页面（Views）说明

应用的主要页面位于 `src/views`，承载诊断与质控两条业务主线。

## SlideListView.vue（列表页）
路由：`/list`

- 两个 Tab：
  - “辅助诊断”列表（result）
  - “质控评价”列表（quality）
- URL 持久化：`activeTab` 持久化到查询参数（`src/views/SlideListView.vue:343-347`），切换与返回后仍保持当前 Tab
- 组件：`a-table` 展示列表、`a-modal` 处理上传/结果、`FlowingProgressBar` 展示解析进度
- 调用：
  - 诊断列表逻辑：`useSlideList`（`src/composables/use-slide-list.js:76`）
  - 质控列表逻辑：`useSlideQualityList`（`src/composables/use-slide-quality-list.js:58`）
  - 上传逻辑：`useUpload`（`src/composables/use-upload.js:83`）

## SlideDetailView.vue（诊断详情）
路由：`/detail`

- 布局：
  - 中间：`OpenseadragonViewer` 深度缩放查看器
  - 左侧：`SlideListSide` 切片列表/导航
  - 右侧：`ResultPanel` 展示 AI 与医生复核结果、建议文本框
- 结果展示：`ProcessResult.vue`（如 `src/components/ProcessResult.vue:10, 47`）根据切片部位映射不同条件键
- 常用交互：切换下一例、查看 AI 热力/ROI、医生复核保存（组合式函数按项目需要扩展）

## SlideQualityDetailView.vue（质控详情）
路由：`/quality-detail`

- 布局：
  - 中间：`OpenseadragonViewer`
  - 左侧：`SlideListSide`
  - 右侧：`QualityPanel` 质控面板与汇总
- 数据编排：`useSlideQualityDetail`（`src/composables/use-slide-quality-detail.js:25, 63, 69, 77`）初始化、切换切片与折叠栏
- 数据加载与保存：`useSlideQuality`（`src/composables/use-slide-quality.js:96, 160, 198, 236`）
- 交互：在 `QualitySection` 中每个缺陷项通过 `CheckBoxWithTitle` 勾选（`10=有`）或取消（`0=无`），右下角汇总由 `QualitySummary` 展示（`src/components/slide/QualitySummary.vue:9-11, 16-23`）

## LoginView.vue（登录）
路由：`/login`

- 登录后路由守卫跳转至列表（`src/router/index.js:31-41`）
- 持久化 Token 在 `localStorage`，未登录直接拦截
