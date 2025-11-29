import OpenSeadragon from 'openseadragon';

/**
 * SVG 覆盖层类
 * 基于 OpenSeadragon SVG Overlay 插件改写
 * 用于在 OpenSeadragon 视图上创建 SVG 覆盖层
 */
export default class SvgOverlay {
  private viewer: OpenSeadragon.Viewer;
  private containerWidth: number = 0;
  private containerHeight: number = 0;
  private svg: SVGSVGElement;
  private node: SVGGElement;

  /**
   * 构造函数
   * @param viewer OpenSeadragon 查看器
   */
  constructor(viewer: OpenSeadragon.Viewer) {
    this.viewer = viewer;

    // 创建 SVG 元素
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.position = 'absolute';
    this.svg.style.left = '0';
    this.svg.style.top = '0';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.viewer.canvas.appendChild(this.svg);

    // 创建根组元素
    this.node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svg.appendChild(this.node);

    // 添加事件处理器
    this.setupEventHandlers();

    // 初始调整大小
    this.resize();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 使用绑定的方法，以便可以正确移除事件处理器
    const boundResize = this.resize.bind(this);

    // 动画事件
    this.viewer.addHandler('animation', boundResize);

    // 打开事件
    this.viewer.addHandler('open', boundResize);

    // 旋转事件
    this.viewer.addHandler('rotate', boundResize);

    // 翻转事件
    this.viewer.addHandler('flip', boundResize);

    // 调整大小事件
    this.viewer.addHandler('resize', boundResize);
  }

  /**
   * 获取根组元素
   * @returns SVG 根组元素
   */
  public getNode(): SVGGElement {
    return this.node;
  }

  /**
   * 获取 SVG 元素
   * @returns SVG 元素
   */
  public getSvg(): SVGSVGElement {
    return this.svg;
  }

  /**
   * 调整大小并更新变换
   */
  public resize(): void {
    // 更新 SVG 容器尺寸
    if (this.containerWidth !== this.viewer.container.clientWidth) {
      this.containerWidth = this.viewer.container.clientWidth;
      this.svg.setAttribute('width', String(this.containerWidth));
    }

    if (this.containerHeight !== this.viewer.container.clientHeight) {
      this.containerHeight = this.viewer.container.clientHeight;
      this.svg.setAttribute('height', String(this.containerHeight));
    }

    // 计算变换
    const p = this.viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
    const zoom = this.viewer.viewport.getZoom(true);
    const rotation = this.viewer.viewport.getRotation();
    const flipped = this.viewer.viewport.getFlip();

    // 获取容器内部尺寸
    // @ts-ignore: 访问私有属性
    const containerSizeX = this.viewer.viewport._containerInnerSize.x;
    let scaleX = containerSizeX * zoom;
    const scaleY = scaleX;

    // 处理翻转
    if (flipped) {
      // 使 x 缩放分量为负值以翻转 SVG
      scaleX = -scaleX;
      // 当 x 缩放为负值时，将 SVG 平移回正确的坐标
      p.x = -p.x + containerSizeX;
    }

    // 应用变换
    this.node.setAttribute('transform',
      `translate(${p.x},${p.y}) scale(${scaleX},${scaleY}) rotate(${rotation})`);
  }

  public destroy() {
    this.viewer.canvas.removeChild(this.svg);
  }
}
