import type * as OverlayManagerTypes from '../types'
import Konva from 'konva'
import { LABEL_TYPE } from '@/utils/constants'
import MeasurementController from './measurement'

interface Options extends Required<OverlayManagerTypes.LabelOptions> {
  visible: boolean
}

export default class Label {
  private _stage: Konva.Stage

  private _layer: Konva.Layer

  private _shape: OverlayManagerTypes.MainShape

  private _options: Options

  private _labelShape: Konva.Label

  private _measurementController: MeasurementController

  private _padding: number = 8

  private _shadow: number = 10

  private _rounded: number = 4

  constructor(stage: Konva.Stage, layer: Konva.Layer, shape: OverlayManagerTypes.MainShape, options: Options) {
    this._stage = stage
    this._layer = layer
    this._shape = shape
    this._options = options
    this._labelShape = this._initLabelShape()
    this._measurementController = new MeasurementController(this._stage, this._options.pixelSize, {
      [`${LABEL_TYPE.MEASUREMENT}Visible`]: this._options[`${LABEL_TYPE.MEASUREMENT}Visible`],
      [`${LABEL_TYPE.TAG}Visible`]: this._options[`${LABEL_TYPE.TAG}Visible`],
      [`${LABEL_TYPE.DESCRIPTION}Visible`]: this._options[`${LABEL_TYPE.DESCRIPTION}Visible`],
    })

    this._initShapeEvent()
  }

  /**
   * 初始化标签形状
   * @returns 标签形状
   */
  private _initLabelShape() {
    const label = new Konva.Label({
      draggable: false,
      visible: false,
      listening: false,
    })
    const tag = new Konva.Tag({
      fill: '#262626',
      shadowColor: '#262626',
      shadowBlur: this._shadow / this._stage.scaleX(),
      shadowOffsetX: this._shadow / this._stage.scaleX(),
      shadowOffsetY: this._shadow / this._stage.scaleX(),
      shadowOpacity: 0.5,
      padding: this._padding / this._stage.scaleX(),
      cornerRadius: this._rounded / this._stage.scaleX(),
    })
    const text = new Konva.Text({
      text: '',
      fontSize: this._options.fontSize / this._stage.scaleX(),
      fill: '#fff',
      lineHeight: 1.4,
    })
    label.add(tag)
    label.add(text)
    this._layer.add(label)
    return label
  }

  /**
   * 初始化形状事件
   */
  private _initShapeEvent() {
    this._shape.on('transformstart.label transform.label transformend.label', () => {
      this.updateLabel(this._shape)
    })

    this._shape.on('dragstart.label dragmove.label dragend.label', () => {
      this.updateLabel(this._shape)
    })

    this._shape.on('select.label', () => {
      this.visible(true)
    })

    this._shape.on('unselect.label', () => {
      this.visible(false)
    })

    this._shape.on('dblclick.label', () => {
      const measurement = this._shape.getAttrs().measurement
      this._options.editDescriptionEvent(measurement.description, (description: string) => {
        this._shape.setAttrs({
          measurement: {
            ...measurement,
            description,
          },
        })
        this.updateLabel(this._shape)
      })
    })
  }

  /**
   * 获取形状的中心点
   * @param {OverlayManagerTypes.MainShape} shape 形状
   * @returns 形状的中心点
   */
  private _getShapeCenter(shape: OverlayManagerTypes.MainShape) {
    // 获取形状的客户端矩形（包围盒）
    const clientRect = shape.getClientRect()
    const realPoint = {
      x: clientRect.x + clientRect.width / 2,
      y: clientRect.y + clientRect.height / 2,
    }

    const transformInvert = this._stage.getTransform().copy().invert()
    const transformedPoint = transformInvert.point(realPoint)

    return transformedPoint
  }

  /**
   * 更新标签
   * @param {OverlayManagerTypes.MainShape} shape 形状
   */
  public updateLabel(shape: OverlayManagerTypes.MainShape) {
    const position = this._getShapeCenter(shape)
    this._labelShape
      .position({
        x: position.x,
        y: position.y,
      })
      .visible(this._options.alwaysVisible ? true : this._options.visible)
    const text = this._measurementController.getMeasurementText(shape)
    this._labelShape.getText()
      .fontSize(this._options.fontSize / this._stage.scaleX())
    this._labelShape.getText().text(this._measurementController.getMeasurementText(shape))
    this._labelShape.getText().padding(this._padding / this._stage.scaleX())
    this._labelShape.visible(text ? this._labelShape.visible() : false)

    this._labelShape.moveToTop()
  }

  /**
   * 调整OSD
   */
  public adjustOsd() {
    this._labelShape?.getText()
      ?.padding(this._padding / this._stage.scaleX())
      ?.fontSize(this._options.fontSize / this._stage.scaleX())
    this._labelShape.getTag()
      .shadowBlur(this._shadow / this._stage.scaleX())
      .shadowOffsetX(this._shadow / this._stage.scaleX())
      .shadowOffsetY(this._shadow / this._stage.scaleX())
      .cornerRadius(this._rounded / this._stage.scaleX())
    // 重置标签旋转，然后应用反向旋转
    this._labelShape.rotation(0)
    this._labelShape.rotate(-1 * this._stage.rotation())
  }

  /**
   * 设置标签可见性
   * @param {boolean} visible 是否可见
   */
  public visible(visible: boolean) {
    if (this._options.alwaysVisible) {
      return
    }
    this._options.visible = visible
    this._labelShape.visible(visible)
  }

  public setLabelOptions(options: OverlayManagerTypes.LabelOptions) {
    this._options = {
      ...this._options,
      ...options,
    }
    this._measurementController.setLabelThinsVisible({
      [`${LABEL_TYPE.MEASUREMENT}Visible`]: this._options[`${LABEL_TYPE.MEASUREMENT}Visible`],
      [`${LABEL_TYPE.TAG}Visible`]: this._options[`${LABEL_TYPE.TAG}Visible`],
      [`${LABEL_TYPE.DESCRIPTION}Visible`]: this._options[`${LABEL_TYPE.DESCRIPTION}Visible`],
    })
    this.updateLabel(this._shape)
  }

  public destroy() {
    this._labelShape.destroy()
  }
}
