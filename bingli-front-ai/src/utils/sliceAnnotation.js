//标注相关功能
import { createOSDAnnotator } from '@annotorious/openseadragon';
// import * as annotorious from '@recogito/annotorious-openseadragon';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { mountPlugin as mountToolsPlugin } from "@annotorious/plugin-tools";
import { ElMessage } from 'element-plus';
import { ref } from "vue";
import { insertAnno, getAnnos, updateAnno, Annodelete } from '../api/slice.js';
import { useSliceDataStore } from '../stores/SiceDataStore.js';
import { storeToRefs } from 'pinia';
import { v4 as uuid } from "uuid";

const SliceDataStore = useSliceDataStore();
const { curIndex } = storeToRefs(SliceDataStore);
const { getSliceList } = SliceDataStore;
const sliceList = getSliceList();

// 当前的SliceId，用于轮廓线监听函数的使用
const curId = ref(sliceList.value[curIndex.value].id);

// 监听curIndex的变化
// (注意: 这部分需要保持在SliceDisplay.js中，因为它可能会影响其他功能)

// AI Annotator reference
// const aiAnnotator = ref(null);

const curColor = ref(null);
//颜色列表,控制标注框的颜色
const colorMap = {
  'self-anno': '#FFFF00', //自由标注的颜色
  'AI-curve': '#FFFF00', //AI轮廓线的颜色
  default: '#FFAA00'// 默认颜色
};

//初始化轮廓线:
export function initAnno(anno, selectedAnno, selectedElement, commentVisible, commentValue, viewer) {
  // console.log("initAnno", annotorious);
  // const createOSDAnnotator = annotorious.default;
  // console.log("initAnno", createOSDAnnotator);

  const aiAnnotator = createOSDAnnotator(viewer, {
    drawingEnabled: false,
    autoSave: true,
    userSelectAction: "NONE",
  });

  //只有在有切片的时候才会初始化，因为这里用到了sliceId
  // https://annotorious.dev/api-reference/events/#selectionchanged
  anno.value = createOSDAnnotator(viewer, {
    drawingEnabled: false,
    autoSave: true,
    userSelectAction: "EDIT",
    style: (annotation, state) => {
      let opacity = 0;
      if (state && state.selected)
        opacity = 0.3;
      else if (state && state.hovered)
        opacity = 0.15;
      //如果是新建的
      if (annotation.type == undefined) {
        annotation.type = 'self-anno';
      }
      curColor.value = colorMap[annotation.type] || colorMap.default;

      return {
        fill: curColor.value,
        fillOpacity: opacity,
        stroke: curColor.value,
        strokeOpacity: 1,
      };
    }
  });

  // 设置anno的aiAnnotator引用
  anno.value.aiAnnotator = aiAnnotator;

  // 更新选择的节点id (selectedAnno)
  anno.value.on('selectionChanged', (annotations) => {
    try {
      if (annotations.length === 0) {//目前选择的注解为空
        selectedAnno.value = '';
        commentVisible.value = false;
        commentValue.value = '';
      } else {
        selectedAnno.value = annotations[0].id;
        selectedElement.value = document.getElementsByClassName("a9s-annotation selected")[0];
        const bodies = anno.value.getAnnotationById(selectedAnno.value).bodies;
        // console.log('selected Annotation:', anno.value.getAnnotationById(selectedAnno.value));
        if (Array.isArray(bodies) && bodies.length > 0) {
          commentValue.value = anno.value.getAnnotationById(selectedAnno.value).bodies[0].value;
        }
        commentVisible.value = true;
      }
    } catch (error) {
      console.error("Error in selectionChanged event:", error);
    }
  });

  // 创建节点的事件
  anno.value.on('createAnnotation', async (annotation) => {
    try {
      annotation.type = 'self-anno';
      annotation.bodies.push({
        annotation: annotation.id,
        purpose: 'commenting',
        value: '',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });
      // console.log('createAnnotation annotation:', annotation);

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
      };

      // 使用 await 来等待 axios 请求完成
      const res = await insertAnno(data);
      // 将返回的 id 设置到 annotation 的 bodies[0].id 中
      annotation.bodies[0].id = res.data;
    } catch (error) {
      // 捕获并处理请求中的错误
      // console.error("请求失败", error);
      if (anno.value) {
        anno.value.removeAnnotation(annotation.id);
      }
    }
  });

  //更新节点的事件
  anno.value.on('updateAnnotation', (async (updated, previous) => {
    try {
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
      };

      // 使用 await 来等待 axios 请求完成
      const res = await updateAnno(data);
      ElMessage.success("标注更新成功");
    } catch (error) {
      // 捕获并处理请求中的错误
      console.error("请求失败", error);
      // 保存失败,恢复原值
      if (anno.value) {
        anno.value.updateAnnotation(previous);
      }
    }
  }));

  mountToolsPlugin(anno.value);
}

//自由标注的轮廓线加载与展示:
export const displayUserCurve = async (usercurveVisible, anno) => {
  try {
    if (!anno.value) return;
    curId.value = sliceList.value[curIndex.value].id;
    anno.value.clearAnnotations();
    if (anno.value.aiAnnotator) {
      anno.value.aiAnnotator.clearAnnotations();
    }

    if (usercurveVisible.value) {
      // 需要加载用户的标注
      await setupUserAnnotations(anno);
    }
  } catch (error) {
    console.error("Error in displayUserCurve:", error);
  }
};

// setup user annotations
export const setupUserAnnotations = async (anno) => {
  try {
    const params = {
      sliceId: curId.value,
    };
    const res = await getAnnos(params);
    // console.log('res:', res);
    const data = res.data;
    if (data == null) { return; }

    data.forEach((item) => {
      let newAnno = {
        id: uuid(),
        type: 'self-anno', //通过类型映射到不同颜色,此处是用户自己标注的，自己标注的为一种颜色
        bodies: [{
          id: item.id,
          annotation: uuid(),
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

      newAnno.bodies[0].annotation = newAnno.id;
      newAnno.target.selector.type = item.type;
      // 解构 json 中的其他属性并设置到 geometry 中
      newAnno.target.selector.geometry = {
        ...newAnno.target.selector.geometry, // 保留已有的 bounds 等信息
        ...item.jsonData // 将 item.json 中的属性合并到 geometry 中
      };

      anno.value.addAnnotation(newAnno);
    });
  } catch (error) {
    console.error("Error in setupUserAnnotations:", error);
  }
};

//轮廓线的增删改查:
//关闭绘制:
export const drawAnnoRectangle = (shape, viewer, anno) => {
  try {
    if (!anno.value) return;
    if (anno.value.aiAnnotator) {anno.value.aiAnnotator.setDrawingEnabled(false);}
    if (shape != '') {
      viewer.panHorizontal = false;
      viewer.panVertical = false;
      anno.value.setDrawingEnabled(true);
      anno.value.setDrawingTool(shape);
    } else {
      viewer.panHorizontal = true;
      viewer.panVertical = true;
      anno.value.setDrawingEnabled(false);
    }
  } catch (error) {
    console.error("Error in drawAnnoRectangle:", error);
  }
};

//删除轮廓线:
export const deleteAnno = async (anno, selectedAnno) => {
  try {
    if (selectedAnno.value == '') {
      ElMessage.error("未选择要删除的标注");
      return;
    }

    const tmp = anno.value.getAnnotationById(selectedAnno.value);
    const data = {
      "id": tmp.bodies[0].id,
    };

    const res = await Annodelete(data);
    anno.value.removeAnnotation(selectedAnno.value);
    selectedAnno.value = '';
    ElMessage.success("批注删除成功");
  } catch (error) {
    console.error("删除请求失败", error);
    ElMessage.error("删除失败，请重试");
  }
};

//保存用户批注:
export const SaveUserAnnotation = async (anno, commentValue, selectedAnno, sliceId, commentVisible) => {
  const tmp = anno.value.getAnnotationById(selectedAnno.value);
  const beforeValue = tmp.bodies[0].value;
  const { bounds, ...rest } = tmp.target.selector.geometry;
  const data = {
    "id": tmp.bodies[0].id,
    "sliceId": sliceId,
    "content": commentValue.value,
    "maxX": bounds.maxX,
    "minX": bounds.minX,
    "minY": bounds.minY,
    "maxY": bounds.maxY,
    "type": tmp.target.selector.type,
    "jsonData": {
      ...rest
    }
  };
  try {

    // 使用 await 来等待 axios 请求完成
    const res = await updateAnno(data);
    tmp.bodies[0].value = commentValue.value;
    anno.value.updateAnnotation(tmp);
    commentVisible.value = false;
    ElMessage.success("批注保存成功");
  } catch (error) {
    // 捕获并处理请求中的错误
    console.error("请求失败", error);
    // 保存失败,恢复原值
    commentValue.value = beforeValue;
    ElMessage.error("保存失败，请重试");
  }
};

//细胞学的小细胞轮廓线的展示与旧的小细胞轮廓线的移除:
export const displayCellCurve = async (viewer, oldVal, newVal, cellList, CellCurveList, SliceData, anno) => {
  try {
    //展示当前所选的细胞
    anno.value.setDrawingEnabled(false); // 不允许绘制
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

    if (filteredCellList.length != 0) { // 有新添加的细胞
      createNewAnno(viewer, filteredCellList, SliceData, CellCurveList, anno); // 构建新的小细胞的轮廓线
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
  } catch (error) {
    console.error("Error in displayCellCurve:", error);
  }
};

//创建还未创建的细胞的轮廓线:
function createNewAnno(viewer, data, SliceData, CellCurveList, anno) {
  try {
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
      const zoomScale = Math.max(1, 1 / (Math.max(Math.abs(widthRatio), Math.abs(heightRatio)) * 2));

      //计算viewer中对应的中心点坐标:
      const viewportCenter = viewer.viewport.imageToViewportCoordinates((mappedBounds.minX + mappedBounds.maxX) / 2, (mappedBounds.minY + mappedBounds.maxY) / 2);

      //设置anno的类型，用于标注框颜色:
      newAnno.type = item.type;

      // 添加到 CellCurveList 中
      CellCurveList.value.push({ id: item.id, anno: newAnno, center: viewportCenter, zoomScale: zoomScale });
    });
  } catch (error) {
    console.error("Error in createNewAnno:", error);
  }
}

//实现视角的移动和缩放:
const moveToCoordinates = (viewer, center, zoomScale) => {
  try {
    if (viewer) {
      // 移动和缩放:
      viewer.viewport.panTo(center);
      viewer.viewport.zoomTo(zoomScale); //缩放倍数还需要优化
    } else {
      console.warn("Viewer未被初始化!");
    }
  } catch (error) {
    console.error("Error in moveToCoordinates:", error);
  }
};

//展示算法的轮廓线:这个 uuid() 专门用于算法的解析结果展示(防止重复)
/**
 * 创建新的标注模板
 * @returns {Object} 标注模板对象
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
};

//加载AI轮廓线
export function loadAIAnno(data, anno, SliceData) {
  try {
    if (data == null) {
      return;
    }

    anno.value.clearAnnotations();
    if (anno.value.aiAnnotator) {
      anno.value.aiAnnotator.clearAnnotations();
      anno.value.aiAnnotator.setDrawingEnabled(false);
    }

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
      const newAnno = getNewAnnoTemplate();
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
      } else {
        anno.value.addAnnotation(newAnno);
      }
    });
  } catch (error) {
    console.error("Error in loadAIAnno:", error);
  }
}
