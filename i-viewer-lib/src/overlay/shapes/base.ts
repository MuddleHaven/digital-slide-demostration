import type ITransformer from '../transformer'
import type * as OverlayManagerTypes from '../types'
import Konva from 'konva'
import { ArrowMultipleStrokeWidth, DRAW_MODE } from '../../utils/constants'
import Label from '../label'

export interface Options extends Required<OverlayManagerTypes.BaseShapeOptions> {
  shapeOptions: Required<OverlayManagerTypes.ShapeOptions>
  labelOptions: Required<OverlayManagerTypes.LabelOptions>
}

export default abstract class BaseShape {
  protected _mainShape!: OverlayManagerTypes.MainShape

  protected _startPoint!: OverlayManagerTypes.Point

  protected _stage: Konva.Stage
  protected _layer: Konva.Layer
  protected _transformer: ITransformer
  protected _shapeOptions: Options['shapeOptions']
  protected _labelOptions: Options['labelOptions']

  protected _label: Label | null = null

  constructor(options: Options, attrs?: OverlayManagerTypes.ShapeAttr) {
    this._stage = options.stage
    this._layer = options.layer
    this._transformer = options.transformer
    this._shapeOptions = options.shapeOptions
    this._labelOptions = options.labelOptions
    if (attrs) {
      this._shapeOptions.stroke = attrs.stroke || this._shapeOptions.stroke
      this._shapeOptions.strokeWidth = attrs.strokeWidth || this._shapeOptions.strokeWidth
    }
    // 放入异步队列，避免在构造函数中获取不到mainShape
    setTimeout(() => {
      this._initLabel()
      if (attrs) {
        this._label?.updateLabel(this._mainShape)
        this._label?.visible(false)
      }
    }, 0)
    this._transformer.nodes()
  }

  protected abstract _createShape(point: OverlayManagerTypes.Point, attr?: OverlayManagerTypes.ShapeAttr): OverlayManagerTypes.MainShape

  protected abstract _updateShape(point: OverlayManagerTypes.Point): void

  protected abstract _completeShape(point: OverlayManagerTypes.Point): void

  /**
   * 初始化标签
   */
  private _initLabel() {
    this._label = new Label(this._stage, this._layer, this._mainShape, {
      ...this._labelOptions,
      visible: this._mainShape.getAttrs().measurement.shapeType !== DRAW_MODE.Polygon,
    })
  }

  /**
   * 更新形状
   * @param point 点
   */
  public updateShape(point: OverlayManagerTypes.Point) {
    this._updateShape(point)
    this._label?.updateLabel(this._mainShape)
  }

  /**
   * 完成绘制
   * @param point 点
   */
  public completeShape(point: OverlayManagerTypes.Point) {
    this._completeShape(point)
    this._label?.updateLabel(this._mainShape)
    this._transformer.nodes(this._mainShape)
    if (this._mainShape.getAttrs().measurement.shapeType === DRAW_MODE.Polygon) {
      this._label?.visible(true)
    }
  }

  /**
   * 获取主形状
   * @returns 主形状
   */
  public getMainShape() {
    return this._mainShape
  }

  /**
   * 调整OSD
   */
  public adjustOsd() {
    this._transformer.adjustOsd()
    this._label?.adjustOsd()
    if (this._mainShape instanceof Konva.Arrow) {
      if (this._mainShape.pointerLength()) {
        this._mainShape.pointerLength(this._shapeOptions.strokeWidth * ArrowMultipleStrokeWidth / this._stage.scaleX())
      }
      if (this._mainShape.pointerWidth()) {
        this._mainShape.pointerWidth(this._shapeOptions.strokeWidth * ArrowMultipleStrokeWidth / this._stage.scaleX())
      }
    }
    if (this._mainShape instanceof Konva.Path) {
      this._mainShape.scale({ x: 1 / this._stage.scaleX(), y: 1 / this._stage.scaleX() })
    }
  }

  public setLabelOptions(options: OverlayManagerTypes.LabelOptions) {
    this._labelOptions = {
      ...this._labelOptions,
      ...options,
    }
    this._label?.setLabelOptions(options)
  }

  public visible(visible: boolean) {
    if (!visible) {
      this._transformer.nodes()
      this._label?.visible(visible)
    }
    this._mainShape.visible(visible)
  }

  public setLabelVisible(visible: boolean) {
    this._label?.visible(visible)
  }

  /**
   * 销毁
   */
  public destroy() {
    this._mainShape.destroy()
    this._label?.destroy()
  }
}
