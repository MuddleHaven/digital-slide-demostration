/**
 * 质量控制轮廓相关功能
 * 使用 @annotorious/openseadragon 实现质量控制轮廓的显示和管理
 */

import { createOSDAnnotator } from '@annotorious/openseadragon';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { v4 as uuid } from "uuid";

// 质量类型颜色映射
const qualityColorMap = {
  'quality-1': '#FF4D4F',    // 染色差异 - 红色
  'quality-2': '#FF7A45',    // 折叠 - 橙红色  
  'quality-3': '#FFA940',    // 裂痕（划痕） - 橙色
  'quality-4': '#FFEC3D',    // 组织缺失 - 黄色
  'quality-5': '#BAE637',    // 厚薄不均 - 黄绿色
  'quality-6': '#52C41A',    // 切片污染 - 绿色
  'quality-7': '#13C2C2',    // 阴影 - 青色
  'quality-8': '#1890FF',    // 气泡 - 蓝色
  'quality-9': '#722ED1',    // 裱贴位置不当 - 紫色
  'quality-10': '#EB2F96',   // 标签不端正 - 品红色
  'quality-11': '#F759AB',   // 拼接错误 - 粉红色
  'quality-12': '#FAAD14',   // 扫描模糊不清 - 金色
  default: '#1890FF'         // 默认颜色
};

// 质量类型名称映射
const qualityTypeNames = {
  1: '染色差异',
  2: '折叠',
  3: '裂痕（划痕）',
  4: '组织缺失',
  5: '厚薄不均',
  6: '切片污染',
  7: '阴影',
  8: '气泡',
  9: '裱贴位置不当',
  10: '标签不端正',
  11: '拼接错误',
  12: '扫描模糊不清'
};

// 质量控制标注器引用
let qualityAnnotator = null;

/**
 * 初始化质量控制标注器
 * @param {Object} viewer - OpenSeadragon viewer对象
 * @param {Object} options - 配置选项
 */
export function initQualityControlAnnotator(viewer, options = {}) {
  try {
    console.log('Initializing Quality Control Annotator');

    // 创建质量控制专用的标注器
    qualityAnnotator = createOSDAnnotator(viewer, {
      drawingEnabled: false,
      autoSave: false,
      userSelectAction: "NONE",
      style: (annotation, state) => {
        let opacity = 0.6;
        if (state && state.selected) opacity = 0.8;
        else if (state && state.hovered) opacity = 0.7;

        // 根据质量类型获取颜色
        const color = qualityColorMap[annotation.type] || qualityColorMap.default;

        return {
          fill: color,
          fillOpacity: opacity * 0.3,
          stroke: color,
          strokeOpacity: opacity,
          strokeWidth: 2
        };
      },
      ...options
    });

    disableQualityAnnotatorEvents();

    console.log('Quality Control Annotator initialized successfully');
    return qualityAnnotator;

  } catch (error) {
    console.error("Error initializing Quality Control Annotator:", error);
    return null;
  }
}


/**
 * 禁用质量控制标注器的鼠标事件
 */
function disableQualityAnnotatorEvents() {
  // 等待标注器完全初始化
  setTimeout(() => {
    try {
      // 查找质量控制标注器对应的 SVG 元素
      const annotationLayers = document.querySelectorAll('.a9s-annotationlayer');

      // 找到最后创建的标注层（应该是质量控制的）
      if (annotationLayers.length > 0) {
        const qualityLayer = annotationLayers[annotationLayers.length - 1];

        // 禁用鼠标事件
        qualityLayer.style.pointerEvents = 'none';
        qualityLayer.style.userSelect = 'none';

        // 添加标识类名以便区分
        qualityLayer.classList.add('quality-control-layer');

        console.log('Quality control layer events disabled');
      }
    } catch (error) {
      console.error('Error disabling quality annotator events:', error);
    }
  }, 100);
}


/**
 * 启用质量控制标注器的鼠标事件（如果需要临时启用）
 */
export function enableQualityAnnotatorEvents() {
  try {
    const qualityLayer = document.querySelector('.quality-control-layer');
    if (qualityLayer) {
      qualityLayer.style.pointerEvents = 'auto';
      qualityLayer.style.userSelect = 'auto';
      console.log('Quality control layer events enabled');
    }
  } catch (error) {
    console.error('Error enabling quality annotator events:', error);
  }
}

/**
 * 重新禁用质量控制标注器的鼠标事件
 */
export function disableQualityAnnotatorEventsManual() {
  try {
    const qualityLayer = document.querySelector('.quality-control-layer');
    if (qualityLayer) {
      qualityLayer.style.pointerEvents = 'none';
      qualityLayer.style.userSelect = 'none';
      console.log('Quality control layer events disabled manually');
    }
  } catch (error) {
    console.error('Error disabling quality annotator events manually:', error);
  }
}

/**
 * 显示质量控制轮廓
 * @param {Object} qualityContoursData - 质量控制轮廓数据
 * @param {Object} sliceData - 切片数据
 */
export function displayQualityContours(qualityContoursData, sliceData) {
  try {
    console.log('displayQualityContours called', { qualityContoursData, sliceData });

    if (!qualityAnnotator) {
      console.warn('Quality Control Annotator not initialized');
      return;
    }

    // 清除现有的质量控制轮廓
    clearQualityContours();

    if (!qualityContoursData || !qualityContoursData.curveList || qualityContoursData.curveList.length === 0) {
      console.log('No quality curves to display');
      return;
    }

    // 获取DZI图像的尺寸
    const dziWidth = sliceData.width;
    const dziHeight = sliceData.height;

    // 获取原curve的列数和行数
    const curveCols = qualityContoursData.curveCols;
    const curveRows = qualityContoursData.curveRows;

    console.log(`DZI Size: ${dziWidth}x${dziHeight}, Curve Size: ${curveCols}x${curveRows}`);

    // 坐标转换函数 - 与sliceAnnotation.js中的逻辑保持一致
    const mapToDziCoordinates = (x, y) => {
      return {
        x: (x / curveCols) * dziWidth,
        y: (y / curveRows) * dziHeight,
      };
    };

    // 处理每个质量控制轮廓
    qualityContoursData.curveList.forEach((curve) => {
      addQualityContour(curve, mapToDziCoordinates);
    });

    // 确保添加轮廓后重新禁用事件
    setTimeout(() => {
      disableQualityAnnotatorEventsManual();
    }, 50);

    console.log(`Added ${qualityContoursData.curveList.length} quality contours`);

  } catch (error) {
    console.error("Error in displayQualityContours:", error);
  }
}

/**
 * 添加单个质量控制轮廓
 * @param {Object} curve - 轮廓数据
 * @param {Function} mapToDziCoordinates - 坐标转换函数
 */
function addQualityContour(curve, mapToDziCoordinates) {
  try {
    // 创建新的标注模板
    const newAnno = getNewQualityAnnoTemplate();

    // 解析轮廓点坐标
    let points;
    if (typeof curve.points === 'string') {
      points = JSON.parse(curve.points);
    } else {
      points = curve.points;
    }

    if (!Array.isArray(points) || points.length === 0) {
      console.warn('Invalid points data for curve:', curve);
      return;
    }

    // 转换坐标 - 使用与loadAIAnno相同的逻辑
    const geometryPoints = points.map(([x, y]) => {
      const mappedPoint = mapToDziCoordinates(x, y);
      return [mappedPoint.x, mappedPoint.y];
    });

    newAnno.target.selector.geometry.points = geometryPoints;

    // 计算边界框
    const xs = geometryPoints.map(p => p[0]);
    const ys = geometryPoints.map(p => p[1]);
    const bounds = {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };

    newAnno.target.selector.geometry.bounds = bounds;

    // 设置质量类型
    newAnno.type = `quality-${curve.type}`;

    // 添加质量类型信息到bodies
    const typeName = qualityTypeNames[curve.type] || `类型${curve.type}`;
    newAnno.bodies = [{
      purpose: 'commenting',
      value: typeName,
      created: new Date().toISOString(),
      qualityType: curve.type,
      qualityTypeName: typeName
    }];

    // 添加自定义属性
    newAnno.qualityInfo = {
      type: curve.type,
      typeName: typeName,
      color: qualityColorMap[`quality-${curve.type}`] || qualityColorMap.default,
      originalCurve: curve
    };

    // 添加到质量控制标注器
    qualityAnnotator.addAnnotation(newAnno);

    console.log(`Added quality contour: ${typeName} (Type ${curve.type})`, geometryPoints);

  } catch (error) {
    console.error("Error adding quality contour:", error, curve);
  }
}

/**
 * 创建新的质量控制标注模板
 * @returns {Object} 标注模板对象
 */
function getNewQualityAnnoTemplate() {
  return {
    id: uuid(),
    type: '', // 将被设置为 quality-{type}
    bodies: [],
    target: {
      selector: {
        type: "POLYGON",
        geometry: {
          bounds: {},
          points: []
        }
      },
      creator: {
        id: "quality-control",
        isGuest: true,
      },
    }
  };
}

/**
 * 清除所有质量控制轮廓
 */
export function clearQualityContours() {
  try {
    if (qualityAnnotator) {
      qualityAnnotator.clearAnnotations();
      console.log('Cleared all quality contours');
    }
  } catch (error) {
    console.error("Error clearing quality contours:", error);
  }
}

/**
 * 根据质量类型过滤显示轮廓
 * @param {Array} types - 要显示的质量类型数组
 */
export function filterQualityContoursByType(types) {
  try {
    if (!qualityAnnotator) {
      console.warn('Quality Control Annotator not initialized');
      return;
    }

    const allAnnotations = qualityAnnotator.getAnnotations();

    // 移除不需要显示的轮廓
    allAnnotations.forEach(annotation => {
      if (annotation.qualityInfo) {
        const shouldShow = types.includes(annotation.qualityInfo.type);

        if (!shouldShow) {
          qualityAnnotator.removeAnnotation(annotation.id);
        }
      }
    });

    console.log(`Filtered quality contours by types: ${types.join(', ')}`);

  } catch (error) {
    console.error("Error filtering quality contours:", error);
  }
}

/**
 * 显示指定类型的质量控制轮廓
 * @param {Array} types - 要显示的质量类型数组
 * @param {Object} qualityContoursData - 完整的质量控制数据
 * @param {Object} sliceData - 切片数据
 */
export function showQualityContoursByType(types, qualityContoursData, sliceData) {
  try {
    if (!qualityAnnotator) {
      console.warn('Quality Control Annotator not initialized');
      return;
    }

    // 清除现有轮廓
    clearQualityContours();

    if (!qualityContoursData || !qualityContoursData.curveList) {
      return;
    }

    // 过滤出需要显示的轮廓
    const filteredCurves = qualityContoursData.curveList.filter(curve =>
      types.includes(curve.type)
    );

    if (filteredCurves.length === 0) {
      console.log('No curves match the specified types');
      return;
    }

    // 创建包含过滤后轮廓的数据对象
    const filteredData = {
      ...qualityContoursData,
      curveList: filteredCurves
    };

    // 显示过滤后的轮廓
    displayQualityContours(filteredData, sliceData);

    console.log(`Showing ${filteredCurves.length} quality contours for types: ${types.join(', ')}`);

  } catch (error) {
    console.error("Error showing quality contours by type:", error);
  }
}

/**
 * 获取当前显示的质量控制轮廓数量
 * @returns {number} 轮廓数量
 */
export function getQualityContourCount() {
  try {
    if (!qualityAnnotator) return 0;
    return qualityAnnotator.getAnnotations().length;
  } catch (error) {
    console.error("Error getting quality contour count:", error);
    return 0;
  }
}

/**
 * 获取指定类型的质量控制轮廓数量
 * @param {number} type - 质量类型
 * @returns {number} 该类型的轮廓数量
 */
export function getQualityContourCountByType(type) {
  try {
    if (!qualityAnnotator) return 0;

    const allAnnotations = qualityAnnotator.getAnnotations();
    return allAnnotations.filter(annotation =>
      annotation.qualityInfo && annotation.qualityInfo.type === type
    ).length;
  } catch (error) {
    console.error("Error getting quality contour count by type:", error);
    return 0;
  }
}

/**
 * 设置质量控制轮廓的可见性
 * @param {boolean} visible - 是否可见
 */
export function setQualityContoursVisible(visible) {
  try {
    if (!qualityAnnotator) return;

    const allAnnotations = qualityAnnotator.getAnnotations();

    if (visible) {
      // 显示所有轮廓
      allAnnotations.forEach(annotation => {
        // 这里可能需要根据具体的API来实现显示
        // annotorious可能没有直接的hide/show方法，需要通过其他方式实现
      });
    } else {
      // 隐藏所有轮廓 - 通过移除然后重新添加来实现
      // 或者通过CSS样式来隐藏
    }

    console.log(`Set quality contours visibility: ${visible}`);

  } catch (error) {
    console.error("Error setting quality contours visibility:", error);
  }
}

/**
 * 获取质量类型的颜色
 * @param {number} type - 质量类型
 * @returns {string} 颜色值
 */
export function getQualityTypeColor(type) {
  return qualityColorMap[`quality-${type}`] || qualityColorMap.default;
}

/**
 * 获取质量类型的名称
 * @param {number} type - 质量类型
 * @returns {string} 类型名称
 */
export function getQualityTypeName(type) {
  return qualityTypeNames[type] || `类型${type}`;
}

/**
 * 获取所有质量类型信息
 * @returns {Array} 质量类型信息数组
 */
export function getAllQualityTypes() {
  return Object.keys(qualityTypeNames).map(type => ({
    type: parseInt(type),
    name: qualityTypeNames[type],
    color: qualityColorMap[`quality-${type}`] || qualityColorMap.default
  }));
}

/**
 * 销毁质量控制标注器
 */
export function destroyQualityControlAnnotator() {
  try {
    if (qualityAnnotator) {
      qualityAnnotator.clearAnnotations();
      // 如果有destroy方法，调用它
      if (typeof qualityAnnotator.destroy === 'function') {
        qualityAnnotator.destroy();
      }
      qualityAnnotator = null;
      console.log('Quality Control Annotator destroyed');
    }
  } catch (error) {
    console.error("Error destroying Quality Control Annotator:", error);
  }
}

// 导出质量控制标注器引用（用于外部访问）
export function getQualityControlAnnotator() {
  return qualityAnnotator;
}

// 导出颜色和名称映射（用于外部组件）
export { qualityColorMap, qualityTypeNames };