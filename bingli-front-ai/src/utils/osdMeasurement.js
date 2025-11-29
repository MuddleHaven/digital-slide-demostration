import * as d3 from "d3";
import OpenSeadragon from "openseadragon";
import { v4 as uuid } from "uuid";

/**
 * OSDMeasurement 类用于在 OpenSeadragon 视图中进行测量。
 * 它允许用户在图像上绘制测量线，计算距离，并显示测量结果。
 * @constructor
 * @param {OpenSeadragon.Viewer} viewer - OpenSeadragon 视图实例。
 * @param {Object} [options] - 可选配置参数。
 * @param {string} [options.color="#ff0000"] - 测量线的颜色。
 * @param {number} [options.strokeWidth=2] - 测量线的宽度。
 * @param {number} [options.labelFontSize=14] - 测量标签的字体大小。
 * @param {string} [options.units="μm"] - 测量单位。
 * @param {number} [options.conversionFactor=1] - 从像素到实际单位的转换因子。
 * @param {number} [options.circleRadius=5] - 起点和终点圆圈的半径。
 */
export default class OSDMeasurement {
  constructor(viewer, options = {}) {
    //console.log("OSDMeasurement: constructor", { viewer, options });
    this.viewer = viewer;
    this.options = {
      strokeColor: options.strokeColor || options.color || "#ff0000",
      strokeWidth: options.strokeWidth || 2,
      labelFontSize: options.labelFontSize || 14,
      units: options.units || "μm",
      conversionFactor: options.conversionFactor || 1,
      circleRadius: options.circleRadius || 5,
      ...options,
    };

    this.enabled = false;
    this.measurements = [];
    this.currentMeasurement = null;
    this.isDrawing = false;

    this.initSvgOverlay();
    // 添加必要的CSS样式
    this.addRequiredStyles();
  }

  // 添加新方法
  addRequiredStyles() {
    // 检查是否已存在样式
    if (document.getElementById("osd-measurement-styles")) return;

    const styleSheet = document.createElement("style");
    styleSheet.id = "osd-measurement-styles";
    styleSheet.textContent = `
    .start-point, .end-point {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-left: -3px;
      margin-top: -3px;
      z-index: 1000;
    }
    
    .measure-tip {
      position: absolute;
      transform: translate(-50%, -100%);
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 12px;
      color: white;
      white-space: nowrap;
      z-index: 1000;
    }
    
    .icon-close {
      position: absolute;
      width: 16px;
      height: 16px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E");
      background-size: cover;
      cursor: pointer;
      z-index: 1000;
      background-color: #5CDBD3;
      border-radius: 50%;
      pointer-events: auto !important;
    }

    .icon-close:hover {
      background-color: #ff4d4f;
      transform: scale(1.1);
    }
  `;
    document.head.appendChild(styleSheet);
  }

  initSvgOverlay() {
    //console.log("OSDMeasurement: initSvgOverlay start");
    // 创建SVG覆盖层
    const canvasContainer = this.viewer.canvas;
    //console.log("Canvas container:", canvasContainer);

    try {
      // 创建静态定位的背景div
      this.backgroundDiv = d3
        .select(canvasContainer)
        .append("div")
        .attr(
          "style",
          "background: none transparent; border: none; margin: 0px; padding: 0px; position: static;"
        )
        .attr("class", "measurement-background");
      //console.log("Background div created:", this.backgroundDiv.node());

      // 创建绝对定位的wrapper div
      this.wrapperDiv = this.backgroundDiv
        .append("div")
        .attr("id", "svg_wrapper")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("position", "absolute")
        .style("left", "0px")
        .style("top", "0px")
        .style("width", "100%")
        .style("height", "100%")
        .style("display", "block")
        .style("cursor", "default")
        .attr("class", "custom-cursor-default-hover");
      //console.log("Wrapper div created:", this.wrapperDiv.node());

      // 创建SVG元素
      this.svgContainer = this.wrapperDiv
        .append("svg")
        .attr("id", "svg")
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("version", "1.1")
        .attr("preserveAspectRatio", "none")
        .attr("viewBox", "0 0 100 100")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("class", "custom-cursor-default-hover");
      //console.log("SVG container created:", this.svgContainer.node());

      // 更新SVG容器大小
      this.updateSvgWrapperFrame({ first: true });

      // 添加鼠标事件
      // this.mouseTracker = new OpenSeadragon.MouseTracker({
      //   element: this.wrapperDiv.node(),
      //   pressHandler: this.handleMouseDown.bind(this),
      //   moveHandler: this.handleMouseMove.bind(this),
      //   releaseHandler: this.handleMouseUp.bind(this),
      //   // clickHandler: this.handleClick.bind(this),
      // });

      // 添加鼠标事件
      this.mouseTracker = new OpenSeadragon.MouseTracker({
        element: this.wrapperDiv.node(),
        pressHandler: (event) => {
          if (!this.enabled) return;
          this.handleMouseDown(event);
        },
        moveHandler: (event) => {
          if (!this.enabled) return;
          this.handleMouseMove(event);
        },
        releaseHandler: (event) => {
          if (!this.enabled) return;
          this.handleMouseUp(event);
        }
      });

      // 默认不激活追踪
      this.mouseTracker.setTracking(false);
      this.viewer.setMouseNavEnabled(true);

      // 添加视口变化事件
      this.viewer.addHandler(
        "animation",
        this.updateSvgWrapperFrame.bind(this)
      );
      this.viewer.addHandler("open", this.updateSvgWrapperFrame.bind(this));
      this.viewer.addHandler(
        "update-viewport",
        this.updateSvgWrapperFrame.bind(this)
      );
      this.viewer.addHandler("resize", this.updateSvgWrapperFrame.bind(this));

      // 添加键盘事件
      document.addEventListener("keydown", this.handleKeyDown.bind(this));
      // 在initSvgOverlay方法中修改事件委托处理

      canvasContainer.addEventListener('click', this.canvasContainerClickHandler.bind(this));
    } catch (error) {
      console.error("Error in initSvgOverlay:", error);
    }
  }
  // 辅助函数：处理关闭按钮的点击
  handleCloseButtonClick(button, evt) {
    if (evt instanceof PointerEvent) {
      evt?.stopPropagation();
      evt?.preventDefault();
    }
    //console.log("Close button clicked", button);

    const measurementId = button.getAttribute('annotationid');
    if (measurementId) {
      const measurement = this.measurements.find(m => m.id === measurementId);
      if (measurement) {
        this.deleteMeasurement(measurement);
      }
    }
  }

  // 辅助函数：检查点击是否命中关闭按钮
  checkCloseButtonsHitTest(buttons, evt) {
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const rect = button.getBoundingClientRect();

      // 检查点击位置是否在按钮区域内
      if (evt.clientX >= rect.left && evt.clientX <= rect.right &&
        evt.clientY >= rect.top && evt.clientY <= rect.bottom) {

        this.handleCloseButtonClick(button, evt);
        return true;
      }
    }
    return false;
  }

  canvasContainerClickHandler(event) {
    //console.log("Canvas container clicked through delegation", event);

    // 移除这个条件，使得测量模式下也能响应关闭按钮点击
    if (this.enabled) { return }

    const target = event.target;

    // 情况1: 直接点击了关闭按钮
    if (target.classList.contains('icon-close')) {
      this.handleCloseButtonClick(target, event);
      return;
    }

    // 情况2: 点击的是svg_wrapper或其子元素
    let currentElement = target;
    let found = false;

    // 首先检查是否点击了svg_wrapper或其子元素
    while (currentElement && !found) {
      if (currentElement.id === 'svg_wrapper' || currentElement.classList.contains('svg_wrapper')) {
        // 在svg_wrapper中查找关闭按钮
        const closeButtons = currentElement.querySelectorAll('.icon-close');
        //console.log("Found close buttons in svg_wrapper:", closeButtons);

        // 检查是否有关闭按钮被点击
        this.checkCloseButtonsHitTest(closeButtons, event);
        found = true;
        break;
      }
      currentElement = currentElement.parentElement;
    }

    // 情况3: 点击的是canvas，查找其子元素中的measurement-background和svg_wrapper
    if (!found && (target.classList.contains('openseadragon-canvas') ||
      target.closest('.openseadragon-canvas'))) {
      const canvas = target.classList.contains('openseadragon-canvas') ?
        target : target.closest('.openseadragon-canvas');

      // 查找measurement-background
      const measurementBg = canvas.querySelector('.measurement-background');
      if (measurementBg) {
        const svgWrapper = measurementBg.querySelector('#svg_wrapper');
        if (svgWrapper) {
          //console.log("Found svg_wrapper through canvas:", svgWrapper);

          // 在svg_wrapper中查找关闭按钮
          const closeButtons = svgWrapper.querySelectorAll('.icon-close');
          //console.log("Found close buttons through canvas:", closeButtons);

          // 检查是否有关闭按钮被点击
          this.checkCloseButtonsHitTest(closeButtons, event);
        }
      }
    }
  }

  updateSvgWrapperFrame({ first = false }) {
    if (!this.wrapperDiv || !this.viewer.canvas) {
      //console.log("OSDMeasurement: updateSvgWrapperFrame - missing elements");
      return;
    }

    try {
      // 获取当前图像项
      const tiledImage = this.viewer.world.getItemAt(0);
      if (!tiledImage) {
        // log.info("OSDMeasurement: updateSvgWrapperFrame - no tiled image found");
        return;
      }
      // log.main.info("OSDMeasurement: updateSvgWrapperFrame start", tiledImage);

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

      // log.info("Image bounds:", imageBounds);
      // log.info("Displayed size:", { displayedWidth, displayedHeight });
      // log.info("Container size:", containerSize);
      // log.info("Center point:", center);
      // log.info("Viewport center:", centerViewport);
      // log.info("Left and top:", { left, top });
      // log.info("Aspect ratio:", aspectRatio);
      // log.info("Zoom level:", zoom);
      // log.info("Image size:", { imageWidth, imageHeight });
      // log.info("Image source:", tiledImage.source);

      this.wrapperDiv
        .attr("width", displayedWidth)
        .attr("height", displayedHeight)
        .style("left", `${left}px`)
        .style("top", `${top}px`)
        .style("width", `${displayedWidth}px`)
        .style("height", `${displayedHeight}px`);

      if (this.measurements && this.measurements.length > 0) {
        // this.updateMeasurementPositions();
      }
    } catch (error) {
      console.error("Error in updateSvgWrapperFrame:", error);
    }
  }

  // 更新所有测量的位置
  updateMeasurementPositions() {
    this.measurements.forEach((measurement) => {
      if (measurement.startPoint && measurement.endPoint) {
        // 更新线条位置
        if (measurement.line) {
          measurement.line
            .attr("x1", measurement.startPoint.percentX)
            .attr("y1", measurement.startPoint.percentY)
            .attr("x2", measurement.endPoint.percentX)
            .attr("y2", measurement.endPoint.percentY);
        }

        // 更新起点位置
        if (measurement.startPointDiv) {
          measurement.startPointDiv
            .style("top", measurement.startPoint.percentY + "%")
            .style("left", measurement.startPoint.percentX + "%");
        }

        // 更新终点位置
        if (measurement.endPointDiv) {
          measurement.endPointDiv
            .style("top", measurement.endPoint.percentY + "%")
            .style("left", measurement.endPoint.percentX + "%");
        }

        // 更新测量标签位置（线的中点）
        if (measurement.tipSpan) {
          const midX =
            (parseFloat(measurement.startPoint.percentX) +
              parseFloat(measurement.endPoint.percentX)) /
            2;
          const midY =
            (parseFloat(measurement.startPoint.percentY) +
              parseFloat(measurement.endPoint.percentY)) /
            2;

          measurement.tipSpan
            .style("top", midY + "%")
            .style("left", midX + "%");
        }

        // 更新关闭按钮位置
        if (measurement.closeDiv) {
          measurement.closeDiv
            .style("top", measurement.endPoint.percentY + "%")
            .style("left", measurement.endPoint.percentX + "%")
            .style("transform", "translate(8px, -8px)");
        }
      }
    });
  }

  enableMeasurement() {
    //console.log("OSDMeasurement: enableMeasurement");
    this.enabled = true;
    // this.wrapperDiv.style('pointer-events', 'all');
    // 保持mouseNavEnabled为true，允许拖动和缩放
    this.viewer.setMouseNavEnabled(true);

    // 设置鼠标追踪
    this.mouseTracker.setTracking(true);

    // 记住测量前的交互模式
    this.originalScrollZoomEnabled = this.viewer.gestureSettingsMouse.scrollToZoom;
    this.originalClickToZoomEnabled = this.viewer.gestureSettingsMouse.clickToZoom;
    this.originalDblClickToZoomEnabled = this.viewer.gestureSettingsMouse.dblClickToZoom;

    // 配置鼠标手势设置
    // 保留滚轮缩放功能
    this.viewer.gestureSettingsMouse.scrollToZoom = true;

    // 单击不执行缩放，而是绘制测量
    this.viewer.gestureSettingsMouse.clickToZoom = false;

    // 可选：保留双击缩放功能
    this.viewer.gestureSettingsMouse.dblClickToZoom = true;
  }

  disableMeasurement() {
    //console.log("OSDMeasurement: disableMeasurement");
    this.enabled = false;
    // this.wrapperDiv.style('pointer-events', 'none');

    // 恢复原始鼠标手势设置
    this.viewer.gestureSettingsMouse.scrollToZoom = this.originalScrollZoomEnabled;
    this.viewer.gestureSettingsMouse.clickToZoom = this.originalClickToZoomEnabled;
    this.viewer.gestureSettingsMouse.dblClickToZoom = this.originalDblClickToZoomEnabled;

    this.viewer.setMouseNavEnabled(true);
    this.mouseTracker.setTracking(false);
    this.resetCurrentMeasurement();
  }

  handleMouseDown(event) {
    if (!this.enabled) return;
    // 检查点击是否在关闭按钮上 - 如果是，直接返回不处理
    if (event.originalEvent && event.originalEvent.target) {
      const target = event.originalEvent.target;
      if (target.classList.contains('icon-close') ||
        target.closest('.icon-close')) {
        //console.log("Click on close button, ignoring mouseDown for measurement", event);
        this.handleCloseButtonClick(target, event);
        return;
      }
    }

    // 使用窗口坐标，而不是视口坐标
    const point = {
      x: event.position.x,
      y: event.position.y,
    };

    //console.log("OSDMeasurement: handleMouseDown", {point,isDrawing: this.isDrawing,});

    // 如果没有按下任何修饰键，处理测量（可选配置）
    // 或者可以检查是否按下了ctrl/alt等修饰键
    const isModifierKeyPressed = event.originalEvent.ctrlKey ||
      event.originalEvent.metaKey ||
      event.originalEvent.shiftKey;
    // 如果没有按修饰键，则开始测量  

    if (!isModifierKeyPressed && !this.isDrawing) {
      // 阻止原生事件传播，防止拖动
      if (event.originalEvent) {
        event.originalEvent.stopPropagation();
        event.originalEvent.preventDefault();
      }
      // 开始新的测量
      this.startDrawing(point);
    }
  }

  handleMouseMove(event) {
    if (!this.enabled || !this.isDrawing) return;

    const point = {
      x: event.position.x,
      y: event.position.y,
    };

    //console.log("OSDMeasurement: handleMouseMove", { point });

    // 更新当前测量
    this.updateCurrentMeasurement(point);
  }

  handleMouseUp(event) {
    if (!this.enabled || !this.isDrawing) return;

    const point = {
      x: event.position.x,
      y: event.position.y,
    };

    //console.log("OSDMeasurement: handleMouseUp", { point });

    // 结束当前测量
    this.finishCurrentMeasurement(point);
  }

  handleClick(event) {
    // if (!this.enabled) return;
    //console.log("OSDMeasurement: handleClick", { position: event.position });
    // 检查是否点击了关闭按钮
    this.checkCloseButtonClick(event.position);
  }

  checkCloseButtonClick(position) {
    //console.log("OSDMeasurement: checkCloseButtonClick", { position });
    // 检查是否点击了关闭按钮
    this.measurements.forEach((measurement, index) => {
      //console.log(`Checking measurement ${index}`, measurement);
      if (measurement.closeDiv) {
        const closeRect = measurement.closeDiv
          .node()
          .getBoundingClientRect();
        if (
          position.x >= closeRect.left &&
          position.x <= closeRect.right &&
          position.y >= closeRect.top &&
          position.y <= closeRect.bottom
        ) {
          //console.log(`Close button clicked for measurement ${index}`);
          this.deleteMeasurement(measurement);
        }
      }
    });
  }

  handleKeyDown(event) {
    if (!this.enabled) return;

    //console.log("OSDMeasurement: handleKeyDown", { key: event.key });

    // ESC键 - 取消当前测量
    if (event.key === "Escape") {
      //console.log("ESC key pressed, canceling current measurement");
      this.resetCurrentMeasurement();
    }

    // Delete键 - 删除选中的测量
    if (event.key === "Delete" || event.key === "Backspace") {
      //console.log("Delete/Backspace key pressed, deleting selected measurement");
      this.deleteSelectedMeasurement();
    }

    // Z键 - 撤销最后一个测量
    if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      //console.log("Ctrl/Cmd+Z pressed, undoing last measurement");
      this.undo();
    }
  }

  startDrawing(viewerPoint) {
    //console.log("OSDMeasurement: startDrawing", { viewerPoint });
    this.isDrawing = true;

    try {
      const id = uuid();

      // 1. 计算百分比位置
      const position = this.calculatePercentPosition(viewerPoint);
      //console.log("Percent position:", position);

      // 2. 创建测量对象
      this.currentMeasurement = {
        id: id,
        startPoint: position,
        endPoint: position,
      };

      // 3. 添加SVG线条
      this.currentMeasurement.line = this.svgContainer
        .append("line")
        .attr("id", `meameasureDistance_${id}`)
        .attr("annotationId", id)
        .attr("type", "measureDistance")
        .attr("x1", position.percentX)
        .attr("y1", position.percentY)
        .attr("x2", position.percentX)
        .attr("y2", position.percentY)
        .style("z-index", "1000")
        .attr("stroke", this.options.strokeColor)
        .attr("stroke-width", this.options.strokeWidth)
        .attr("stroke-opacity", 1)
        .style("background-color", this.options.strokeColor)
        .attr("vector-effect", "non-scaling-stroke");

      // 4. 添加起点div (与参考案例一致)
      this.currentMeasurement.startPointDiv = this.wrapperDiv
        .append("div")
        .attr("id", `startPoint_${id}`)
        .attr("annotationid", id)
        .attr("class", "start-point")
        .style("top", position.percentY + "%")
        .style("left", position.percentX + "%")
        .style("background-color", this.options.strokeColor);
    } catch (error) {
      console.error("Error in startDrawing:", error);
    }
  }

  // 计算百分比位置
  calculatePercentPosition(viewerPoint) {
    const wrapperLeft = this.wrapperDiv.style("left");
    const wrapperTop = this.wrapperDiv.style("top");
    const wrapperWidth = this.wrapperDiv.attr("width");
    const wrapperHeight = this.wrapperDiv.attr("height");
    //console.log("Wrapper div position:", { wrapperLeft, wrapperTop });
    // 计算wrapper div的宽高

    // 去除 px
    const wrapperLeftNum = parseFloat(wrapperLeft.replace("px", ""));
    const wrapperTopNum = parseFloat(wrapperTop.replace("px", ""));

    // 这里本来是需要计算 wrapperLeftNum 和 wrapperTopNum 的
    // 但是修改了MouseTracker 之后 是按照svg container 的x y 来返回 position 的
    // 所以直接使用 viewerPoint.x 和 viewerPoint.y 来计算百分比位置
    // const relativeX = viewerPoint.x - wrapperLeftNum;
    // const relativeY = viewerPoint.y - wrapperTopNum;
    const relativeX = viewerPoint.x;
    const relativeY = viewerPoint.y;

    const percentX = (relativeX / wrapperWidth) * 100;
    const percentY = (relativeY / wrapperHeight) * 100;

    return {
      x: viewerPoint.x,
      y: viewerPoint.y,
      percentX: percentX,
      percentY: percentY,
    };
  }

  updateCurrentMeasurement(viewerPoint) {
    if (!this.currentMeasurement) return;

    try {
      // 计算百分比位置
      const position = this.calculatePercentPosition(viewerPoint);
      this.currentMeasurement.endPoint = position;

      // 更新线条
      this.currentMeasurement.line
        .attr("x2", position.percentX)
        .attr("y2", position.percentY);

      // 如果还没有创建终点，创建它
      if (!this.currentMeasurement.endPointDiv) {
        this.currentMeasurement.endPointDiv = this.wrapperDiv
          .append("div")
          .attr("id", `endPoint_${this.currentMeasurement.id}`)
          .attr("annotationid", this.currentMeasurement.id)
          .attr("class", "end-point custom-cursor-on-hover")
          .attr("background-color", this.options.strokeColor)
          .style("top", position.percentY + "%")
          .style("left", position.percentX + "%")
          .style("background-color", this.options.strokeColor);
      } else {
        this.currentMeasurement.endPointDiv
          .style("top", position.percentY + "%")
          .style("left", position.percentX + "%");
      }

      // 计算中点位置和距离
      const midX =
        (parseFloat(this.currentMeasurement.startPoint.percentX) +
          parseFloat(position.percentX)) /
        2;
      const midY =
        (parseFloat(this.currentMeasurement.startPoint.percentY) +
          parseFloat(position.percentY)) /
        2;

      const distance = Math.round(
        this.calculatePhysicalDistance(
          this.currentMeasurement.startPoint,
          position
        )
      );

      // 如果还没有创建提示标签，创建它
      if (!this.currentMeasurement.tipSpan) {
        this.currentMeasurement.tipSpan = this.wrapperDiv
          .append("span")
          .attr("id", `tip_${this.currentMeasurement.id}`)
          .attr("annotationid", this.currentMeasurement.id)
          .attr("class", "measure-tip")
          .attr("start", this.currentMeasurement.startPoint)
          .attr("background-color", this.options.strokeColor)
          .style("top", midY + "%")
          .style("left", midX + "%")
          .style("background-color", this.options.strokeColor)
          .text(distance + "μm");
      } else {
        this.currentMeasurement.tipSpan
          .style("top", midY + "%")
          .style("left", midX + "%")
          .text(distance + "μm");
      }
    } catch (error) {
      console.error("Error in updateCurrentMeasurement:", error);
    }
  }

  finishCurrentMeasurement(viewerPoint) {
    if (!this.currentMeasurement) return;

    try {
      // 更新终点
      this.updateCurrentMeasurement(viewerPoint);

      // 添加关闭按钮
      if (!this.currentMeasurement.closeDiv) {
        const position = this.calculatePercentPosition(viewerPoint);
        this.currentMeasurement.closeDiv = this.wrapperDiv
          .append("div")
          .attr("id", `close_${this.currentMeasurement.id}`)
          .attr("annotationid", this.currentMeasurement.id)
          .attr("class", "icon-close")
          .style("top", position.percentY + "%")
          .style("left", position.percentX + "%")
          .style("transform", "translate(8px, -8px)")
          .style("z-index", "2000")
          .style("cursor", "pointer")
          .on("click", (event) => {
            //console.log("Close button clicked - D3 event");

            // 找到要删除的测量
            const target = event.target
            if (target.classList.contains('icon-close')) {
              event.stopPropagation();
              event.preventDefault();

              // 获取annotationid属性
              const measurementId = target.getAttribute('annotationid');
              if (measurementId) {
                const measurement = this.measurements.find(m => m.id === measurementId);
                if (measurement) {
                  this.deleteMeasurement(measurement);
                }
              }
            }
          });
      }

      // 添加到测量列表
      this.measurements.push(this.currentMeasurement);

      // 重置当前测量状态
      this.currentMeasurement = null;
      this.isDrawing = false;
    } catch (error) {
      console.error("Error in finishCurrentMeasurement:", error);
    }
  }

  calculatePhysicalDistance(point1, point2) {
    // 将屏幕坐标转换为图像坐标
    try {
      const p1 = new OpenSeadragon.Point(point1.x, point1.y);
      const p2 = new OpenSeadragon.Point(point2.x, point2.y);

      // const imgPoint1 = this.viewer.viewport.windowToImageCoordinates(p1);
      // const imgPoint2 = this.viewer.viewport.windowToImageCoordinates(p2);

      const imgPoint1 = this.viewer.viewport.viewerElementToImageCoordinates(p1);
      const imgPoint2 = this.viewer.viewport.viewerElementToImageCoordinates(p2);


      //console.log('imgPoint1', imgPoint1);
      //console.log('imgPoint2', imgPoint2);
      // //console.log('imgPoint3', imgPoint3);
      // //console.log('imgPoint4', imgPoint4);

      // 计算图像坐标系中的距离(像素)
      const imgDistance = Math.sqrt(
        Math.pow(imgPoint2.x - imgPoint1.x, 2) +
        Math.pow(imgPoint2.y - imgPoint1.y, 2)
      );
      //console.log('imgDistance', imgDistance);
      return imgDistance * this.options.conversionFactor;
    } catch (error) {
      console.error("Error calculating physical distance:", error);

      // 回退到屏幕坐标计算
      const distance = Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
      );

      return distance * 10; // 假设的转换因子
    }
  }

  resetCurrentMeasurement() {
    //console.log("OSDMeasurement: resetCurrentMeasurement");

    if (this.currentMeasurement) {
      // 移除线条
      if (this.currentMeasurement.line) {
        this.currentMeasurement.line.remove();
      }

      // 移除其他元素
      if (this.currentMeasurement.startPointDiv) {
        this.currentMeasurement.startPointDiv.remove();
      }

      if (this.currentMeasurement.endPointDiv) {
        this.currentMeasurement.endPointDiv.remove();
      }

      if (this.currentMeasurement.tipSpan) {
        this.currentMeasurement.tipSpan.remove();
      }

      if (this.currentMeasurement.closeDiv) {
        this.currentMeasurement.closeDiv.remove();
      }
    }

    this.currentMeasurement = null;
    this.isDrawing = false;
  }

  selectMeasurement(measurement) {
    //console.log("OSDMeasurement: selectMeasurement", {measurementId: measurement.id,});

    try {
      // 取消所有测量的选中状态
      this.measurements.forEach((m) => {
        m.selected = false;
        m.line.attr("stroke-dasharray", "0");
      });
      //console.log("Reset selection state for all measurements");

      // 选中当前测量
      measurement.selected = true;
      measurement.line.attr("stroke-dasharray", "5,5");
      //console.log("Selected measurement:", measurement.id);
    } catch (error) {
      console.error("Error in selectMeasurement:", error);
    }
  }

  deleteSelectedMeasurement() {
    //console.log("OSDMeasurement: deleteSelectedMeasurement");

    const selectedIndex = this.measurements.findIndex((m) => m.selected);
    //console.log("Selected measurement index:", selectedIndex);

    if (selectedIndex >= 0) {
      this.deleteMeasurement(this.measurements[selectedIndex]);
    }
  }

  deleteMeasurement(measurement) {
    //console.log("OSDMeasurement: deleteMeasurement", { : measurement.id,});
    if (!measurement) {
      console.error("Attempted to delete undefined measurement");
      return;
    }

    try {
      const index = this.measurements.indexOf(measurement);
      //console.log("Measurement index in list:", index);

      if (index !== -1) {
        // 移除元素
        if (measurement.line) {
          measurement.line.remove();
        }

        if (measurement.startPointDiv) {
          measurement.startPointDiv.remove();
        }

        if (measurement.endPointDiv) {
          measurement.endPointDiv.remove();
        }

        if (measurement.tipSpan) {
          measurement.tipSpan.remove();
        }

        if (measurement.closeDiv) {
          measurement.closeDiv.remove();
        }

        // 从列表中移除
        this.measurements.splice(index, 1);
        //console.log( "Removed measurement from list, remaining:", this.measurements.length);
      }
    } catch (error) {
      console.error("Error in deleteMeasurement:", error);
    }
  }

  undo() {
    //console.log("OSDMeasurement: undo");

    if (this.measurements.length > 0) {
      const lastMeasurement = this.measurements.pop();
      //console.log("Undoing last measurement:", lastMeasurement.id);

      // 移除元素
      if (lastMeasurement.line) {
        lastMeasurement.line.remove();
      }

      if (lastMeasurement.startPointDiv) {
        lastMeasurement.startPointDiv.remove();
      }

      if (lastMeasurement.endPointDiv) {
        lastMeasurement.endPointDiv.remove();
      }

      if (lastMeasurement.tipSpan) {
        lastMeasurement.tipSpan.remove();
      }

      if (lastMeasurement.closeDiv) {
        lastMeasurement.closeDiv.remove();
      }
      //console.log("Removed last measurement, remaining:", this.measurements.length);
    } else {
      //console.log("No measurements to undo");
    }
  }

  redo() {
    //console.log("OSDMeasurement: redo - not implemented");
  }

  clear() {
    //console.log("OSDMeasurement: clear");
    // 清除所有测量
    this.measurements.forEach((measurement) => {
      // 移除所有元素
      if (measurement.line) {
        measurement.line.remove();
      }

      if (measurement.startPointDiv) {
        measurement.startPointDiv.remove();
      }

      if (measurement.endPointDiv) {
        measurement.endPointDiv.remove();
      }

      if (measurement.tipSpan) {
        measurement.tipSpan.remove();
      }

      if (measurement.closeDiv) {
        measurement.closeDiv.remove();
      }
    });

    this.measurements = [];
    this.resetCurrentMeasurement();
    //console.log("All measurements cleared");
  }

  calculateDistance(point1, point2) {
    const distance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
    // //console.log('OSDMeasurement: calculateDistance', { point1, point2, distance });
    return distance;
  }

  formatDistance(distance) {
    let formattedDistance = "";
    // 根据距离大小选择合适的单位
    if (distance < 0.1) {
      formattedDistance = (distance * 1000).toFixed(2) + " μm";
    } else if (distance < 10) {
      formattedDistance = distance.toFixed(2) + " mm";
    } else {
      formattedDistance = (distance / 10).toFixed(2) + " cm";
    }
    //console.log('OSDMeasurement: formatDistance', { distance, formattedDistance });
    return formattedDistance;
  }

  setMeasurementColor(color) {
    //console.log("OSDMeasurement: setMeasurementColor", { color });
    this.options.strokeColor = color;

    // 更新所有测量的颜色
    this.measurements.forEach((measurement, index) => {
      //console.log(`Updating color for measurement ${index}`, measurement);
      if (measurement.line) {
        measurement.line.attr("stroke", color);
      }
      if (measurement.startPointDiv) {
        measurement.startPointDiv
          .attr("background-color", color)
          .style("background-color", color);
      }
      if (measurement.endPointDiv) {
        measurement.endPointDiv
          .attr("background-color", color)
          .style("background-color", color);
      }
      if (measurement.tipSpan) {
        measurement.tipSpan
          .attr("background-color", color)
          .style("background-color", color);
      }
    });
  }

  exportCSV() {
    //console.log("OSDMeasurement: exportCSV");

    // 导出测量数据为CSV
    if (this.measurements.length === 0) {
      //console.log("No measurements to export");
      return;
    }

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent +=
        "ID,StartX,StartY,EndX,EndY,Distance(px),PhysicalDistance\n";

      this.measurements.forEach((measurement, index) => {
        //console.log(`Processing measurement ${index} for CSV export`);
        try {
          // 计算物理距离
          const imagePoint1 =
            this.viewer.viewport.viewerElementToImageCoordinates(
              new OpenSeadragon.Point(
                measurement.startPoint.x,
                measurement.startPoint.y
              )
            );
          const imagePoint2 =
            this.viewer.viewport.viewerElementToImageCoordinates(
              new OpenSeadragon.Point(
                measurement.endPoint.x,
                measurement.endPoint.y
              )
            );

          const imageDistance = Math.sqrt(
            Math.pow(imagePoint2.x - imagePoint1.x, 2) +
            Math.pow(imagePoint2.y - imagePoint1.y, 2)
          );
          const physicalDistance =
            imageDistance * this.options.conversionFactor;
          const formattedDistance = this.formatDistance(physicalDistance);

          const pixelDistance = this.calculateDistance(
            measurement.startPoint,
            measurement.endPoint
          );

          csvContent += `${measurement.id},${measurement.startPoint.x.toFixed(
            2
          )},${measurement.startPoint.y.toFixed(
            2
          )},${measurement.endPoint.x.toFixed(
            2
          )},${measurement.endPoint.y.toFixed(2)},${pixelDistance.toFixed(
            2
          )},${formattedDistance}\n`;
        } catch (conversionError) {
          console.error(
            "Error processing measurement for CSV:",
            conversionError
          );
          csvContent += `${measurement.id},Error,Error,Error,Error,Error,Error\n`;
        }
      });

      //console.log("CSV content generated");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "measurements.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      //console.log("CSV download triggered");
    } catch (error) {
      console.error("Error in exportCSV:", error);
    }
  }

  destroy() {
    //console.log("OSDMeasurement: destroy");
    try {
      // 清除所有测量
      this.clear();

      // 移除事件监听器
      if (this.mouseTracker) {
        this.mouseTracker.destroy();
        //console.log("Destroyed mouse tracker");
      }
      document.removeEventListener("keydown", this.handleKeyDown);
      //console.log("Removed keyboard event listener");

      // 移除SVG覆盖层
      if (this.backgroundDiv) {
        this.backgroundDiv.remove();
        //console.log("Removed background div");
      }

      // 移除OpenSeadragon事件处理器
      this.viewer.removeHandler("animation", this.updateSvgWrapperFrame);
      this.viewer.removeHandler("open", this.updateSvgWrapperFrame);
      this.viewer.removeHandler("resize", this.updateSvgWrapperFrame);
      //console.log("Removed OSD event handlers");
    } catch (error) {
      console.error("Error in destroy:", error);
    }
  }
}