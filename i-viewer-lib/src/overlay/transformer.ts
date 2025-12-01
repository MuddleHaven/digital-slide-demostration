import type * as OverlayManagerTypes from './types'
import Konva from 'konva'

interface ITransformerOptions {
  stage: Konva.Stage
  layer: Konva.Layer
  shapeList: OverlayManagerTypes.Shape[]
  transformComplete: (shape: OverlayManagerTypes.Shape) => void
}

/**
 * 自定义transformer
 */
export default class ITransformer {
  private _options: ITransformerOptions

  private _transformer: Konva.Transformer

  private _customTransformer: Konva.Group

  private _transformerShape: Konva.Node | null = null

  /**
   * 构造函数
   * @param {ITransformerOptions} options 配置
   */
  constructor(options: ITransformerOptions) {
    this._options = options
    this._transformer = this._initTransformer()
    this._customTransformer = this._initCustomTransformer()
  }

  /**
   * 初始化transformer
   * @returns transformer
   */
  private _initTransformer() {
    const transformer = new Konva.Transformer({
      padding: 4,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    })
    this._options.layer.add(transformer)
    return transformer
  }

  /**
   * 初始化自定义transformer
   * @returns 自定义transformer
   */
  private _initCustomTransformer() {
    const transformerGroup = new Konva.Group()
    this._options.layer.add(transformerGroup)
    return transformerGroup
  }

  /**
   * 判断是否是自定义transformer
   * @param {OverlayManager.Shape | Konva.Node} shape 形状
   * @returns 是否是自定义transformer
   */
  private _isCustomTransformer(shape: OverlayManagerTypes.Shape | Konva.Node) {
    return !(shape instanceof Konva.Circle
      || shape instanceof Konva.Rect
      || shape instanceof Konva.Ellipse || shape instanceof Konva.Path)
  }

  /**
   * 创建自定义transformer锚点
   * @param {OverlayManager.Point} point 点
   * @returns 锚点
   */
  private _createCustomTransformerAnchor(point: OverlayManagerTypes.Point) {
    const anchor = new Konva.Rect({
      x: point.x,
      y: point.y,
      width: this._transformer.anchorSize() / this._options.stage.scaleX(),
      height: this._transformer.anchorSize() / this._options.stage.scaleX(),
      fill: this._transformer.anchorFill(),
      stroke: this._transformer.anchorStroke(),
      strokeWidth: this._transformer.anchorStrokeWidth() / this._options.stage.scaleX(),
      offsetX: this._transformer.anchorSize() / 2 / this._options.stage.scaleX(),
      offsetY: this._transformer.anchorSize() / 2 / this._options.stage.scaleX(),
      draggable: true,
      selectable: false,
      visible: true,
    })
    return anchor
  }

  /**
   * 编码点
   * @param {Konva.Arrow | Konva.Line} shape 形状
   * @returns 点
   */
  private _encodePoints(shape: Konva.Arrow | Konva.Line) {
    const pointsRaw = shape.points()
    return pointsRaw.reduce((acc: OverlayManagerTypes.Point[], point: number, index: number) => {
      if (index % 2 === 0) {
        acc.push({ x: point, y: pointsRaw[index + 1] })
      }
      return acc
    }, [])
  }

  /**
   * 解码点
   * @param {OverlayManagerTypes.Point[]} points 点
   * @returns 点
   */
  private _decodePoints(points: OverlayManagerTypes.Point[]) {
    return points.reduce((acc: number[], point: OverlayManagerTypes.Point) => {
      acc.push(point.x)
      acc.push(point.y)
      return acc
    }, [])
  }

  /**
   * 隐藏所有锚点
   */
  private _hideAllAnchor() {
    const customTransformerShape = this._customTransformer.getChildren()
    customTransformerShape.forEach((shape) => {
      shape.visible(false)
    })
  }

  /**
   * 自定义节点
   * @param {Konva.Arrow | Konva.Line} shape 形状
   */
  private _customNodes(shape?: Konva.Arrow | Konva.Line) {
    const customTransformerShape = this._customTransformer.getChildren()
    this._hideAllAnchor()
    if (!shape)
      return
    const transform = shape.getTransform()
    const points = this._encodePoints(shape)
    points.forEach((point, index) => {
      const newPoint = transform.point(point)
      if (customTransformerShape[index]) {
        customTransformerShape[index].position({
          x: newPoint.x,
          y: newPoint.y,
        }).visible(true)
      }
      else {
        const anchor = this._createCustomTransformerAnchor(newPoint)
        this._customTransformer.add(anchor)
      }
      this._initCustomTransformerAnchorEvent(
        shape,
        this._customTransformer.getChildren()[index] as Konva.Rect,
        index,
      )
    })
    this._customTransformer.moveToTop()
  }

  /**
   * 更新点
   * @param {Konva.Arrow | Konva.Line} shape 形状
   * @param {OverlayManagerTypes.Point} point 点
   * @param {number} anchorIndex 锚点索引
   */
  private _updatePoints(shape: Konva.Arrow | Konva.Line, point: OverlayManagerTypes.Point, anchorIndex: number) {
    const points = this._encodePoints(shape)
    const transform = shape.getTransform().copy().invert()
    points[anchorIndex] = transform.point(point)
    const decodePoints = this._decodePoints(points)
    shape.points(decodePoints)
  }

  /**
   * 更新锚点
   * @param {Konva.Arrow | Konva.Line} shape 形状
   */
  private _updateAnchor(shape: Konva.Arrow | Konva.Line) {
    const transform = shape.getTransform()
    const points = this._encodePoints(shape)
    const customTransformerShape = this._customTransformer.getChildren()
    points.forEach((point, index) => {
      const newPoint = transform.point(point)
      if (customTransformerShape[index]) {
        customTransformerShape[index].position({
          x: newPoint.x,
          y: newPoint.y,
        })
      }
    })
  }

  /**
   * 锚点拖拽事件
   * @param {Konva.Arrow | Konva.Line} shape 形状
   * @param {Konva.Rect} anchor 锚点
   * @param {number} anchorIndex 锚点索引
   */
  private _anchorDragEvent(shape: Konva.Arrow | Konva.Line, anchor: Konva.Rect, anchorIndex: number) {
    const pos = anchor.position()
    if (pos) {
      this._updatePoints(shape, pos, anchorIndex)
    }
  }

  /**
   * 形状拖拽事件
   * @param {Konva.Arrow | Konva.Line} shape 形状
   */
  private _shapeDragEvent(shape: Konva.Arrow | Konva.Line) {
    const pos = shape.position()
    if (pos) {
      this._updateAnchor(shape)
    }
  }

  /**
   * 初始化自定义transformer锚点事件
   * @param {Konva.Arrow | Konva.Line} shape 形状
   * @param {Konva.Rect} anchor 锚点
   * @param {number} anchorIndex 锚点索引
   */
  private _initCustomTransformerAnchorEvent(shape: Konva.Arrow | Konva.Line, anchor: Konva.Rect, anchorIndex: number) {
    // 先移除事件
    anchor.off('dragstart.transformer dragmove.transformer dragend.transformer')
    shape.off('dragstart.transformer dragmove.transformer dragend.transformer')
    // 再添加事件
    anchor.on('dragstart.transformer dragmove.transformer dragend.transformer', (e) => {
      this._anchorDragEvent(shape, anchor, anchorIndex)
      if (e.type === 'dragstart') {
        shape.fire('transformstart')
      }
      else if (e.type === 'dragmove') {
        shape.fire('transform')
      }
      else if (e.type === 'dragend') {
        shape.fire('transformend')
      }
    })
    shape.on('dragstart.transformer dragmove.transformer dragend.transformer', () => {
      this._shapeDragEvent(shape)
    })
  }

  /**
   * 设置transformer
   * @param { Konva.Node} shape 形状
   */
  public nodes(shape?: Konva.Node) {
    // 如果选择的是自定义的锚点，则不进行设置
    if (this.isCustomTransformerShape(shape)) {
      return
    }
    this._transformer.nodes([])
    this._customNodes()
    this._transformerShape?.fire('unselect')
    this._transformerShape?.off('transformend.transformer')
    this._transformerShape = null
    if (!shape) {
      return
    }
    this._transformerShape = shape
    this._transformerShape.on('transformend.transformer', () => {
      const target = this._options.shapeList.find(shape => shape.getMainShape() === this._transformerShape)
      if (target) {
        this._options.transformComplete(target)
      }
    })
    if (!this._isCustomTransformer(shape)) {
      this._transformer.nodes([shape as Konva.Node])
      if (shape instanceof Konva.Circle) {
        this._transformer.keepRatio(true)
      }
      else {
        this._transformer.keepRatio(false)
      }
    }
    else {
      this._customNodes(shape as Konva.Arrow | Konva.Line)
    }
    this._transformerShape?.fire('select')
  }

  /**
   * 判断是否是自定义transformer形状
   * @param {Konva.Node} shape 形状
   * @returns 是否是自定义transformer形状
   */
  public isCustomTransformerShape(shape?: Konva.Node) {
    if (!shape)
      return false
    return this._customTransformer.getChildren().includes(shape as Konva.Rect)
  }

  /**
   * 调整OSD
   */
  public adjustOsd() {
    const customTransformerShape = this._customTransformer.getChildren()
    customTransformerShape.forEach((shape) => {
      (shape as Konva.Rect).size({
        width: this._transformer.anchorSize() / this._options.stage.scaleX(),
        height: this._transformer.anchorSize() / this._options.stage.scaleX(),
      }).offset({
        x: this._transformer.anchorSize() / 2 / this._options.stage.scaleX(),
        y: this._transformer.anchorSize() / 2 / this._options.stage.scaleX(),
      }).strokeWidth(this._transformer.anchorStrokeWidth() / this._options.stage.scaleX())
    })
  }

  /**
   * 获取transformer形状
   * @returns transformer形状
   */
  public getTransformerShape() {
    return this._transformerShape
  }

  /**
   * 销毁transformer
   */
  public destroy() {
    this._transformer.destroy()
    this._customTransformer.destroy()
  }
}
