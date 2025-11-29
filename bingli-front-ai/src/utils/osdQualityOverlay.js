/**
 * OpenSeadragon 质量控制轮廓覆盖层工具
 * 在OpenSeadragon viewer上显示AI质量控制结果的轮廓
 */

import * as d3 from 'd3';
import OpenSeadragon from 'openseadragon';

export class OSDQualityOverlay {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.options = {
      strokeWidth: 2,
      opacity: 0.8,
      ...options
    };

    // 质量类型颜色映射 - 使用与原系统一致的颜色
    this.qualityTypeColors = {
      1: '#FF4D4F',    // 染色差异 - 红色
      2: '#FF7A45',    // 折叠 - 橙红色  
      3: '#FFA940',    // 裂痕（划痕） - 橙色
      4: '#FFEC3D',    // 组织缺失 - 黄色
      5: '#BAE637',    // 厚薄不均 - 黄绿色
      6: '#52C41A',    // 切片污染 - 绿色
      7: '#13C2C2',    // 阴影 - 青色
      8: '#1890FF',    // 气泡 - 蓝色
      9: '#722ED1',    // 裱贴位置不当 - 紫色
      10: '#EB2F96',   // 标签不端正 - 品红色
      11: '#F759AB',   // 拼接错误 - 粉红色
      12: '#FAAD14',   // 扫描模糊不清 - 金色
      ...options.typeColors
    };

    // 质量类型名称映射 - 使用与useQualityControl.js一致的名称
    this.qualityTypeNames = {
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
      12: '扫描模糊不清',
      ...options.typeNames
    };

    this.qualityContours = [];
    this.wrapperDiv = null;
    this.svgElement = null;

    this.addRequiredStyles();
    this.initSvgOverlay();
  }

  /**
   * 添加必要的CSS样式
   */
  addRequiredStyles() {
    const styleId = 'osd-quality-overlay-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .osd-quality-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
      }
      
      .quality-contour {
        fill: none;
        stroke-width: 2;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      
      .quality-label {
        font-family: 'Source Han Sans SC', sans-serif;
        font-size: 12px;
        font-weight: 500;
        fill: white;
        text-anchor: middle;
        dominant-baseline: middle;
        pointer-events: none;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      }
      
      .quality-label-background {
        fill: rgba(0,0,0,0.7);
        rx: 4;
        ry: 4;
        pointer-events: none;
      }
      
      .quality-contour-group:hover .quality-contour {
        stroke-width: 3;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 初始化SVG覆盖层
   */
  initSvgOverlay() {
    try {
      const canvasContainer = this.viewer.canvas;
      if (!canvasContainer) {
        return;
      }

      // 创建包装器 div
      this.wrapperDiv = d3.select(canvasContainer)
        .append("div")
        .attr("id", "quality_svg_wrapper")
        .style("position", "absolute")
        .style("top", "0px")
        .style("left", "0px")
        .style("width", "100%")
        .style("height", "100%")
        .style("pointer-events", "none")
        .style("z-index", "1000");

      // 创建 SVG 元素
      this.svgElement = this.wrapperDiv
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("pointer-events", "none");
      this.updateSvgWrapperFrame({ first: true });

      // 监听 viewer 的变化事件
      this.viewer.addHandler('animation', () => this.updateSvgWrapperFrame());
      this.viewer.addHandler('resize', () => this.updateSvgWrapperFrame());
      this.viewer.addHandler('update-viewport', () => this.updateSvgWrapperFrame());
      this.viewer.addHandler('open', () => {
        setTimeout(() => this.updateSvgWrapperFrame(), 100);
      });

    } catch {
      // 静默处理初始化错误
    }
  }

  

  updateSvgWrapperFrame({ first = false } = {}) {
    if (!this.wrapperDiv || !this.viewer.canvas) {
      console.log("OSDMeasurement: updateSvgWrapperFrame - missing elements");
      return;
    }

    try {
      // 获取当前图像项
      const tiledImage = this.viewer.world.getItemAt(0);
      if (!tiledImage) {
        console.log("OSDMeasurement: updateSvgWrapperFrame - no tiled image found");
        return;
      }
      console.log("OSDMeasurement: updateSvgWrapperFrame start", tiledImage);

      // 获取图像的原始尺寸
      const imageWidth =
        tiledImage.source.width || tiledImage.source.dimensions.x;
      const imageHeight =
        tiledImage.source.height || tiledImage.source.dimensions.y;
      // 获取当前缩放级别
      const zoom = this.viewer.viewport.getZoom(true);
      // 获取图像的当前边界（归一化坐标）
      const imageBounds = tiledImage.getBounds();
      // 获取容器尺寸
      const containerSize = this.viewer.viewport.getContainerSize();
      // 计算图像在屏幕上的实际显示尺寸
      const displayedWidth = Math.round(
        imageBounds.width * containerSize.x * zoom
      );
      // 考虑图像的宽高比
      const aspectRatio = imageWidth / imageHeight;
      // 如果计算的高度不正确，尝试使用宽高比计算
      const displayedHeight = Math.round(displayedWidth / aspectRatio);
      // 获取图像中心点
      const center = { x: imageWidth / 2, y: imageWidth / 2 };
      // 获取中心点在视口中的坐标
      const centerViewport = this.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(center));
      const left = centerViewport.x;
      const top = centerViewport.y;

      console.log("Image bounds:", imageBounds);
      console.log("Displayed size:", { displayedWidth, displayedHeight });
      console.log("Container size:", containerSize);
      console.log("Center point:", center);
      console.log("Viewport center:", centerViewport);
      console.log("Left and top:", { left, top });
      console.log("Aspect ratio:", aspectRatio);
      console.log("Zoom level:", zoom);
      console.log("Image size:", { imageWidth, imageHeight });
      console.log("Image source:", tiledImage.source);
      console.log("wrapperDiv:", this.wrapperDiv);

      // this.wrapperDiv
      //   .attr("width", displayedWidth)
      //   .attr("height", displayedHeight)
      //   .style("left", `${left}px`)
      //   .style("top", `${top}px`)
      //   .style("width", `${displayedWidth}px`)
      //   .style("height", `${displayedHeight}px`);

      

    } catch (error) {
      console.error("Error in updateSvgWrapperFrame:", error);
    }
  }

  /**
   * 显示质量控制轮廓
   * @param {Object} qualityContoursData - 质量控制轮廓数据，包含curveList、curveCols、curveRows等信息
   * @param {Object} sliceData - 切片数据（可选，用于图像尺寸信息）
   */
  displayQualityContours(qualityContoursData, sliceData = null) {
    console.log('OSDQualityOverlay: displayQualityContours called', { qualityContoursData, sliceData });

    // 清除现有轮廓
    this.clearContours();

    if (!qualityContoursData || !qualityContoursData.curveList || qualityContoursData.curveList.length === 0) {
      console.log('OSDQualityOverlay: No curves to display');
      return;
    }

    // 保存质量数据用于坐标转换（包含curveCols和curveRows）
    this.qualityContoursData = qualityContoursData;
    this.sliceData = sliceData;
    console.log('OSDQualityOverlay: Saved qualityContoursData and sliceData', { qualityContoursData: this.qualityContoursData, sliceData: this.sliceData });

    // 提取轮廓列表
    const curveList = qualityContoursData.curveList;

    // 确保OpenSeadragon已经准备好再添加轮廓
    if (this.viewer.world && this.viewer.world.getItemCount() > 0) {
      this.addContours(curveList);
    } else {
      // 如果OpenSeadragon还没准备好，等待open事件
      const handleOpen = () => {
        this.addContours(curveList);
        this.viewer.removeHandler('open', handleOpen);
      };
      this.viewer.addHandler('open', handleOpen);
    }
  }

  /**
   * 添加轮廓到SVG
   * @param {Array} curveList - 轮廓数据数组
   */
  addContours(curveList) {
    curveList.forEach((curve) => {
      this.addQualityContour(curve);
    });
  }

  /**
   * 添加单个质量轮廓
   * @param {Object} curve - 轮廓数据
   * @param {number} index - 索引
   */
  addQualityContour(curve) {
    console.log('OSDQualityOverlay: addQualityContour called', curve);

    try {
      // 解析点坐标
      let points;
      if (typeof curve.points === 'string') {
        points = JSON.parse(curve.points);
      } else {
        points = curve.points;
      }

      console.log('OSDQualityOverlay: Parsed points', points);

      if (!Array.isArray(points) || points.length === 0) {
        console.warn('OSDQualityOverlay: Invalid points data', curve);
        return;
      }

      // 转换坐标到DZI图像坐标系（参考loadAIAnno函数的逻辑）
      const convertedPoints = this.convertToDziCoordinates(points, curve);
      console.log('OSDQualityOverlay: Converted points', convertedPoints);

      // 获取质量类型对应的颜色和名称
      const color = this.qualityTypeColors[curve.type] || '#1890FF';
      const typeName = this.qualityTypeNames[curve.type] || `类型${curve.type}`;

      // 创建轮廓组
      const contourGroup = this.svgElement
        .append("g")
        .attr("class", "quality-contour-group")
        .attr("data-curve-id", curve.id)
        .attr("data-curve-type", curve.type);

      // 创建路径
      const pathData = this.generatePathData(convertedPoints);
      contourGroup
        .append("path")
        .attr("class", "quality-contour")
        .attr("d", pathData)
        .attr("stroke", color)
        .attr("stroke-width", this.options.strokeWidth)
        .attr("fill", "none")
        .style("opacity", this.options.opacity);

      // 计算标签位置（轮廓的中心点）
      const centerPoint = this.calculateContourCenter(convertedPoints);
      const screenCenter = this.imageToScreenCoordinates(centerPoint.x, centerPoint.y);

      if (screenCenter) {
        // 创建标签背景
        const labelText = typeName;
        const labelBg = contourGroup
          .append("rect")
          .attr("class", "quality-label-background")
          .attr("fill", color)
          .style("opacity", 0.9);

        // 创建标签文本
        const label = contourGroup
          .append("text")
          .attr("class", "quality-label")
          .attr("x", screenCenter.x)
          .attr("y", screenCenter.y)
          .text(labelText);

        // 延迟调整背景大小，确保文本已经渲染
        setTimeout(() => {
          try {
            const labelNode = label.node();
            if (labelNode && typeof labelNode.getBBox === 'function') {
              const bbox = labelNode.getBBox();
              if (bbox) {
                labelBg
                  .attr("x", bbox.x - 4)
                  .attr("y", bbox.y - 2)
                  .attr("width", bbox.width + 8)
                  .attr("height", bbox.height + 4);
              }
            }
          } catch {
            // getBBox可能失败，使用默认尺寸
            labelBg
              .attr("x", screenCenter.x - 30)
              .attr("y", screenCenter.y - 10)
              .attr("width", 60)
              .attr("height", 20);
          }
        }, 0);
      }

      // 存储轮廓信息
      this.qualityContours.push({
        id: curve.id,
        type: curve.type,
        points: convertedPoints,
        element: contourGroup,
        color: color,
        typeName: typeName
      });

    } catch {
      // 静默处理错误
    }
  }

  /**
   * 将轮廓坐标转换为DZI图像坐标系
   * 参考loadAIAnno函数的坐标转换逻辑
   * @param {Array} points - 原始点坐标数组
   * @param {Object} curve - 轮廓数据对象
   * @returns {Array} 转换后的点坐标数组
   */
  convertToDziCoordinates(points, curve) {
    console.log('OSDQualityOverlay: convertToDziCoordinates called', { points, curve, sliceData: this.sliceData });

    // 获取DZI图像的尺寸
    let dziWidth, dziHeight;

    if (this.sliceData && this.sliceData.width && this.sliceData.height) {
      // 如果有传入的切片数据，使用它
      dziWidth = this.sliceData.width;
      dziHeight = this.sliceData.height;
      console.log('OSDQualityOverlay: Using sliceData dimensions', { dziWidth, dziHeight });
    } else {
      // 否则从OpenSeadragon获取图像尺寸
      const tiledImage = this.viewer.world.getItemAt(0);
      const imageSize = tiledImage.getContentSize();
      dziWidth = imageSize.x;
      dziHeight = imageSize.y;
      console.log('OSDQualityOverlay: Using OpenSeadragon dimensions', { dziWidth, dziHeight });
    }

    // 获取原curve的列数和行数 - 优先从qualityData中获取
    let curveCols, curveRows;

    if (this.qualityContoursData && this.qualityContoursData.curveCols && this.qualityContoursData.curveRows) {
      // 从质量数据中获取curveCols和curveRows信息
      curveCols = this.qualityContoursData.curveCols;
      curveRows = this.qualityContoursData.curveRows;
      console.log('OSDQualityOverlay: Using qualityContoursData curve dimensions', { curveCols, curveRows });
    }

    // 将curve坐标映射到DZI图像的坐标系 - 与loadAIAnno完全一致的逻辑
    const mapToDziCoordinates = (x, y) => {
      return {
        x: (x / curveCols) * dziWidth,
        y: (y / curveRows) * dziHeight,
      };
    };

    // 转换每个点的坐标
    const result = points.map(([x, y]) => {
      const mappedPoint = mapToDziCoordinates(x, y);
      return [mappedPoint.x, mappedPoint.y];
    });

    console.log('OSDQualityOverlay: Final converted points', {
      originalFirst: points[0],
      convertedFirst: result[0],
      originalLast: points[points.length - 1],
      convertedLast: result[result.length - 1]
    });

    return result;
  }

  /**
   * 生成 SVG 路径数据
   * @param {Array} points - 点坐标数组 [[x1, y1], [x2, y2], ...]
   * @returns {string} SVG 路径字符串
   */
  generatePathData(points) {
    if (!points || points.length === 0) return "";

    const screenPoints = points.map(point => {
      const screenCoord = this.imageToScreenCoordinates(point[0], point[1]);
      return screenCoord || { x: 0, y: 0 };
    });

    let pathData = `M ${screenPoints[0].x} ${screenPoints[0].y}`;

    for (let i = 1; i < screenPoints.length; i++) {
      pathData += ` L ${screenPoints[i].x} ${screenPoints[i].y}`;
    }

    // 闭合路径
    pathData += " Z";

    return pathData;
  }

  /**
   * 计算轮廓的中心点
   * @param {Array} points - 点坐标数组
   * @returns {Object} 中心点坐标 {x, y}
   */
  calculateContourCenter(points) {
    if (!points || points.length === 0) return { x: 0, y: 0 };

    let sumX = 0, sumY = 0;
    points.forEach(point => {
      sumX += point[0];
      sumY += point[1];
    });

    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  }

  /**
   * 将图像坐标转换为屏幕坐标
   * @param {number} imageX - 图像 X 坐标
   * @param {number} imageY - 图像 Y 坐标
   * @returns {Object|null} 屏幕坐标 {x, y}
   */
  imageToScreenCoordinates(imageX, imageY) {
    try {
      if (!this.viewer.world || this.viewer.world.getItemCount() === 0) {
        return null;
      }

      const tiledImage = this.viewer.world.getItemAt(0);
      const imagePoint = new OpenSeadragon.Point(imageX, imageY);
      const viewportPoint = tiledImage.imageToViewportCoordinates(imagePoint);
      const screenPoint = this.viewer.viewport.viewportToWindowCoordinates(viewportPoint);
      const canvasRect = this.viewer.canvas.getBoundingClientRect();

      return {
        x: screenPoint.x - canvasRect.left,
        y: screenPoint.y - canvasRect.top
      };
    } catch {
      return null;
    }
  }

  /**
   * 清除所有轮廓
   */
  clearContours() {
    if (this.svgElement) {
      this.svgElement.selectAll('.quality-contour-group').remove();
    }
    this.qualityContours = [];
  }

  /**
   * 根据类型过滤显示轮廓
   * @param {Array} types - 要显示的类型数组
   */
  filterContoursByType(types) {
    if (!this.svgElement) return;

    this.svgElement.selectAll('.quality-contour-group').style('display', function () {
      const curveType = parseInt(this.getAttribute('data-curve-type'));
      return types.includes(curveType) ? 'block' : 'none';
    });
  }

  /**
   * 设置轮廓的透明度
   * @param {number} opacity - 透明度值 (0-1)
   */
  setOpacity(opacity) {
    this.options.opacity = opacity;
    if (this.svgElement) {
      this.svgElement.selectAll('.quality-contour').style('opacity', opacity);
      this.svgElement.selectAll('.quality-label-background').style('opacity', opacity * 0.9);
    }
  }

  /**
   * 销毁覆盖层
   */
  destroy() {
    if (this.wrapperDiv) {
      this.wrapperDiv.remove();
    }
    this.qualityContours = [];
    this.wrapperDiv = null;
    this.svgElement = null;
  }
}

export default OSDQualityOverlay;
