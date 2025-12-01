import type Konva from 'konva'
import type * as OverlayManagerTypes from './types'
import isEqual from 'lodash/isEqual'
import OpenSeadragon from 'openseadragon'

export default class OsdKonva {
  private _viewer: OpenSeadragon.Viewer
  private _container: HTMLDivElement
  private _stage: Konva.Stage
  private _layer: Konva.Layer
  private _layerClass: string = 'overlay-layer-canvas'
  private _adjustEvent: ((event: OverlayManagerTypes.KonvaOptions) => void)[] = []

  private _konvaOptions: OverlayManagerTypes.KonvaOptions

  constructor(viewer: OpenSeadragon.Viewer, container: HTMLDivElement, stage: Konva.Stage, layer: Konva.Layer) {
    this._viewer = viewer
    this._container = container
    this._stage = stage
    this._layer = layer
    this._initCanvas()
    this._konvaOptions = this._initKonvaOptions()
    this._viewer.addHandler(
      'update-viewport',
      this._initSyncViewPort.bind(this),
    )
  }

  private _initCanvas() {
    const canvas = this._layer.getNativeCanvasElement()
    if (!canvas.classList.contains(this._layerClass)) {
      canvas.classList.add(this._layerClass)
    }
    const devicePixelRatio = window.devicePixelRatio
    setTimeout(() => {
      const attrWidth = canvas.getAttribute('width')
      const attrHeight = canvas.getAttribute('height')
      if (attrWidth && attrHeight) {
        canvas.setAttribute('pixelWidth', `${Number(attrWidth) / devicePixelRatio}`)
        canvas.setAttribute('pixelHeight', `${Number(attrHeight) / devicePixelRatio}`)
      }
    }, 0)
  }

  private _getScale() {
    const zoom = this._viewer.viewport.getZoom(true)
    const imageZoom = this._viewer.viewport.viewportToImageZoom(zoom)
    return {
      x: imageZoom,
      y: imageZoom,
    }
  }

  private _initKonvaOptions() {
    const viewport = this._viewer.viewport
    // @ts-expect-error @types/openseadragon 类型定义错误
    const rotation = viewport.getRotation(true)
    const flip = viewport.getFlip()
    const topLeft = viewport.pixelFromPoint(
      new OpenSeadragon.Point(0, 0),
      true,
    )
    return {
      rotation,
      scale: this._getScale(),
      size: {
        width: this._container.clientWidth,
        height: this._container.clientHeight,
      },
      position: { x: topLeft.x, y: topLeft.y },
      flip,
    }
  }

  private _changeStageSize() {
    if (
      this._konvaOptions.size.width === this._container.clientWidth
      && this._konvaOptions.size.height === this._container.clientHeight
    ) {
      return
    }
    // this._initCanvas()
    this._stage.size({
      width: this._container.clientWidth,
      height: this._container.clientHeight,
    })
  }

  private _changeStageScale() {
    const newScale = this._getScale()
    if (
      this._konvaOptions.scale.x === newScale.x
      && this._konvaOptions.scale.y === newScale.y
    ) {
      return
    }
    this._stage.scale(newScale)
    return newScale
  }

  private _changeStageRotation() {
    // @ts-expect-error @types/openseadragon 类型定义错误
    const rotation = this._viewer.viewport.getRotation(true)
    if (this._konvaOptions.rotation === rotation)
      return
    this._stage.rotation(rotation)
    return rotation
  }

  private _changeStagePosition() {
    const topLeft = this._viewer.viewport.pixelFromPoint(
      new OpenSeadragon.Point(0, 0),
      true,
    )
    if (
      this._konvaOptions.position.x === topLeft.x
      && this._konvaOptions.position.y === topLeft.y
    ) {
      return
    }

    // 保存所有图形的绝对坐标
    this._stage.position({
      x: topLeft.x,
      y: topLeft.y,
    })
    return topLeft
  }

  private _changeStageFlip() {
    const flip = this._viewer.viewport.getFlip()
    if (this._konvaOptions.flip === flip)
      return
    this._stage.content.style.transform = flip ? 'scaleX(-1)' : 'scaleX(1)'
  }

  private _initSyncViewPort = () => {
    const newOptions = this._initKonvaOptions()
    this._changeStageSize()
    this._changeStageScale()
    this._changeStageRotation()
    this._changeStagePosition()
    this._changeStageFlip()
    if (!isEqual(this._konvaOptions, newOptions)) {
      this._adjustEvent.forEach(callback => callback(this._konvaOptions))
      this._konvaOptions = newOptions
      this._stage.batchDraw()
    }
  }

  public addAdjust(callback: (options: OverlayManagerTypes.KonvaOptions) => void) {
    this._adjustEvent.push(callback)
  }
}
