# 组合式函数（Composables）详解（逐文件）

`src/composables` 目录承载核心业务与可视化逻辑。以下为每个文件的详细说明，包含状态、方法、事件与关键代码位置。

## use-openseadragon.js（深度缩放查看器）
路径：`src/composables/use-openseadragon.js`

- 默认配置：`defaultOptions` 定义导航器、缩放与交互禁用（`src/composables/use-openseadragon.js:15-35`）
- 初始化：`initViewer(options)` 合并默认配置并创建 `viewer`（`src/composables/use-openseadragon.js:38-61`）
- 打开切片：`openSlide(slideId, fetcher)` 拉取 DZI 元数据并调用 `viewer.open`（`src/composables/use-openseadragon.js:64-104`）
- 资源清理：组件卸载销毁 `viewer`（`src/composables/use-openseadragon.js:106-114`）
- 暴露：`viewer/isReady/openSlide/initViewer`（`src/composables/use-openseadragon.js:116-121`）

## use-osd-konva.js（Konva 叠加层与交互同步）
路径：`src/composables/use-osd-konva.js`

- 初始化：创建 `stage/layer`，绑定 OSD 事件（`update-viewport/resize/open`）（`src/composables/use-osd-konva.js:17-30`）
- 右键平移：拦截 `contentContextmenu`，右键拖动实现视口平移（`src/composables/use-osd-konva.js:35-70`）
- 鼠标滚轮缩放：将 `wheel` 事件转发给 OSD，按指针所在位置缩放（`src/composables/use-osd-konva.js:76-96`）
- 视口同步：缩放、位置、旋转、翻转与绘制（`src/composables/use-osd-konva.js:105-132`）
- 监听清理：移除事件与销毁 `stage`（`src/composables/use-osd-konva.js:144-160`）
- 暴露：`stage/layer/initKonva/isReady`（`src/composables/use-osd-konva.js:162-167`）

## use-annotation.js（标注绘制与编辑）
路径：`src/composables/use-annotation.js`

- 状态：`isAnnotating/currentTool/selectedShapeId` 与 `transformer/deleteGroup` 等内部引用（`src/composables/use-annotation.js:6-14,119-152`）
- 缩放修正：`getScaleCorrection` 保持屏幕像素宽度一致（`src/composables/use-annotation.js:15-21,23-26`）
- 初始化：`initAnnotation` 创建 `Transformer`，绑定 OSD 动画事件以更新锚点与删除按钮位置（`src/composables/use-annotation.js:41-85`）
- 工具与激活：`activateAnnotation/deactivateAnnotation/setTool`（`src/composables/use-annotation.js:87-110`）
- 选择逻辑：`selectShape` 与 `bindShapeEvents`（`src/composables/use-annotation.js:208-233`）
- 绘制流程：
  - 按下：根据工具创建 `Rect/Ellipse/Triangle`（`src/composables/use-annotation.js:235-321`）
  - 移动：更新尺寸/半径/点集（`src/composables/use-annotation.js:323-349`）
  - 抬起：完成绘制并选中（`src/composables/use-annotation.js:352-361`）
  - 多边形：单击追加点，双击完成（`src/composables/use-annotation.js:364-401`）
- 删除：`deleteSelected` 调后端删除并移除画布（`src/composables/use-annotation.js:403-424`）
- 加载现有标注：`loadAnnotations(sliceId)` 根据后端 `jsonData` 恢复 `RECT/ELLIPSE/POLYGON`（`src/composables/use-annotation.js:426-485`）
- 暴露：`initAnnotation/activateAnnotation/deactivateAnnotation/setTool/currentTool/deleteSelected/initDoubleClickListener/loadAnnotations`（`src/composables/use-annotation.js:487-496`）

## use-measurement.js（测量箭头与标注）
路径：`src/composables/use-measurement.js`

- 状态：`isMeasuring/isDrawing` 与临时 `arrow/label/tag/text`（`src/composables/use-measurement.js:5-22`）
- 样式缩放：`updateMeasurementStyles` 根据舞台缩放更新箭头/标签/删除按钮位置与大小（`src/composables/use-measurement.js:23-87`）
- 初始化与激活：`initMeasurement/activateMeasurement/deactivateMeasurement`（`src/composables/use-measurement.js:89-112`）
- 绘制流程：按下创建箭头与标签，移动更新终点与距离文本，抬起生成删除按钮并支持点击删除（`src/composables/use-measurement.js:121-186,188-211,215-293`）
- 暴露：`initMeasurement/activateMeasurement/deactivateMeasurement/isMeasuring`（`src/composables/use-measurement.js:295-301`）

## use-ai-visualization.js（AI 热力图与轮廓）
路径：`src/composables/use-ai-visualization.js`

- 选项类：`HeatMapOptions`（`Main/Auxiliary`）含 `display/selected/disabled/badge`（`src/composables/use-ai-visualization.js:17-27`）
- 初始化：`initAiVisualization(sliceId, aiResult)` 重置数据与创建 Annotorious（只读）（`src/composables/use-ai-visualization.js:50-76`）
- 按钮组：`setupButtons(aiResult)` 构造主/辅按钮与徽章（`src/composables/use-ai-visualization.js:78-125`）
- 数据拉取：`fetchData(sliceId)` 合并热力与轮廓数据（`src/composables/use-ai-visualization.js:129-146`）
- 切换逻辑：`toggleHeatmap/toggleContour` 带去抖，互斥/禁用态（`src/composables/use-ai-visualization.js:150-199`）
- 按钮态更新：`updateAllButtonsState`（`src/composables/use-ai-visualization.js:200-217`）
- 热力图绘制：`displayFilteredHeatMap(option)` h337 创建覆盖层，按曲线 `pointList` 多边形掩膜过滤（`src/composables/use-ai-visualization.js:221-325`）
- 轮廓线绘制：`displayAICurve(option)` 将曲线坐标映射到 DZI 并通过 Annotorious 添加 POLYGON（`src/composables/use-ai-visualization.js:422-494`）
- 隐藏：`hideHeatmap/clearAICurve`（`src/composables/use-ai-visualization.js:408-418,496-501`）
- 暴露：`initAiVisualization/heatMapDisplayArray/contourDisplayArray/toggleHeatmap/toggleContour`（`src/composables/use-ai-visualization.js:503-509`）

## use-quality-visualization.js（质控区域渲染）
路径：`src/composables/use-quality-visualization.js`

- 初始化：创建 `stage/layer` 并同步 OSD 视口（`src/composables/use-quality-visualization.js:10-32,34-50`）
- 绘制：`drawQualityContours(areas)` 将各缺陷的 `contours` 绘制为 `Line/Polygon`，常量屏幕线宽（`src/composables/use-quality-visualization.js:64-111`）
- 暴露：`initQualityKonva/drawQualityContours`（`src/composables/use-quality-visualization.js:113-116`）

## use-slide-detail.js（诊断详情编排）
路径：`src/composables/use-slide-detail.js`

- 初始化列表：并行拉取切片详情并合并存储的列表字段（`src/composables/use-slide-detail.js:27-63`）
- 切换与导航：`selectSlide/nextSlide`（`src/composables/use-slide-detail.js:65-77`）
- 左右折叠与布局计算：`leftCollapsed/rightCollapsed/leftSpan/centerSpan`（`src/composables/use-slide-detail.js:16-25`）
- 暴露：列表、当前项与交互方法（`src/composables/use-slide-detail.js:82-97`）

## use-slide-result.js（诊断结果数据）
路径：`src/composables/use-slide-result.js`

- 加载：并行拉取 AI/医生结果，按部位初始化条件并合并值（`src/composables/use-slide-result.js:13-45`）
- 值更新：医生值 `updateValuesInConditions` 与 AI 徽章 `updateAiAnalyzeInConditions`（`src/composables/use-slide-result.js:47-66`）
- 选择键初始化：`getInitialConditions(part)` 深拷贝条件数组（`src/composables/use-slide-result.js:68-73`）
- 保存：`saveResult(sliceId, data)`（`src/composables/use-slide-result.js:75-83`）
- 暴露：`resultData/resultVisible/loadResult/saveResult`（`src/composables/use-slide-result.js:85-90`）

## use-slide-quality-detail.js（质控详情编排）
路径：`src/composables/use-slide-quality-detail.js`

- 初始化批次：使用 `getQualitySingleSliceData` 并合并存储字段（`src/composables/use-slide-quality-detail.js:25-50`）
- 切换与导航：`selectSlide/nextSlide`（`src/composables/use-slide-quality-detail.js:63-75`）
- 布局折叠与计算：`leftCollapsed/rightCollapsed/leftSpan/centerSpan`（`src/composables/use-slide-quality-detail.js:16-23`）
- 暴露：列表、当前项与交互方法（`src/composables/use-slide-quality-detail.js:80-95`）

## use-slide-quality.js（质控数据核心）
路径：`src/composables/use-slide-quality.js`

- 空数据结构：统一 `0/10` 值规范（`src/composables/use-slide-quality.js:11-28`）
- 加载与合并：`loadQuality(sliceId)` 医生与 AI 的并行拉取与合并（`src/composables/use-slide-quality.js:96-144`）
- 字段更新：医生值 `updateErrorFields` 与 AI 值与轮廓 `updateAIAnalyzeFields/parseContours`（`src/composables/use-slide-quality.js:146-157,160-196,198-227`）
- 保存：`saveQuality(sliceId, data)` 扁平化提交（`src/composables/use-slide-quality.js:236-277`）
- 区域联动：`updateQualityAreas(item)` 增删 `currentQualityAreas`（`src/composables/use-slide-quality.js:279-307`）
- 清理与工具：`switchToSlice/getSliceQualityData/clearSliceQualityData/clearAllQualityData/createEmptyQualityData`（`src/composables/use-slide-quality.js:40-56,309-334`）

## use-slide-quality-list.js（质控列表）
路径：`src/composables/use-slide-quality-list.js`

- 状态与筛选：`tableData/loading/pagination/filters/userOptions/selectedRowKeys`（`src/composables/use-slide-quality-list.js:13-38`）
- 拉取：`fetchData(paramsOverride)`（`src/composables/use-slide-quality-list.js:58-96`）
- 删除：`confirmDelete/batchDelete/deleteSlice`（`src/composables/use-slide-quality-list.js:104-138`）
- 进入详情：批量与单条（`src/composables/use-slide-quality-list.js:140-159`）
- 暴露：状态与操作方法（`src/composables/use-slide-quality-list.js:165-179`）

## use-slide-list.js（辅助诊断列表）
路径：`src/composables/use-slide-list.js`

- 状态与筛选：`tableData/loading/pagination/filters/userOptions/selectedRowKeys`（`src/composables/use-slide-list.js:22-47`）
- 拉取：`fetchData(paramsOverride)`（`src/composables/use-slide-list.js:76-120`）
- 轮询：上传状态与 AI 进度（`src/composables/use-slide-list.js:122-141,143-160`）
- 操作：删除/批量/单条/AI 分析触发（`src/composables/use-slide-list.js:168-203,204-230,232-257`）
- 结果弹窗：`checkSliceProcessResult`（`src/composables/use-slide-list.js:259-282`）
- 生命周期与暴露（`src/composables/use-slide-list.js:284-316`）

## use-upload.js（上传与队列管理）
路径：`src/composables/use-upload.js`

- 去重：`uniqueArr(arr, existingFiles)` 过滤重复文件与服务器已有切片（`src/composables/use-upload.js:28-57`）
- 选择文件：`onFileChange` 调服务端文件名列表去重（`src/composables/use-upload.js:59-76`）
- 上传队列：`uploadFiles/processNextUpload`（`src/composables/use-upload.js:83-103,105-153`）
- 上传完成：`allFilesUploadSuccess` 刷新列表并关闭弹窗（`src/composables/use-upload.js:155-160`）
- 队列管理：`removeFromQueue/cancelAllPendingUploads`（`src/composables/use-upload.js:162-176`）
- 服务端取消与重传：`handleCancelUpload/cancelUploads/handleReupload`（`src/composables/use-upload.js:179-215`）
- 进度拉取：`fetchUploadData` 映射缩略图与百分比（`src/composables/use-upload.js:220-239`）
- 暴露：`uploadModalVisible/isUploading/fileList/uploadQueue/uploadList/...`（`src/composables/use-upload.js:241-256`）

## 值约定与类型（统一规范）

- 二值选项统一使用数值：`0（无/阴性）`、`10（有/阳性）`
- `AIAnalyze` 为数值字段，`10` 显示 “AI” 徽章（`src/components/CheckBoxWithTitle.vue:8,63`；`src/components/CheckBox.vue:6,67-71`；`src/components/SingleRadio.vue:7`）
- 组件 `v-model` 统一为数值类型，避免字符串/数字混用
