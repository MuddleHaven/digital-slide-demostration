import type OpenSeadragon from 'openseadragon'
import type { OsdManager } from '../osd'
import type Polygon from './shapes/polygon'
import type * as OverlayManagerTypes from './types.d'
import Konva from 'konva'
import { DRAW_MODE, EVENT_OWNER, LABEL_TYPE } from '@/utils/constants'
import EventController, { EventName } from './event'
import OsdKonva from './osd-konva'
import ShapeFactory from './shapes/factory'
import ITransformer from './transformer'
import { getCorrectPointerPosition } from './utils'
import './index.css'

// 导出类型
export type {
  BaseMeasurement,
  CircleMeasurement,
  CursorStyle,
  DrawMode,
  EllipseMeasurement,
  EventOnwer,
  LabelOptions,
  LabelThinsVisible,
  LabelType,
  MainShape,
  Point,
  PolygonMeasurement,
  RectMeasurement,
  RulerMeasurement,
  Shape,
  ShapeAttr,
  ShapeOptions,
} from './types.d'

interface IRequiredOverlayManagerOptions {
  shapeOptions: Required<OverlayManagerTypes.ShapeOptions>
  labelOptions: Required<OverlayManagerTypes.LabelOptions>
}

interface IOverlayManagerOptions {
  shapeOptions?: OverlayManagerTypes.ShapeOptions
  labelOptions?: OverlayManagerTypes.LabelOptions
}

const defaultShapeOptions: IRequiredOverlayManagerOptions = {
  shapeOptions: {
    strokeWidth: 4,
    stroke: '#000',
    visible: true,
    drawComplete: () => { },
    dragComplete: () => { },
    transformComplete: () => { },
    deleteComplete: () => { },
  },
  labelOptions: {
    fontSize: 14,
    pixelSize: 1,
    alwaysVisible: false,
    [`${LABEL_TYPE.MEASUREMENT}Visible`]: true,
    [`${LABEL_TYPE.TAG}Visible`]: true,
    [`${LABEL_TYPE.DESCRIPTION}Visible`]: true,
    tag: '标记',
    editDescriptionEvent: () => { },
  },
}

export class OverlayManager {
  private _viewer: OpenSeadragon.Viewer
  private _overlayManagerOptions: IRequiredOverlayManagerOptions

  private _container: HTMLDivElement
  private _stage: Konva.Stage
  private _layer: Konva.Layer
  private _eventController: EventController
  private _transformer: ITransformer

  private _drawMode: OverlayManagerTypes.DrawMode = DRAW_MODE.Move
  private _drawingShape: OverlayManagerTypes.Shape | null = null
  private _shapeList: OverlayManagerTypes.Shape[] = []

  constructor(osdManager: OsdManager, overlayManagerOptions: IOverlayManagerOptions) {
    this._viewer = osdManager.getViewer()
    this._overlayManagerOptions = this._initOverlayManagerOptions(overlayManagerOptions)
    this._container = this._initContainer()
    this._stage = this._initStage()
    this._layer = this._initLayer()
    this._transformer = this._initTransformer()
    this._eventController = this._initEventController()
    this._initOsdKonva()
  }

  private _initOverlayManagerOptions(overlayManagerOptions: IOverlayManagerOptions) {
    return {
      shapeOptions: {
        ...defaultShapeOptions.shapeOptions,
        ...overlayManagerOptions.shapeOptions,
      },
      labelOptions: {
        ...defaultShapeOptions.labelOptions,
        ...overlayManagerOptions.labelOptions,
      },
    }
  }

  /**
   * 初始化容器
   * @returns {HTMLDivElement} 容器
   */
  private _initContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.setAttribute('name', 'overlay-container')
    container.style.position = 'absolute'
    container.style.top = '0'
    container.style.left = '0'
    container.style.bottom = '0'
    container.style.right = '0'
    this._viewer.canvas.appendChild(container)
    return container
  }

  /**
   * 初始化stage
   * @returns stage
   */
  private _initStage() {
    const stage = new Konva.Stage({
      container: this._container,
      width: this._container.clientWidth,
      height: this._container.clientHeight,
    })
    return stage
  }

  /**
   * 初始化layer
   * @returns layer
   */
  private _initLayer() {
    const layer = new Konva.Layer()
    this._stage.add(layer)
    return layer
  }

  /**
   * 初始化事件控制器
   * @returns 事件控制器
   */
  private _initEventController() {
    const eventController = new EventController({
      viewer: this._viewer,
      stage: this._stage,
      drawMode: this._drawMode,
      transformer: this._transformer,
      shapeList: this._shapeList,
      resetDraw: this._resetDraw.bind(this),
      setCursor: this._setCursor.bind(this),
      dragComplete: this._overlayManagerOptions.shapeOptions.dragComplete.bind(this),
      deleteComplete: this._overlayManagerOptions.shapeOptions.deleteComplete.bind(this),
    })
    eventController.on(EventName.Mousedown, this._startDraw.bind(this))
    eventController.on(EventName.Mousemove, this._draw.bind(this))
    eventController.on(EventName.Mouseup, this._endDraw.bind(this))
    return eventController
  }

  /**
   * 初始化transformer
   * @returns transformer
   */
  private _initTransformer() {
    const transformer = new ITransformer({
      stage: this._stage,
      layer: this._layer,
      shapeList: this._shapeList,
      transformComplete: this._overlayManagerOptions.shapeOptions.transformComplete.bind(this),
    })
    return transformer
  }

  /**
   * 初始化osd-konva
   * @returns osd-konva
   */
  private _initOsdKonva() {
    const osdKonva = new OsdKonva(this._viewer, this._container, this._stage, this._layer)
    osdKonva.addAdjust(() => {
      this._shapeList.forEach((shape) => {
        shape.adjustOsd()
      })
    })
    return osdKonva
  }

  /**
   * 初始化形状
   * @param {OverlayManager.Point} point 点
   * @returns 形状
   */
  private _initShape(point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    const shape = ShapeFactory.createShape(attrs ? attrs.measurement.shapeType : this._drawMode, {
      stage: this._stage,
      layer: this._layer,
      transformer: this._transformer,
      shapeOptions: this._overlayManagerOptions.shapeOptions,
      labelOptions: this._overlayManagerOptions.labelOptions,
    }, point, attrs)
    return shape
  }

  /**
   * 绘制多边形
   * @param { 'start' | 'draw' | 'end'} step 步骤
   */
  private _drawPolygon(step: 'start' | 'draw' | 'end') {
    const pos = getCorrectPointerPosition(this._stage)
    if (!pos) {
      this._resetDraw(true)
      return
    }
    if (step === 'start') {
      if (!this._drawingShape) {
        this._drawingShape = this._initShape(pos)
      }
      else {
        (this._drawingShape as Polygon).addPoint(pos)
      }
    }
    if (!this._drawingShape) {
      return
    }
    if (step === 'draw') {
      this._drawingShape.updateShape(pos)
    }
    if (step === 'end') {
      if ((this._drawingShape as Polygon).checkIsCompleted()) {
        this._completeShape(pos)
      }
    }
  }

  /**
   * 开始绘制
   */
  private _startDraw() {
    // 单独处理多边形
    if (this._drawMode === DRAW_MODE.Polygon) {
      this._drawPolygon('start')
      return
    }
    if (this._drawingShape || this._drawMode === DRAW_MODE.Move) {
      return
    }
    const pos = getCorrectPointerPosition(this._stage)
    if (!pos) {
      this._resetDraw(true)
      return
    }
    this._drawingShape = this._initShape(pos)
  }

  /**
   * 绘制
   */
  private _draw() {
    // 单独处理多边形
    if (this._drawMode === DRAW_MODE.Polygon) {
      this._drawPolygon('draw')
      return
    }
    if (!this._drawingShape || this._drawMode === DRAW_MODE.Move) {
      return
    }
    const pos = getCorrectPointerPosition(this._stage)
    if (!pos) {
      return
    }
    this._drawingShape.updateShape(pos)
  }

  /**
   * 结束绘制
   */
  private _endDraw() {
    // 单独处理多边形
    if (this._drawMode === DRAW_MODE.Polygon) {
      this._drawPolygon('end')
      return
    }
    if (!this._drawingShape || this._drawMode === DRAW_MODE.Move) {
      return
    }
    const pos = getCorrectPointerPosition(this._stage)
    if (!pos) {
      this._resetDraw(true)
      return
    }
    this._completeShape(pos)
  }

  private _completeShape(pos: OverlayManagerTypes.Point) {
    if (this._drawingShape) {
      this._drawingShape.completeShape(pos)
      this._shapeList.push(this._drawingShape)
      this._overlayManagerOptions.shapeOptions.drawComplete(this._drawingShape)
      this._resetDraw()
    }
  }

  private _resetDraw(destroy: boolean = false) {
    if (destroy) {
      this._drawingShape?.destroy()
    }
    this._drawingShape = null
    this.setDrawMode(DRAW_MODE.Move)
    this._eventController.setEventOnwer(EVENT_OWNER.OSD)
  }

  /**
   * 设置鼠标样式
   * @param cursor
   */
  private _setCursor(cursor: OverlayManagerTypes.CursorStyle) {
    this._container.style.cursor = cursor
  }

  /**
   * 设置绘制模式
   * @param {OverlayManagerTypes.DrawMode} mode 模式
   */
  public setDrawMode(mode: OverlayManagerTypes.DrawMode) {
    this._drawMode = mode
    this._eventController.setDrawMode(mode)
    this._setCursor(mode === DRAW_MODE.Move ? 'auto' : 'crosshair')
  }

  /**
   * 设置形状选项
   * @param {OverlayManagerTypes.ShapeOptions} options 形状选项
   */
  public setShapeOptions(options: OverlayManagerTypes.ShapeOptions) {
    if (options.visible !== undefined) {
      this._overlayManagerOptions.shapeOptions.visible = options.visible
      this._shapeList.forEach((shape) => {
        shape.visible(options.visible as boolean)
      })
    }
    this._overlayManagerOptions.shapeOptions = {
      ...this._overlayManagerOptions.shapeOptions,
      ...options,
    }
  }

  /**
   * 设置标签选项
   * @param {OverlayManagerTypes.LabelOptions} options 标签选项
   */
  public setLabelOptions(options: OverlayManagerTypes.LabelOptions) {
    this._overlayManagerOptions.labelOptions = {
      ...this._overlayManagerOptions.labelOptions,
      ...options,
    }
    this._shapeList.forEach((shape) => {
      shape.setLabelOptions(this._overlayManagerOptions.labelOptions)
    })
  }

  public setLabelVisible(visible: boolean) {
    this._transformer.nodes()
    this._shapeList.forEach((shape) => {
      shape.setLabelVisible(visible)
    })
  }

  /**
   * 获取stage
   * @returns stage
   */
  public getStage() {
    return this._stage
  }

  /**
   * 获取绘制模式
   * @returns 绘制模式
   */
  public getDrawMode() {
    return this._drawMode
  }

  /**
   * 是否正在绘制中
   * @returns 是否正在绘制中
   */
  public isDrawing() {
    return !!this._drawingShape
  }

  /**
   * 获取形状数据
   * @returns 形状数据列表，每个元素为一个形状数据
   */
  public getShapesAttr() {
    const overlayData: any[] = []
    this._shapeList.forEach((shape) => {
      overlayData.push(JSON.parse(shape.getMainShape().toJSON()).attrs)
    })
    return overlayData
  }

  /**
   * 设置形状数据
   * @param {OverlayManagerTypes.ShapeAttr[]} attrsList 形状数据列表，每个元素为一个形状数据
   */
  public setShapesAttr(attrsList: OverlayManagerTypes.ShapeAttr[]) {
    attrsList.forEach((attrs) => {
      const shape = this._initShape({ x: 0, y: 0 }, attrs)
      if (shape) {
        this._shapeList.push(shape)
      }
    })
  }

  public destroyShape(shapeAttr: OverlayManagerTypes.ShapeAttr) {
    if (shapeAttr.id) {
      const selectNode = this._transformer.getTransformerShape()
      if (selectNode?.getAttrs().id === shapeAttr.id) {
        this._transformer.nodes()
      }
      const targetIndex = this._shapeList.findIndex(l => l.getMainShape().getAttrs().id === shapeAttr.id)
      if (targetIndex < 0) {
        throw new Error('找不到该形状')
      }
      this._shapeList[targetIndex].destroy()
      this._shapeList.splice(targetIndex, 1)
    }
    else {
      throw new Error('找不到该形状')
    }
  }

  /**
   * 重置绘制状态，清除正在绘制的形状，并将绘制模式重置为移动模式。
   */
  public resetDraw() {
    this._resetDraw()
  }

  /** 销毁 */
  public destroy() {
    this._eventController.destroy()
    this._transformer.destroy()
    this._layer.destroy()
    this._stage.destroy()
    this._container.remove()
  }
}
