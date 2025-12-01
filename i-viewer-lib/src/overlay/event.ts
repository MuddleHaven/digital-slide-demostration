import type OpenSeadragon from 'openseadragon'
import type ITransformer from './transformer'
import type * as OverlayManagerTypes from './types'
import Konva from 'konva'
import { DRAW_MODE, EVENT_OWNER } from '@/utils/constants'

interface EventControllerOptions {
  viewer: OpenSeadragon.Viewer
  stage: Konva.Stage
  transformer: ITransformer
  drawMode: OverlayManagerTypes.DrawMode
  shapeList: OverlayManagerTypes.Shape[]
  resetDraw: (destroy: boolean) => void
  setCursor: (cursor: OverlayManagerTypes.CursorStyle) => void
  dragComplete: (shape: OverlayManagerTypes.Shape) => void
  deleteComplete: (shape: OverlayManagerTypes.Shape) => void
}

export enum EventName {
  Mousedown,
  Mouseup,
  Mousemove,
}

export default class EventController {
  private _options: EventControllerOptions

  private _boundDeleteShape: (e: KeyboardEvent) => void
  private _boundCancelDraw: (e: KeyboardEvent) => void

  constructor(options: EventControllerOptions) {
    this._options = options
    this._boundDeleteShape = this._deleteShape.bind(this)
    this._boundCancelDraw = this._cancelDraw.bind(this)
    this._initKonvaEvent()
  }

  /**
   * 判断是否是自定义形状
   * @param {Konva.Node} target 目标
   * @returns 是否是自定义形状
   */
  private _isBelongShape(target: Konva.Node) {
    return target instanceof Konva.Circle
      || target instanceof Konva.Rect
      || target instanceof Konva.Ellipse
      || target instanceof Konva.Arrow
      || target instanceof Konva.Line
      || target instanceof Konva.Path
  }

  private _deleteShape(e: KeyboardEvent) {
    if (e.key !== 'Delete')
      return
    const target = this._options.transformer.getTransformerShape()
    if (!target)
      return
    this._options.shapeList.forEach((shape, index) => {
      if (shape.getMainShape() === target) {
        this._options.transformer.nodes()
        this._options.shapeList.splice(index, 1)
        this._options.deleteComplete(shape)
        shape.destroy()
      }
    })
  }

  private _cancelDraw(e: KeyboardEvent) {
    if (e.key !== 'Escape')
      return
    this._options.resetDraw(true)
  }

  /**
   * 初始化konva事件
   */
  private _initKonvaEvent() {
    this._options.stage.on('mousemove touchmove', (e) => {
      if (this._options.drawMode !== DRAW_MODE.Move) {
        return
      }

      if (this._isBelongShape(e.target)) {
        this._options.setCursor(!this._options.transformer.isCustomTransformerShape(e.target) ? 'grab' : 'pointer')
        this.setEventOnwer(EVENT_OWNER.KONVA)
      }
      else {
        this._options.setCursor('auto')
        this.setEventOnwer(EVENT_OWNER.OSD)
      }
    })

    this._options.stage.on('dragstart', (e) => {
      if (this._isBelongShape(e.target) && !this._options.transformer.isCustomTransformerShape(e.target)) {
        this._options.setCursor('grabbing')
        this.setEventOnwer(EVENT_OWNER.KONVA)
      }
    })

    this._options.stage.on('dragend', (e) => {
      if (this._isBelongShape(e.target) && !this._options.transformer.isCustomTransformerShape(e.target)) {
        const target = this._options.shapeList.find(shape => shape.getMainShape() === e.target)
        if (target) {
          this._options.dragComplete(target)
        }
        this._options.setCursor('grab')
        this.setEventOnwer(EVENT_OWNER.KONVA)
      }
    })

    this._options.stage.on('click', (e) => {
      if (this._options.drawMode !== DRAW_MODE.Move) {
        return
      }
      if (this._isBelongShape(e.target)) {
        this._options.transformer.nodes(e.target)
      }
      else {
        this._options.transformer.nodes()
      }
    })

    this._options.viewer.addHandler('canvas-click', () => {
      if (this._options.drawMode !== DRAW_MODE.Move) {
        return
      }
      this._options.transformer.nodes()
    })

    window.addEventListener('keydown', this._boundDeleteShape)
    window.addEventListener('keydown', this._boundCancelDraw)
  }

  /**
   * 绑定事件
   * @param {EventName} event 事件
   * @param {Function} callback 回调
   */
  public on(event: EventName, callback: (event: any) => void) {
    switch (event) {
      case EventName.Mousedown:
        this._options.stage.on('mousedown touchstart', callback)
        break
      case EventName.Mousemove:
        this._options.stage.on('mousemove touchmove', callback)
        break
      case EventName.Mouseup:
        this._options.stage.on('mouseup touchend', callback)
        break
    }
  }

  /**
   * 解绑事件
   * @param {EventName} event 事件
   * @param {Function} callback 回调
   */
  public off(event: EventName, callback: (event: any) => void) {
    switch (event) {
      case EventName.Mousedown:
        this._options.stage.off('mousedown touchstart', callback)
        break
      case EventName.Mousemove:
        this._options.stage.off('mousemove touchmove', callback)
        break
      case EventName.Mouseup:
        this._options.stage.off('mouseup touchend', callback)
        break
    }
  }

  /**
   * 设置绘制模式
   * @param {OverlayManagerTypes.DrawMode} mode 模式
   */
  public setDrawMode(mode: OverlayManagerTypes.DrawMode) {
    this._options.drawMode = mode
    this.setEventOnwer(mode === DRAW_MODE.Move ? EVENT_OWNER.OSD : EVENT_OWNER.KONVA)
  }

  /**
   * 设置事件所有者
   * @param {OverlayManagerTypes.EventOnwer} onwer 所有者
   */
  public setEventOnwer(onwer: OverlayManagerTypes.EventOnwer) {
    this._options.viewer.setMouseNavEnabled(onwer === EVENT_OWNER.OSD)
    this._options.viewer.navigator.setMouseNavEnabled(onwer === EVENT_OWNER.OSD)
  }

  /**
   * 销毁
   */
  public destroy() {
    this._options.stage.off('mousedown touchstart')
    this._options.stage.off('mousemove touchmove')
    this._options.stage.off('mouseup touchend')
    window.removeEventListener('keydown', this._boundDeleteShape)
    window.removeEventListener('keydown', this._boundCancelDraw)
  }
}
