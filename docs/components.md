# 组件（Components）详解（逐组件）

`src/components` 下包含通用组件与业务组件（`src/components/slide`）。以下为每个组件的详细说明，含 Props、事件与关键代码位置。

## 查看器与核心

### OpenseadragonViewer.vue
路径：`src/components/OpenseadragonViewer.vue`

- 集成：查看器 `useOpenseadragon` + Konva 叠加层 `useOsdKonva` + 测量 `useMeasurement` + 标注 `useAnnotation` + AI 可视化 `useAiVisualization` + 质控可视化 `useQualityVisualization`（`src/components/OpenseadragonViewer.vue:121-141,170-198`）
- Props：`slideId/aiResult/currentQualityAreas/isQuality/rightSidebarWidth/leftSidebarWidth`（`src/components/OpenseadragonViewer.vue:143-168`）
- 下方工具栏：测量与标注切换，标注工具选择（矩形/多边形/椭圆/三角）（`src/components/OpenseadragonViewer.vue:58-117`）
- 右上按钮组：热力图与轮廓线按钮，支持徽章与禁用态（`src/components/OpenseadragonViewer.vue:18-56`）
- 生命周期：`onMounted` 初始化查看器、Konva、加载切片与 AI（`src/components/OpenseadragonViewer.vue:243-264`），`watch(slideId/aiResult)` 重载（`src/components/OpenseadragonViewer.vue:266-286`）
- 质控联动：`watch(currentQualityAreas)` 变化时绘制质控轮廓（`src/components/OpenseadragonViewer.vue:199-203`）

## 面板与弹窗（业务）

### QualityPanel.vue（质控面板）
路径：`src/components/slide/QualityPanel.vue`

- Props：`quality/aiQuality/qualities/ranseErrors/qiepianErrors/saomiaoErrors/label`（`src/components/slide/QualityPanel.vue:74-84`）
- 顶部质量选择：AI 徽章与选中态（`src/components/slide/QualityPanel.vue:14-25`），点击触发 `change-quality`（`src/components/slide/QualityPanel.vue:91-93`）
- 三个分区：`QualitySection` 分别渲染染色/扫描/切片异常（`src/components/slide/QualityPanel.vue:29-37`）
- 底部汇总：`QualitySummary` 渲染总体质量与缺陷列表（`src/components/slide/QualityPanel.vue:51-55`）
- 事件：`save-and-view/next-slice/toggle-collapse/update-quality-areas`（`src/components/slide/QualityPanel.vue:89-98`）

### QualitySection.vue（质控分区）
路径：`src/components/slide/QualitySection.vue`

- Props：`title/errors/allOptions`（`src/components/slide/QualitySection.vue:27-40`）
- 渲染：使用 `CheckBoxWithTitle`；`v-model` 绑定到 `error.value`；AI 徽章由 `error.AIAnalyze` 决定（`src/components/slide/QualitySection.vue:6-17`）
- 事件：`onQualityChange` 在值变为 `0/10` 时，将当前项回传到父级用于区域联动（`src/components/slide/QualitySection.vue:48-54`）

### QualitySummary.vue（质控汇总）
路径：`src/components/slide/QualitySummary.vue`

- Props：`label/currentQuality/ranseErrors/qiepianErrors/saomiaoErrors`（`src/components/slide/QualitySummary.vue:31-51`）
- 质量标签：`currentQuality==0 ? 合格 : 不合格`（`src/components/slide/QualitySummary.vue:8-11`）
- 列表：按分区遍历，仅显示 `value==10` 的缺陷（`src/components/slide/QualitySummary.vue:54-71,16-23`）

### QualityReportDialog.vue（质控报告弹窗）
路径：`src/components/slide/QualityReportDialog.vue`

- Props：`visible/title/sliceNo/uploadTime/processTime/qualityData/exportLoading/saveLoading`（`src/components/slide/QualityReportDialog.vue:95-104`）
- 医院与签名：`watch(visible)` 时拉取电子签名与医院信息（`src/components/slide/QualityReportDialog.vue:112-141`）
- 内容：总体质量、各分区的 `value==10` 项（`src/components/slide/QualityReportDialog.vue:41-71`）
- 事件：`update:visible/download/save`（`src/components/slide/QualityReportDialog.vue:106-107,131-137`）

### ResultPanel.vue（处理面板）
路径：`src/components/slide/ResultPanel.vue`

- Props：`conditions/advice`（`src/components/slide/ResultPanel.vue:68-77`）
- 渲染：根据 `componentType` 动态选择 `SingleRadio` 或 `CheckBox`，`AiAnalyze` 控制徽章（`src/components/slide/ResultPanel.vue:20-27`）
- 文本：`a-textarea` 录入辅助建议，`update:advice` 双向绑定（`src/components/slide/ResultPanel.vue:40-44,128-131`）
- 事件：`save-and-view/next-slice/toggle-collapse`（`src/components/slide/ResultPanel.vue:124-145`）

### ReportDialog.vue（诊断报告弹窗）
路径：`src/components/slide/ReportDialog.vue`

- Props：`visible/title/sliceNo/uploadTime/processTime/conditions/advice/slicePart/exportLoading/saveLoading`（`src/components/slide/ReportDialog.vue:77-88`）
- 值格式化：`CheckBox` 值 10→阳性/0→阴性，其余映射选项 label（`src/components/slide/ReportDialog.vue:122-137`）
- 显示策略：过滤掉值为 `0/null/''` 的项（`src/components/slide/ReportDialog.vue:139-145`）
- 电子签名：`watch(visible)` 时拉取（`src/components/slide/ReportDialog.vue:96-113`）

### ProcessResult.vue（AI/医生结果预览）
路径：`src/components/ProcessResult.vue`

- Props：`result/aiResult/collectionArea`（`src/components/ProcessResult.vue:83-96`）
- 部位判断：`collectionArea` 决定条件键集合（胃/肠/肺）（`src/components/ProcessResult.vue:101-127`）
- 展示：首个键为总结果，其余键按正向值显示；特殊逻辑如 NENS、AC（`src/components/ProcessResult.vue:7-33`）

## 通用组件

### CheckBoxWithTitle.vue（带标题/颜色点的缺陷勾选）
路径：`src/components/CheckBoxWithTitle.vue`

- Props：`options/disabled/modelValue/title/AIAnalyze/color`（`src/components/CheckBoxWithTitle.vue:27-54`）
- 逻辑：两值（0/10）切换；AI 徽章显示条件 `AIAnalyze==10`（`src/components/CheckBoxWithTitle.vue:63-76`）
- 禁用：点击时提示并重置为 0（`src/components/CheckBoxWithTitle.vue:82-86`）

### CheckBox.vue（二值勾选）
路径：`src/components/CheckBox.vue`

- Props：`options/disabled/modelValue/AiAnalyze`（`src/components/CheckBox.vue:21-43`）
- 默认选项：`阴性(0)/阳性(10)`（`src/components/CheckBox.vue:45-48`）
- 逻辑：切换至第二项为“选中”；`AiAnalyze` 与第二项值相等时显示徽章（`src/components/CheckBox.vue:67-76`）

### SingleRadio.vue（单选）
路径：`src/components/SingleRadio.vue`

- Props：`options/disabled/modelValue/AiAnalyze`（`src/components/SingleRadio.vue:24-41`）
- 逻辑：点击同一选项可取消（设为 0），否则选中该值；四个选项自动两行布局（`src/components/SingleRadio.vue:56-61,66-81`）

### SlideListSide.vue（侧边切片列表）
路径：`src/components/slide/SlideListSide.vue`

- Props：`slices/activeIndex/pannel/options/collapsed`（`src/components/slide/SlideListSide.vue:63-84`）
- 标签生成：`watch(slices)` 根据 `mainLabel/subLabel` 生成 `tagArr`（`src/components/slide/SlideListSide.vue:86-104`）
- 事件：`update-pannel/select-slice/toggle-collapse`（`src/components/slide/SlideListSide.vue:106-123`）
- 图片错误占位：隐藏图片并置灰背景（`src/components/slide/SlideListSide.vue:125-128`）

### FlowingProgressBar.vue（流动进度条）
路径：`src/components/FlowingProgressBar.vue`

- 用途：列表页解析/处理中的视觉反馈；两个片段交错动画（`src/components/FlowingProgressBar.vue:42-71`）

### commons/SignatureDialog.vue（电子签名上传弹窗）
路径：`src/components/commons/SignatureDialog.vue`

- Props/事件：`visible` + `update:visible/success`（`src/components/commons/SignatureDialog.vue:37-42,48-59`）
- 上传校验：格式与大小检查；预览生成（`src/components/commons/SignatureDialog.vue:61-81,73-80`）
- 提交：`userAPI.uploadElecName` 成功后关闭并回调（`src/components/commons/SignatureDialog.vue:88-109`）

## 组件交互约定

- 二值统一：`0=无/阴性`、`10=有/阳性`；AI 徽章判断与可视化联动统一使用该数值
- 颜色点：缺陷项可传入 `color` 用于在面板与质控轮廓中统一标识
