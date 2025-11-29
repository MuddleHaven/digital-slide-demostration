//openSeaDragon 热力图 轮廓线 标注 相关组件

// import OpenSeadragon from "openseadragon"
import { enableGeoTIFFTileSource } from "geotiff-tilesource";
// import h337 from "heatmap.js"
import h337 from '@sitka/heatmap.js'
import OpenSeadragon from 'openseadragon';
import { createOSDAnnotator } from '@annotorious/openseadragon';
import '@annotorious/openseadragon/annotorious-openseadragon.css'

import { mountPlugin as mountToolsPlugin } from "@annotorious/plugin-tools"
import { v4 as uuid } from "uuid"
import { ElMessage } from 'element-plus';
import { computed, ref, watch } from "vue";

import { insertAnno, getAnnos, updateAnno, Annodelete } from '../api/slice.js';
import { getHeatmapCurve } from '../api/slice.js';

import { useSliceDataStore } from '../stores/SiceDataStore.js'
import { storeToRefs } from 'pinia';

const SliceDataStore = useSliceDataStore()
const { curIndex } = storeToRefs(SliceDataStore)
const { getSliceList } = SliceDataStore
const sliceList = getSliceList();

// const options = ref({});//openSeaDragon参数变量
// 热力图数据
const heatMapData = ref(undefined);
// const otherHeatMapData = ref(undefined);
const curveData = ref(undefined);//轮廓线数据
const isNeed = ref(true);//是否需要更新热力图

const aiAnnotator = ref(null);

// 当前的SliceId，用于轮廓线监听函数的使用
const curId = ref(sliceList.value[curIndex.value].id);
// const sliceNo = ref(sliceList.value[curIndex.value].no.split('.')[1]);

// 监听curIndex的变化
watch(curIndex, (newIndex) => {
  curId.value = sliceList.value[newIndex].id;
  // sliceNo.value = sliceList.value[newIndex].no.split('.')[1];
  heatMapData.value = undefined;
  // otherHeatMapData.value = undefined;
  curveData.value = undefined;
  isNeed.value = true;
  // selectedAnno.value = null;
});

const curColor = ref(null);
//颜色列表,控制标注框的颜色
const colorMap = {
  // '类别1': '#FF0000', // 红色
  // '类别2': '#00FF00', // 绿色
  // '类别3': '#0000FF', // 蓝色
  // '类别4': '#FFFF00',
  'self-anno': '#FFFF00', //自由标注的颜色
  'AI-curve': '#FFFF00', //AI轮廓线的颜色
  default: '#FFAA00'// 默认颜色
};


// openSeaDragon---------------------------------------------------------------------------------------------------------
//初始化:
export function initOpenSeadragon(viewer) {
  // enableGeoTIFFTileSource(OpenSeadragon)
  // 配置详情见 https://blog.csdn.net/qq_30014557/article/details/123467521
  const options = ref({})
  options.value = {
    id: "open-sea-dragon",
    prefixUrl: "/images/",
    gestureSettingsMouse: {
      clickToZoom: false,
      dblClickToZoom: false
    },
    maxZoomPixelRatio: 5.0,//设置用户最大能够将图像放大为最大图像像素宽高的多少倍
    showNavigator: true,//基础控件的展示与隐藏
    showRotationControl: true,//显示左旋转和右旋转按钮，只有在支持的浏览器上才可以正常显示
    showFlipControl: true,//显示镜像翻转按钮
    showReferenceStrip: true,
    showSequenceControl: true, //显示向前向后按钮
    zoomPerScroll: 1.5,
    maxZoomLevel: 80,
    visibilityRatio: 0.5,//0-1之间，0代表图片可完全拖出显示框，1代表图片一点也不可以拖出
    constrainDuringPan: true,//官方未说明
    defaultZoomLevel: 0,//初始化放大倍率，默认为0，自动适应元素
    navigationControlAnchor: 'TOP_RIGHT',//导航栏位置
    navigatorMaintainSizeRatio: true,//当容器大小改变时，是否自动缩放导航图的大小
    navigatorSizeRatio: 0.2,//导航的大小与整体视图的比例
    navigatorOpacity: 0.8,////导航背景透明度
    navigatorAutoFade: true,//如果用户停止与视口交互，则淡化导航器迷你地图
    controlsFadeDelay: 2000,//停止交互多少秒后，隐藏导航栏
    navigatorRotate: true,//图像旋转时,导航地图同时旋转
    navigatorBorderColor: '#0074f8',//导航边框颜色
    navigatorDisplayRegionColor: '#4e8e2f',//导航栏当前查看区域的边框颜色
    navigatorHeight: '265px',
    navigatorWidth: '265px',
    //debugMode: true,//调试模式
    renderers: {
      type: 'webgl',
      options: {
        preserveDrawingBuffer: true
      }
    }
  }
  viewer = OpenSeadragon(options.value) //通过viewer进行展示
  return viewer;
}
//------------------------------------------------------------------------------------------------------------------------

//载入热力图的函数---------------------------------------------------------------------------------------------------------

// At module scope, add a variable to store the ResizeObserver
let heatmapResizeObserver = null;

//展示热力图:
export function displayHeatMap(viewer, heatMapVisible, needNewHeatMap, SliceData) {
  const overlayElement = document.getElementById('heatmap-overlay')
  if (overlayElement && !needNewHeatMap.value) {
    // 使用 requestAnimationFrame 来更新显示状态
    requestAnimationFrame(() => {
      overlayElement.style.opacity = heatMapVisible.value ? '1' : '0'
      if (heatMapVisible.value) {
        overlayElement.style.width = overlayElement.offsetWidth + 'px'   // 强制触发 resize 变化
        overlayElement.style.height = overlayElement.offsetHeight + 'px' // 改变大小
      } else {
        overlayElement.style.width = overlayElement.offsetWidth + 'px'   // 强制触发 resize 变化
        overlayElement.style.height = overlayElement.offsetHeight + 'px' // 改变大小
      }
    })
  } else {
    fetchHeatMapData(curId.value, needNewHeatMap).then(() => {
      if (heatMapData.value != null) {
        isNeed.value = loadHeatMap(viewer, needNewHeatMap)
      }
    })
  }
  return isNeed.value;
}

export function hiddenHeatMap(viewer) {
  const overlayElement = document.getElementById('heatmap-overlay')

  // Disconnect the observer before removing the overlay
  if (heatmapResizeObserver) {
    heatmapResizeObserver.disconnect();
    heatmapResizeObserver = null;
  }

  if (overlayElement) {
    overlayElement.style.opacity = '0'
  }
  // Remove the overlay from viewer
  if (overlayElement) {
    viewer.removeOverlay(overlayElement)
  }
}

/**
 * 显示只在轮廓线内的热力图
 * @param {Object} viewer - OpenSeadragon viewer对象
 * @param {Object} heatMapVisible - 热力图可见性状态
 * @param {Object} needNewHeatMap - 是否需要新的热力图
 * @param {Object || Array} contourData - 轮廓数据
 */
export async function displayFilteredHeatMap(viewer, heatMapVisible, needNewHeatMap, SliceData, displayData) {
  // const overlayElement = document.getElementById('heatmap-overlay');
  // 隐藏其他热力图
  hiddenHeatMap(viewer);
  // only one heatmap can be displayed at a time
  try {
    // 同时获取热力图和轮廓线数据
    await fetchHeatMapData(curId.value, needNewHeatMap);
    let contourData = curveData.value;

    // 如果没有轮廓数据，尝试获取
    if (!contourData || !contourData.pointList || contourData.pointList.length === 0) {
      await fetchCurveData(curId.value, curveData);
      // console.log('map before pointList:', curveData.value?.pointList);

      // 获取 DZI 图像的尺寸
      const dziWidth = SliceData.value.width;
      const dziHeight = SliceData.value.height;

      // 获取原 curve 的列数和行数
      const curveRows = curveData.value.curveRows;
      const curveCols = curveData.value.curveCols;

      // 将 curve 坐标映射到 DZI 图像的坐标系
      const mapToDziCoordinates = (x, y) => {
        return {
          x: (x / curveCols) * dziWidth,
          y: (y / curveRows) * dziHeight,
        };
      };

      // console.log('dziWidth:', dziWidth);
      // console.log('dziHeight:', dziHeight);
      // console.log('curveCols:', curveCols);
      // console.log('curveRows:', curveRows);

      curveData.value.pointList = curveData.value.pointList.map((items) => {
        // console.log('items:', items);
        return items.map(([x, y]) => {
          const mappedPoint = mapToDziCoordinates(x, y);
          return [mappedPoint.x, mappedPoint.y];
        });
      });

      contourData = curveData.value;

      // console.log('map after pointList:', contourData?.pointList);
    }

    if (heatMapData.value != null) {
      // 传入轮廓数据进行过滤
      isNeed.value = loadHeatMap(viewer, needNewHeatMap, contourData, displayData);
    }
  } catch (error) {
    console.error("加载热力图或轮廓数据失败", error);
  }

  return isNeed.value;
}

/**
 * 判断点是否在多边形内部
 * @param {Object} point - {x, y} 格式的点
 * @param {Array} polygon - [[x1,y1], [x2,y2], ...] 格式的多边形顶点数组
 * @return {boolean} - 点是否在多边形内部
 */
function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length === 0) return false;

  let inside = false;
  const x = point.x;
  const y = point.y;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

//获取后端热力图点集的数据:
async function fetchHeatMapData(sliceId, needNewHeatMap) {
  if (heatMapData.value === undefined || heatMapData.value === undefined || needNewHeatMap.value) {
    let res = await getHeatmapCurve(sliceId)
    heatMapData.value = res.heatmapData
    return Promise.resolve(heatMapData.value);
  } else {
    return Promise.resolve(heatMapData.value);
  }
}

// 加载热力图的图像
function loadHeatMap(viewer, needNewHeatMap, contourData = null, displayData = {}) {
  const overlay = {
    width: 1,
    height: parseInt(heatMapData.value.rows) / parseInt(heatMapData.value.cols),
    element: document.createElement('div'),
  }
  overlay.element.style.padding = '0px';
  overlay.element.id = 'heatmap-overlay';
  overlay.element.style.filter = 'blur(8px)';//整层加上高斯模糊
  viewer.addOverlay(overlay);

  const startWidth = overlay.element.offsetWidth;
  const startHeight = overlay.element.offsetHeight;
  const heatmapWidth = heatMapData.value.cols;
  const heatmapHeight = heatMapData.value.rows;
  const other = displayData.other;
  const displayObjc = displayData.displayObjc;
  const dataStr = other ? heatMapData.value.otherData : heatMapData.value.data;
  const heatmapMatrixData = JSON.parse(dataStr || '[]');
  //缩放级别
  const zoomLevel = viewer.viewport.getZoom(); 

  // 转换所有点的坐标，重复转化会导致热力图显示不正确
  for (let item of heatmapMatrixData) {
    item.x = Math.floor((item.x / heatmapWidth) * startWidth);
    item.y = Math.floor((item.y / heatmapHeight) * startHeight);
  }

  const { pointList: contours, curveRows, curveCols } = contourData || {};

  // Debug logging
  // console.log('Heatmap dimensions:', heatmapWidth, heatmapHeight);
  // console.log('Overlay dimensions:', startWidth, startHeight);
  // console.log('contour data:', contours, curveCols, curveRows);

  // 转换轮廓坐标系并筛选热力图点
  let filteredMatrixData = heatmapMatrixData;

  // 如果提供了轮廓数据，则只显示轮廓内的点
  if (contours && contours.length > 0) {
    // 转换多边形坐标到相同的坐标系
    const scaledPolygons = contours.map(polygon =>
      polygon.map(([x, y]) => [
        Math.floor((x / curveCols) * startWidth),
        Math.floor((y / curveRows) * startHeight)
      ])
    );

    // 过滤掉不在任何多边形内的点
    // filteredMatrixData = heatmapMatrixData.filter(point => {
    //   // 检查点是否在任何多边形内
    //   return scaledPolygons.some(polygon => isPointInPolygon(point, polygon));
    // });

    // console.log('scaledPolygons:', scaledPolygons);

    // console.log(`过滤前点数: ${heatmapMatrixData.length}, 过滤后点数: ${filteredMatrixData.length}`);
  }

  // console.log('heatmapMatrixData:', heatmapMatrixData);
  // console.log('filteredMatrixData:', filteredMatrixData);

  const heatmapInstance = h337.create({
    container: overlay.element,
    gradient: displayObjc.gradient,
    radius: Math.max(5, 10 / zoomLevel),  // 根据 zoomLevel 调整半径
    blur: 0.5,  // 降低模糊度，使边界清晰
    maxOpacity: 1.0, // 突出高亮病变区域
    minOpacity: 0.8  // 确保背景仍可见
  });

  // 使用过滤后的数据
  heatmapInstance.setData({
    max: 0.4,
    min: 0.1,
    data: filteredMatrixData,
  });

  heatmapInstance.repaint();

  // 添加观察者，处理界面变化时的缩放
  heatmapResizeObserver = new ResizeObserver(function (entries) {
    const canvasElement = document.getElementsByClassName('heatmap-canvas')[0];
    // console.log('canvasElement:', canvasElement);
    if (canvasElement) {
      if (canvasElement instanceof HTMLCanvasElement) {
        // 现在可以安全地使用 canvasElement 作为 HTMLCanvasElement
        canvasElement.getContext('2d', { willReadFrequently: true });
      } else {
        console.error("找不到 'heatmap-canvas' 的 HTMLCanvasElement 元素");
      }
      canvasElement.style.transform = `scale(${entries[0].contentRect.width / startWidth})`
      canvasElement.style.transformOrigin = '0 0'
      canvasElement.style.opacity = "0.95"
      canvasElement.style.filter = 'blur(6px)';
    }
  });

  heatmapResizeObserver.observe(overlay.element);
  overlay.element.style.opacity = "1";
  needNewHeatMap.value = false;
  return needNewHeatMap.value;
}
//------------------------------------------------------------------------------------------------------------------------


//轮廓线-------------------------------------------------------------------------------------------------------------------
//初始化轮廓线:
export function initAnno(anno, selectedAnno, selectedElement, commentVisible, commentValue, viewer) {
  //只有在有切片的时候才会初始化，因为这里用到了sliceId
  // https://annotorious.dev/api-reference/events/#selectionchanged
  anno.value = createOSDAnnotator(viewer, {
    drawingEnabled: false,
    autoSave: true,
    userSelectAction: "EDIT",
    style: (annotation, state) => {
      let opacity = 0
      if (state && state.selected)
        opacity = 0.3
      else if (state && state.hovered)
        opacity = 0.15
      //如果是新建的
      if (annotation.type == undefined) {
        annotation.type = 'self-anno'
      }
      curColor.value = colorMap[annotation.type] || colorMap.default;
  
      return {
        fill: curColor.value,
        fillOpacity: opacity,
        stroke: curColor.value,
        strokeOpacity: 1,
      }
    }
  })

  aiAnnotator.value = createOSDAnnotator(viewer, {
    drawingEnabled: false,
    autoSave: true,
    userSelectAction: "NONE",
  })

  // 更新选择的节点id (selectedAnno)
  anno.value.on('selectionChanged', (annotations) => {
    if (annotations.length === 0) {//目前选择的注解为空
      selectedAnno.value = ''
      commentVisible.value = false
      commentValue.value = ''
    } else {
      selectedAnno.value = annotations[0].id
      selectedElement.value = document.getElementsByClassName("a9s-annotation selected")[0]
      const bodies = anno.value.getAnnotationById(selectedAnno.value).bodies
      // console.log('selected Annotation:', anno.value.getAnnotationById(selectedAnno.value));
      if (Array.isArray(bodies) && bodies.length > 0) {
        commentValue.value = anno.value.getAnnotationById(selectedAnno.value).bodies[0].value
      }
      commentVisible.value = true
    }
  });

  // 创建节点的事件
  anno.value.on('createAnnotation', async (annotation) => {
    annotation.type = 'self-anno';
    annotation.bodies.push({
      id: 0,
      annotation: annotation.id,
      purpose: 'commenting',
      value: ''
    })
    // 解构 geometry，提取出 bounds，剩下的放入 rest
    const { bounds, ...rest } = annotation.target.selector.geometry;
    const data = {
      "sliceId": curId.value,
      "content": "", // 空字符串内容
      "maxX": bounds.maxX, // 赋值解构后的 bounds 属性
      "minX": bounds.minX,
      "minY": bounds.minY,
      "maxY": bounds.maxY,
      "type": annotation.target.selector.type, // 假设 selector 也有 type 属性
      "jsonData": {
        ...rest // 使用解构的 rest 来将 geometry 中剩下的属性动态放入 json
      }
    }
    try {
      // 使用 await 来等待 axios 请求完成
      const res = await insertAnno(data);
      annotation.bodies[0].id = res.data
    } catch (error) {
      // 捕获并处理请求中的错误
      console.error("请求失败", error);
      const removedAnnotation = anno.value.removeAnnotation(annotation.id);
    }
  });

  //更新节点的事件
  anno.value.on('updateAnnotation', (async (updated, previous) => {
    const tmp = updated;
    const { bounds, ...rest } = tmp.target.selector.geometry;
    const data = {
      "id": tmp.bodies[0].id,
      "sliceId": curId.value,
      "content": tmp.bodies[0].value, // 空字符串内容
      "maxX": bounds.maxX, // 赋值解构后的 bounds 属性
      "minX": bounds.minX,
      "minY": bounds.minY,
      "maxY": bounds.maxY,
      "type": tmp.target.selector.type,
      "jsonData": {
        ...rest // 使用解构的 rest 来将 geometry 中剩下的属性动态放入 json
      }
    }
    try {
      // 使用 await 来等待 axios 请求完成
      const res = await updateAnno(data);
      ElMessage.success("标注更新成功")

    } catch (error) {
      // 捕获并处理请求中的错误
      console.error("请求失败", error);
      // 保存失败,恢复原值
      anno.value.updateAnnotation(previous)
    }
    // setComment()
  }))

  mountToolsPlugin(anno.value)
}

//自由标注的轮廓线加载与展示:
export const displayUserCurve = async (usercurveVisible, anno) => {
  anno.value.clearAnnotations()
  aiAnnotator.value.clearAnnotations()
  if (usercurveVisible.value) {
    // 需要加载用户的标注
    await setupUserAnnotations(anno)
  }
}

// setup user annotations
export const setupUserAnnotations = async (anno) => {
  const params = {
    sliceId: curId.value,
  }
  const res = await getAnnos(params)
  // console.log('res:', res);
  const data = res.data
  if (data == null) { return }
  let newAnno = {}
  data.forEach((item) => {
    newAnno = {
      id: uuid(),
      type: 'self-anno', //通过类型映射到不同颜色,此处是用户自己标注的，自己标注的为一种颜色
      bodies: [{
        id: item.id,
        annotation: newAnno.id,
        purpose: 'commenting',
        value: item.content
      }],
      target: {
        selector: {
          type: "",
          geometry: {
            bounds: {
              maxX: item.maxX,
              minX: item.minX,
              maxY: item.maxY,
              minY: item.minY
            },
          }
        },
        creator: {
          id: "auto-display",
          isGuest: true,
        },
      }
    };
    // const jsonObjc = JSON.parse(item.jsonData)
    newAnno.target.selector.type = item.type
    // 解构 json 中的其他属性并设置到 geometry 中
    newAnno.target.selector.geometry = {
      ...newAnno.target.selector.geometry, // 保留已有的 bounds 等信息
      ...item.jsonData // 将 item.json 中的属性合并到 geometry 中
    };
    anno.value.addAnnotation(newAnno)
  })
}

//算法生成轮廓线的加载与展示:
export const displayAICurve = async (curveVisible, anno, SliceData) => {
  if (curveVisible.value) {
    anno.value.clearAnnotations()
    await fetchCurveData(curId.value, curveData).then(() => loadAIAnno(curveData.value, anno, SliceData))
  }
}

//获取轮廓线数据:
const fetchCurveData = async (sliceId, curveData) => {
  if (curveData.value === undefined)
    await getHeatmapCurve(sliceId).then((res) => {
      curveData.value = res.curveData;
    })
}

//展示算法的轮廓线:这个 uuid() 专门用于算法的解析结果展示(防止重复)
/**
 * UserSelectAction
 * @param {EDIT | SELECT | NONE} SelectAction 
 * @returns 
 */
const getNewAnnoTemplate = () => {
  return {
    id: uuid(),
    type: '', //通过类型映射到不同颜色
    target: {
      selector: {
        type: "POLYGON",
        geometry: {
          bounds: {},
          points: []
        }
      },
      creator: {
        id: "auto-display",
        isGuest: true,
      },
    }
  };
}

//加载AI轮廓线
function loadAIAnno(data, anno, SliceData) {
  if (data == null) {
    return;
  }
  anno.value.clearAnnotations()
  aiAnnotator.value.clearAnnotations()
  // 获取 DZI 图像的尺寸
  const dziWidth = SliceData.value.width;
  const dziHeight = SliceData.value.height;

  // 获取原 curve 的列数和行数
  const curveCols = data.curveCols;
  const curveRows = data.curveRows;

  // 将 curve 坐标映射到 DZI 图像的坐标系
  const mapToDziCoordinates = (x, y) => {
    return {
      x: (x / curveCols) * dziWidth,
      y: (y / curveRows) * dziHeight,
    };
  };

  data.pointList.forEach((point, index) => {
    const newAnno = getNewAnnoTemplate("NONE")
    // 遍历 points 列表并转换每个点的坐标
    const geometryPoints = point.map(([x, y]) => {
      const mappedPoint = mapToDziCoordinates(x, y);
      return [mappedPoint.x, mappedPoint.y];
    })
    // console.log('geometryPoints:', geometryPoints);

    newAnno.target.selector.geometry.points = geometryPoints;
    const values = data.max_min_values[index]
    // 将每个值转换为数字
    data.max_min_values[index].minY = parseFloat(values.minY);
    data.max_min_values[index].minX = parseFloat(values.minX);
    data.max_min_values[index].maxY = parseFloat(values.maxY);
    data.max_min_values[index].maxX = parseFloat(values.maxX);
    // 使用映射后的坐标更新 min/max 值
    const minCoords = mapToDziCoordinates(values.minX, values.minY);
    const maxCoords = mapToDziCoordinates(values.maxX, values.maxY);
    data.max_min_values[index].minX = minCoords.x;
    data.max_min_values[index].minY = minCoords.y;
    data.max_min_values[index].maxX = maxCoords.x;
    data.max_min_values[index].maxY = maxCoords.y;

    //设置anno的类型，用于标注框颜色:
    newAnno.type = "AI-curve";
    newAnno.target.selector.geometry.bounds = data.max_min_values[index]
    aiAnnotator.value.addAnnotation(newAnno)
  })
}

//轮廓线的增删改查:
//关闭绘制:
export const drawAnnoRectangle = (shape, viewer, anno) => {
  if (shape != '') {
    viewer.panHorizontal = false
    viewer.panVertical = false
    anno.value.setDrawingEnabled(true)
    anno.value.setDrawingTool(shape)
  } else {
    viewer.panHorizontal = true
    viewer.panVertical = true
    anno.value.setDrawingEnabled(false)
  }
}

//删除轮廓线:
export const deleteAnno = async (anno, selectedAnno) => {
  if (selectedAnno.value == '') {
    ElMessage.error("未选择要删除的标注")
    return
  }
  const tmp = anno.value.getAnnotationById(selectedAnno.value)
  const data = {
    "id": tmp.bodies[0].id,
  }
  try {
    const res = await Annodelete(data);
    anno.value.removeAnnotation(selectedAnno.value)
    selectedAnno.value = ''
    ElMessage.success("批注删除成功")
  }
  catch (error) {
    console.error("删除请求失败", error);
  }
}

//保存用户批注:
export const SaveUserAnnotation = async (anno, commentValue, selectedAnno, sliceId, commentVisible) => {
  const tmp = anno.value.getAnnotationById(selectedAnno.value)
  const beforeValue = tmp.bodies[0].value
  const { bounds, ...rest } = tmp.target.selector.geometry;
  const data = {
    "id": tmp.bodies[0].id,
    "sliceId": sliceId,
    "content": commentValue.value, // 空字符串内容
    "maxX": bounds.maxX, // 赋值解构后的 bounds 属性
    "minX": bounds.minX,
    "minY": bounds.minY,
    "maxY": bounds.maxY,
    "type": tmp.target.selector.type, // 假设 selector 也有 type 属性
    "jsonData": {
      ...rest // 使用解构的 rest 来将 geometry 中剩下的属性动态放入 json
    }
  }
  try {
    // 使用 await 来等待 axios 请求完成s
    const res = await updateAnno(data);
    tmp.bodies[0].value = commentValue.value
    anno.value.updateAnnotation(tmp)
    commentVisible.value = false
    ElMessage.success("批注保存成功")

  } catch (error) {
    // 捕获并处理请求中的错误
    console.error("请求失败", error);
    // 保存失败,恢复原值
    commentValue.value = beforeValue
    // const removedAnnotation = anno.removeAnnotation(annotation.id);
  }
}


//细胞学的小细胞轮廓线的展示与旧的小细胞轮廓线的移除:
export const displayCellCurve = async (viewer, oldVal, newVal, cellList, CellCurveList, SliceData, anno) => {
  //展示当前所选的细胞
  anno.value.setDrawingEnabled(false);//不允许绘制
  // 1.筛选出在old中但不在new中的细胞ID 2.筛选出在new中但不在old中的细胞 ID
  const removedCellsOnly = oldVal.filter(cellId => !newVal.includes(cellId));
  const newCellsOnly = newVal.filter(cellId => !oldVal.includes(cellId));

  // 筛选出在 newCellsOnly 中并且不在 CellCurveList 里的细胞
  const filteredCellList = cellList.value
    .flatMap(item => item.cellList)
    .filter(cell =>
      newCellsOnly.includes(cell.id) &&
      !CellCurveList.value.some(storedCell => storedCell.id === cell.id)
    );

  if (filteredCellList.length != 0) { //有新添加的细胞
    createNewAnno(viewer, filteredCellList, SliceData, CellCurveList, anno) //构建新的小细胞的轮廓线
  }

  //添加和移除[不同类别的细胞设置不同的颜色]:
  const filteredNewAnnots = CellCurveList.value.filter(item => newCellsOnly.includes(item.id));

  filteredNewAnnots.forEach(item => {
    //添加:
    anno.value.addAnnotation(item.anno);
  });
  const filteredOldAnnots = CellCurveList.value.filter(item => removedCellsOnly.includes(item.id));
  filteredOldAnnots.forEach(item => {
    anno.value.removeAnnotation(item.anno);
  });

  //只有一个细胞需要展示，则需要平移和缩放到该细胞的视角上:
  if (newVal.length == 1) {
    const targetItem = CellCurveList.value.find(item => item.id === newVal[0]);
    moveToCoordinates(viewer, targetItem.center, targetItem.zoomScale);
  } else {
    //恢复原始比例
    viewer.viewport.goHome();
  }
}

//创建还未创建的细胞的轮廓线:
function createNewAnno(viewer, data, SliceData, CellCurveList, anno) {
  // 获取 DZI 图像的尺寸
  const dziWidth = SliceData.value.dzi.width;
  const dziHeight = SliceData.value.dzi.height;
  // 获取原 curve 的列数和行数
  const curveCols = data[0].rows;
  const curveRows = data[0].cols;
  // 将 curve 坐标映射到 DZI 图像的坐标系
  const mapToDziCoordinates = (x, y) => {
    return {
      x: (x / curveCols) * dziWidth,
      y: (y / curveRows) * dziHeight,
    };
  };
  data.forEach((item) => {
    const newAnno = getNewAnnoTemplate();
    // 创建并映射 points 列表
    const points = [[item.minX, item.minY], [item.maxX, item.minY], [item.maxX, item.maxY], [item.minX, item.maxY]];  // 假设每个 item 只有 min 和 max 点
    newAnno.target.selector.geometry.points = points.map(([x, y]) => {
      const mappedPoint = mapToDziCoordinates(x, y);
      return [mappedPoint.x, mappedPoint.y];
    });

    // 转换 min/max 值
    const minCoords = mapToDziCoordinates(item.minX, item.minY);
    const maxCoords = mapToDziCoordinates(item.maxX, item.maxY);
    // 更新数据中的 minX, minY, maxX, maxY
    const mappedBounds = {
      minX: minCoords.x,
      minY: minCoords.y,
      maxX: maxCoords.x,
      maxY: maxCoords.y
    };

    // 设置 newAnno 的 bounds
    newAnno.target.selector.geometry.bounds = mappedBounds;

    //计算缩放比例:
    const contourWidth = maxCoords.x - minCoords.x;
    const contourHeight = maxCoords.y - minCoords.y;
    const widthRatio = contourWidth / dziWidth;
    const heightRatio = contourHeight / dziHeight;
    const zoomScale = Math.max(1, 1 / (Math.max(Math.abs(widthRatio), Math.abs(heightRatio)) * 2))

    //计算viewer中对应的中心点坐标:
    const viewportCenter = viewer.viewport.imageToViewportCoordinates((mappedBounds.minX + mappedBounds.maxX) / 2, (mappedBounds.minY + mappedBounds.maxY) / 2);

    //设置anno的类型，用于标注框颜色:
    newAnno.type = item.type;

    // 添加到 CellCurveList 中
    CellCurveList.value.push({ id: item.id, anno: newAnno, center: viewportCenter, zoomScale: zoomScale });

  })
}

//实现视角的移动和缩放:
const moveToCoordinates = (viewer, center, zoomScale) => {
  if (viewer) {
    // 移动和缩放:
    viewer.viewport.panTo(center)
    viewer.viewport.zoomTo(zoomScale) //缩放倍数还需要优化
  } else {
    console.warn("Viewer未被初始化!");
  }
};


//------------------------------------------------------------------------------------------------------------------------