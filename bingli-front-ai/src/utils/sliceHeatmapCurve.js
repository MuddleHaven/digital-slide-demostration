//热力图和轮廓线相关功能

import h337 from '@sitka/heatmap.js';
import { ref, watch } from "vue";
import { getHeatmapCurve } from '../api/slice.js';
import { useSliceDataStore } from '../stores/SiceDataStore.js';
import { storeToRefs } from 'pinia';
import { v4 as uuid } from "uuid";

import { Deck, COORDINATE_SYSTEM, log } from '@deck.gl/core';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

// log.level = 3; // 设置日志级别

const SliceDataStore = useSliceDataStore();
const { curIndex } = storeToRefs(SliceDataStore);
const { getSliceList } = SliceDataStore;
const sliceList = getSliceList();

// 热力图数据
const heatMapData = ref(undefined);
// 轮廓线数据
const curveData = ref(undefined);
// 子轮廓线数据
const subCurveData = ref(undefined);

const isNeed = ref(true); // 是否需要更新热力图

// 当前的SliceId，用于轮廓线监听函数的使用
const curId = ref(sliceList.value[curIndex.value].id);

// 监听curIndex的变化
watch(curIndex, (newIndex) => {
  curId.value = sliceList.value[newIndex].id;
  heatMapData.value = undefined;
  curveData.value = undefined;
  isNeed.value = true;
});

// At module scope, add a variable to store the ResizeObserver
let heatmapResizeObserver = null;
/**
 * @type {OpenSeadragon.Viewer}
 */
export async function displayDeckGLHeatMap(viewer, heatMapVisible, needNewHeatMap, displayData) {
  hiddenHeatMap(viewer);
  curId.value = sliceList.value[curIndex.value].id;
  heatMapData.value = undefined;

  await fetchHeatMapData(curId.value, ref(true));
  // const overlay = {
  //   element: heatMapCanvs,
  //   width: 1, height: parseInt(heatMapData.value.rows) / parseInt(heatMapData.value.cols)
  // }


  const elementDiv = document.createElement('div');
  const overlay = {
    width: 1,
    height: parseInt(heatMapData.value.rows) / parseInt(heatMapData.value.cols),
    element: elementDiv,
  };

  elementDiv.style.padding = '0px';
  elementDiv.id = 'heatmap-overlay-div';
  elementDiv.style.filter = 'blur(8px)';
  elementDiv.style.opacity = "1";
  elementDiv.style.width = "100%";
  elementDiv.style.height = "100%";
  elementDiv.style.pointerEvents = "none"; // 让鼠标事件透传到底层
  viewer.addOverlay(overlay);

  const startWidth = elementDiv.offsetWidth;
  const startHeight = elementDiv.offsetHeight;
  const heatmapWidth = heatMapData.value.cols;
  const heatmapHeight = heatMapData.value.rows;
  const other = displayData.other;
  const displayObjc = displayData.displayObjc || { gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' } };
  const dataStr = other ? heatMapData.value.otherData : heatMapData.value.data;
  const heatmapMatrixData = JSON.parse(dataStr || '[]');

  // log
  // console.log("heatmapWidth", heatmapWidth, "heatmapHeight", heatmapHeight);
  // console.log("startWidth", startWidth, "startHeight", startHeight);

  // const data = heatMapData.value.data;
  // const dataArr = JSON.parse(data);
  // console.log("heatMapCanvs", heatMapCanvs);
  //转化x y

  /** @type {OpenSeadragon.TileSource} */
  const tiledImage = viewer.world.getItemAt(0); // 获取第一张图片
  const imageWidth = tiledImage.getContentSize().x;
  const imageHeight = tiledImage.getContentSize().y;

  // console.log("imageWidth", imageWidth, "imageHeight", imageHeight);

  // for (let item of heatmapMatrixData) {
  //   item.x = (item.x / heatmapWidth) * startWidth; // 转换到 OpenSeadragon 坐标
  //   item.y = (item.y / heatmapHeight) * startHeight;
  // }

  const heatmapArr = heatmapMatrixData.map(v => {
    return {
      position: [v.x, v.y],
      weight: v.value
    };
  });

  // console.log("heatmapMatrixData", heatmapMatrixData);
  // console.log("heatmapArr", heatmapArr);

  const heatmapLayer = new HeatmapLayer({
    id: 'heatmap-overlay',
    data: heatmapArr,
    getPosition: d => d.position,
    getWeight: d => d.weight,
    opacity: 0.8,
    radiusPixels: 30,
    intensity: 5,
    getFillColor: [255, 0, 0], // 红色点
  });

  const zoomLevel = viewer.viewport.getZoom();

  const deck = new Deck({
    parent: elementDiv,
    // width: viewer.container.clientWidth,
    // height: viewer.container.clientHeight,
    layers: [heatmapLayer],
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, // **使用像素坐标系**
    controller: false,
    // debug: true,
  });

  // 添加观察者，处理界面变化时的缩放
  heatmapResizeObserver = new ResizeObserver(function (entries) {
    const canvasElement = elementDiv.getElementsByTagName('canvas')[0];
    // console.log("canvasElement", canvasElement);

    if (canvasElement) {
      if (canvasElement instanceof HTMLCanvasElement) {
        // 现在可以安全地使用 canvasElement 作为 HTMLCanvasElement
        canvasElement.getContext('2d', { willReadFrequently: true });
      } else {
        console.error("找不到 'heatmap-canvas' 的 HTMLCanvasElement 元素");
      }
      canvasElement.style.transform = `scale(${entries[0].contentRect.width / startWidth})`;
      canvasElement.style.transformOrigin = '0 0';
      canvasElement.style.opacity = "0.95";
      canvasElement.style.filter = 'blur(6px)';
      console.log("canvasElement transform", canvasElement.style);
    }
  });

  heatmapResizeObserver.observe(viewer.container);
  elementDiv.style.opacity = "1";
  needNewHeatMap.value = false;
  // viewer.forceRedraw();
  return needNewHeatMap.value;
}

/**
 * @type {OpenSeadragon.Viewer}
 */
export function hiddenHeatMap(viewer) {
  const overlayElement = document.getElementById('heatmap-overlay-div');

  const heatmapElement = document.getElementById('heatmap-overlay');
  if (heatmapElement) {
    viewer.removeOverlay(heatmapElement);
    heatmapElement.opacity = '0';
  }

  // Disconnect the observer before removing the overlay
  if (heatmapResizeObserver) {
    heatmapResizeObserver.disconnect();
    heatmapResizeObserver = null;
  }
  // Remove the overlay from viewer
  if (overlayElement) {
    overlayElement.style.opacity = '0';
    viewer.removeOverlay(overlayElement);
  }
}

/**
 * 显示只在轮廓线内的热力图
 * @param {Object} viewer - OpenSeadragon viewer对象
 * @param {Object} heatMapVisible - 热力图可见性状态
 * @param {Object} needNewHeatMap - 是否需要新的热力图
 * @param {Object} SliceData - 切片数据
 * @param {Object} displayData - 显示配置
 */
export async function displayFilteredHeatMap(viewer, heatMapVisible, needNewHeatMap, SliceData, displayData) {
  // 隐藏其他热力图
  hiddenHeatMap(viewer);

  curId.value = sliceList.value[curIndex.value].id;
  heatMapData.value = undefined;
  try {
    // 同时获取热力图和轮廓线数据
    await fetchHeatMapData(curId.value, needNewHeatMap);
    const { other } = displayData;
    // let contourPointArr =  other ? subCurveData.value : curveData.value;
    let contourData = other ? subCurveData.value : curveData.value;

    // console.log("contourData", contourData);

    // 如果没有轮廓数据，尝试获取
    if (!contourData || !contourData.pointList || contourData.pointList.length === 0) {
      await fetchCurveData(curId.value);

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

      const pointData = other ? subCurveData.value : curveData.value;

      const arr = pointData.pointList.map((items) => {
        return items.map(([x, y]) => {
          const mappedPoint = mapToDziCoordinates(x, y);
          return [mappedPoint.x, mappedPoint.y];
        });
      });

      contourData = {
        ...pointData,
        pointList: arr,
      };
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

// 加载热力图的图像
function loadHeatMap(viewer, needNewHeatMap, contourData = null, displayData = {}) {
  const elementDiv = document.createElement('div');
  const overlay = {
    width: 1,
    height: parseInt(heatMapData.value.rows) / parseInt(heatMapData.value.cols),
    element: elementDiv,
  };


  // 缩放级别
  const zoomLevel = viewer.viewport.getZoom();

  elementDiv.style.padding = '0px';
  elementDiv.id = 'heatmap-overlay';
  elementDiv.style.filter = 'blur(8px)'; // 整层加上高斯模糊
  viewer.addOverlay(overlay);

  const startWidth = elementDiv.offsetWidth/ zoomLevel;
  const startHeight = elementDiv.offsetHeight / zoomLevel;

  // console.log(elementDiv, "startWidth", startWidth, "startHeight", startHeight);

  const heatmapWidth = heatMapData.value.cols;
  const heatmapHeight = heatMapData.value.rows;
  const other = displayData.other;
  const displayObjc = displayData.displayObjc || { gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' } };
  const dataStr = other ? heatMapData.value.otherData : heatMapData.value.data;
  const heatmapMatrixData = JSON.parse(dataStr || '[]');


  // 转换所有点的坐标，重复转化会导致热力图显示不正确
  for (let item of heatmapMatrixData) {
    item.x = Math.floor((item.x / heatmapWidth) * startWidth);
    item.y = Math.floor((item.y / heatmapHeight) * startHeight);
  }

  const { pointList: contours, curveRows, curveCols } = contourData || {};

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
    filteredMatrixData = heatmapMatrixData.filter(point => {
      // 检查点是否在任何多边形内
      return scaledPolygons.some(polygon => isPointInPolygon(point, polygon));
    });
  }

  const heatmapInstance = h337.create({
    container: elementDiv,
    gradient: displayObjc.gradient,
    radius: 10,
    blur: 0.5,  // 降低模糊度，使边界清晰
    maxOpacity: 1.0,
    minOpacity: 0.8,
    border: 0.5
  });

  // 使用过滤后的数据
  heatmapInstance.setData({
    max: 0.5,
    min: 0.1,
    data: filteredMatrixData,
  });

  heatmapInstance.repaint();

  // log
  // console.log("heatmapWidth", heatmapWidth, "heatmapHeight", heatmapHeight);
  // console.log("startWidth", startWidth, "startHeight", startHeight);
  // console.log("data", heatmapMatrixData);

  // 添加观察者，处理界面变化时的缩放
  heatmapResizeObserver = new ResizeObserver(function (entries) {
    const canvasElement = document.getElementsByClassName('heatmap-canvas')[0];
    if (canvasElement) {
      if (canvasElement instanceof HTMLCanvasElement) {
        // 现在可以安全地使用 canvasElement 作为 HTMLCanvasElement
        canvasElement.getContext('2d', { willReadFrequently: true });
      } else {
        console.error("找不到 'heatmap-canvas' 的 HTMLCanvasElement 元素");
      }
      canvasElement.style.transform = `scale(${entries[0].contentRect.width / startWidth})`;
      canvasElement.style.transformOrigin = '0 0';
      canvasElement.style.opacity = "0.95";
      canvasElement.style.filter = 'blur(6px)';
    }
  });

  heatmapResizeObserver.observe(elementDiv);
  elementDiv.style.opacity = "1";
  needNewHeatMap.value = false;
  return needNewHeatMap.value;
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
  // console.log("fetchHeatMapData", sliceId, needNewHeatMap, sliceList);
  if (heatMapData.value === undefined || needNewHeatMap.value) {
    let res = await getHeatmapCurve(sliceId);
    heatMapData.value = res.heatmapData;
    curveData.value = res.curveData;
    subCurveData.value = res.subCurveData;
    return Promise.resolve(heatMapData.value);
  } else {
    return Promise.resolve(heatMapData.value);
  }
}

//获取轮廓线数据:
export async function fetchCurveData(sliceId) {
  await getHeatmapCurve(sliceId).then((res) => {
    heatMapData.value = res.heatmapData;
    curveData.value = res.curveData;
    subCurveData.value = res.subCurveData;
    return Promise.resolve();
  });
}

//展示算法的轮廓线:这个 uuid() 专门用于算法的解析结果展示(防止重复)
/**
 * UserSelectAction
 * @param {EDIT | SELECT | NONE} SelectAction 
 * @returns 
 */
export const getNewAnnoTemplate = () => {
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
};

//加载AI轮廓线
export function loadAIAnno(data, anno, SliceData) {
  if (data == null) {
    return;
  }
  anno.value.clearAnnotations();
  if (anno.value.aiAnnotator) { anno.value.aiAnnotator.clearAnnotations(); }

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

  // console.log("curveData", curveCols, curveRows, data.pointList);
  // console.log("dzi data", dziWidth, dziHeight);

  data.pointList.forEach((point, index) => {
    const newAnno = getNewAnnoTemplate("NONE");
    // 遍历 points 列表并转换每个点的坐标
    const geometryPoints = point.map(([x, y]) => {
      const mappedPoint = mapToDziCoordinates(x, y);
      return [mappedPoint.x, mappedPoint.y];
    });

    newAnno.target.selector.geometry.points = geometryPoints;
    const values = data.max_min_values[index];
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
    newAnno.target.selector.geometry.bounds = data.max_min_values[index];

    if (anno.value.aiAnnotator) {
      anno.value.aiAnnotator.addAnnotation(newAnno);
    }
  });
}

//算法生成轮廓线的加载与展示:
export const displayAICurve = async (curveVisible, anno, SliceData, displayData) => {
  curId.value = sliceList.value[curIndex.value].id;
  curveData.value = undefined;
  subCurveData.value = undefined;
  if (curveVisible) {
    await fetchCurveData(curId.value).then(() => {
      const other = displayData.other;
      const data = other ? subCurveData.value : curveData.value;
      loadAIAnno(data, anno, SliceData)
    });
  }
};