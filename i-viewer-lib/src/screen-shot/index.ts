import type { OsdManager } from '../osd'
import type { OverlayManager } from '../overlay'
import type * as ScreenShotManagerTypes from './types.d'
import html2canvas from 'html2canvas'
import Konva from 'konva'
import isArray from 'lodash/isArray'
import OpenSeadragon from 'openseadragon'

// 导出类型
export type { ScreenShotOptions } from './types.d'

export class ScreenShotManager {
  private _viewer: OpenSeadragon.Viewer[]
  private _overlayManager?: OverlayManager[]
  private _options: ScreenShotManagerTypes.ScreenShotOptions

  private _container: HTMLDivElement | null = null
  private _stage: Konva.Stage | null = null
  private _layer: Konva.Layer | null = null
  private _transformer: Konva.Transformer | null = null

  private _background: Konva.Rect | null = null
  private _screenshotShape: Konva.Group | null = null
  private _isComplete: boolean = false
  private _minLength: number = 5

  private _buttonsContainer!: HTMLDivElement // 动作按钮容器HTML元素
  private _boundCancelScreenshot: (e: KeyboardEvent) => void // 绑定后的取消截图函数引用

  constructor(osd: OsdManager | OsdManager[], overlayManager?: OverlayManager | OverlayManager[], options: ScreenShotManagerTypes.ScreenShotOptions = {}) {
    this._overlayManager = !overlayManager ? [] : isArray(overlayManager) ? overlayManager : [overlayManager]
    this._viewer = isArray(osd) ? osd.map(l => l.getViewer()) : [osd.getViewer()]
    this._options = options
    this._boundCancelScreenshot = this._cancelScreenshot.bind(this)
  }

  private _initContainer() {
    const container = document.createElement('div')
    container.setAttribute('data-html2canvas-ignore', '')
    container.id = 'osd-screenshot-container'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.position = 'absolute'
    container.style.top = '0'
    container.style.left = '0'
    container.style.zIndex = '9999'
    container.style.cursor = 'crosshair'
    if (this._options.container && document.querySelector(this._options.container)) {
      const rect = document.querySelector(this._options.container)!.getClientRects()[0]
      container.style.position = 'fixed'
      container.style.top = `${rect.top}px`
      container.style.right = `${rect.right}px`
      container.style.bottom = `${rect.bottom}px`
      container.style.left = `${rect.left}px`
      container.style.width = `${rect.width}px`
      container.style.height = `${rect.height}px`
      document.querySelector(this._options.container)!.appendChild(container)
    }
    else {
      this._viewer[0].canvas.appendChild(container) // 将截图容器添加到OSD查看器画布中
    }
    return container
  }

  private _initKonva() {
    if (!this._container) {
      return
    }
    const stage = new Konva.Stage({
      container: this._container,
      width: this._container.clientWidth,
      height: this._container.clientHeight,
    })
    const layer = new Konva.Layer()
    const transformer = new Konva.Transformer({
      keepRatio: false,
      ignoreStroke: true,
    })
    layer.add(transformer)
    stage.add(layer)
    this._stage = stage
    this._layer = layer
    this._transformer = transformer
  }

  private _initBackground() {
    if (this._background) {
      this._background.destroy()
      this._background = null
    }
    this._background = new Konva.Rect({
      x: 0,
      y: 0,
      height: this._container?.clientHeight,
      width: this._container?.clientWidth,
      fill: 'rgba(0, 0, 0, 0.3)',
      listening: false,
    })
    this._layer?.add(this._background)
  }

  private _initEvent() {
    this._stage?.on('mousedown', (e) => {
      this._createScreenshot(e)
    })
    this._stage?.on('mousemove', (e) => {
      this._updateScreenshot(e)
    })
    this._stage?.on('mouseup', (e) => {
      this._completeScreenshot(e)
    })
    this._transformer?.on('transform', () => {
      this._updateActionButtonPosition() // 创建操作按钮
    })
  }

  private _createScreenshot(e: Konva.KonvaEventObject<MouseEvent>) {
    if (this._screenshotShape || this._isComplete) {
      return
    }
    this._screenshotShape = new Konva.Group({
      draggable: true,
      strokeScaleEnabled: false,
    })
    this._screenshotShape.add(new Konva.Rect({
      x: e.evt.layerX,
      y: e.evt.layerY,
      height: 0,
      width: 0,
      stroke: '#fff',
      strokeWidth: 2,
      fill: 'transparent',
      dash: [5, 5],
      draggable: false,
      strokeScaleEnabled: false,
    }))
    this._screenshotShape.add(new Konva.Rect({
      x: e.evt.layerX,
      y: e.evt.layerY,
      height: 0,
      width: 0,
      fill: '#fff',
      draggable: false,
      strokeScaleEnabled: false,
      globalCompositeOperation: 'destination-out',
    }))
    this._screenshotShape.on('dragmove', () => {
      this._updateActionButtonPosition()
    })
    this._layer?.add(this._screenshotShape)
    this._screenshotShape.moveToTop()
  }

  private _updateScreenshot(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this._screenshotShape || this._isComplete) {
      return
    }
    this._screenshotShape.find('Rect').forEach((rect) => {
      rect.size({
        width: e.evt.layerX - rect.x(),
        height: e.evt.layerY - rect.y(),
      })
    })
    this._screenshotShape.moveToTop()
  }

  private _completeScreenshot(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this._screenshotShape || this._isComplete) {
      return
    }
    if (this._screenshotShape.find('Rect')[0].width() < this._minLength && this._screenshotShape.find('Rect')[0].height() < this._minLength) {
      this._screenshotShape.destroy()
      this._screenshotShape = null
      return
    }
    this._updateScreenshot(e)
    this._transformer?.nodes([this._screenshotShape])
    this._transformer?.moveToTop()
    this._isComplete = true

    this._createActionButton() // 创建操作按钮
    this._updateActionButtonPosition()

    this._container!.style.cursor = 'default'
    this._screenshotShape.on('mouseenter', () => {
      this._container!.style.cursor = 'move'
    })
    this._screenshotShape.on('mouseout', () => {
      this._container!.style.cursor = 'default'
    })
    this._screenshotShape.on('dblclick', () => {
      this.saveScreenshot()
    })
  }

  private _cancelScreenshot(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this._resetScreenshot()
    }
  }

  private _setMouseEnabled(enabled: boolean) {
    this._viewer.forEach(l => l.setMouseNavEnabled(enabled))
    this._viewer.forEach(l => l.navigator.setMouseNavEnabled(enabled))
  }

  private _resetScreenshot() {
    this._screenshotShape?.destroy()
    this._stage?.destroy()
    this._container?.remove()
    this._setMouseEnabled(true)
    this._screenshotShape = null
    this._background = null
    this._stage = null
    this._layer = null
    window.removeEventListener('keydown', this._boundCancelScreenshot)
  }

  /**
   * 更新截图操作按钮的位置
   */
  private _updateActionButtonPosition() {
    if (!this._buttonsContainer || !this._container)
      return // 如果按钮或截图容器不存在，则不处理
    const { x, y, width, height } = this._getScreenShapeSize()! // 获取选框最终尺寸
    // 根据选框的新位置和尺寸，重新计算并设置按钮容器的位置
    this._buttonsContainer.style.right = `${this._container.clientWidth - (x + width)}px`
    this._buttonsContainer.style.top = `${y + height + 5}px`
  }

  /**
   * 获取当前截图选框的尺寸和位置信息
   * @returns 选框的x, y, width, height对象，如果选框不存在则返回undefined
   */
  private _getScreenShapeSize() {
    if (!this._screenshotShape)
      return // 如果选框对象不存在，则返回
    const rect = this._screenshotShape.getClientRect()
    return {
      x: rect.x, // 获取选框X坐标
      y: rect.y, // 获取选框Y坐标
      width: rect.width, // 获取缩放后的宽度
      height: rect.height, // 获取缩放后的高度
    }
  }

  /**
   * 捕获当前屏幕选区并将其转换为Blob对象
   * @returns Promise<Blob | null> 成功则返回Blob对象，失败则返回null
   */
  private async _captureScreenSelectionToBlob(): Promise<Blob | null> {
    // _getScreenShapeSize 会在其内部检查 _screenShape，如果不存在则返回 undefined
    const shapeSize = this._getScreenShapeSize()
    if (!shapeSize) {
      console.warn('未能获取截图选框尺寸。')
      return null
    }
    const { x, y, width, height } = shapeSize

    this._transformer?.nodes([])

    try {
      const dpr = OpenSeadragon.pixelDensityRatio
      const sx = x * dpr
      const sy = y * dpr
      const sWidth = width * dpr
      const sHeight = height * dpr

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = sWidth
      tempCanvas.height = sHeight
      const tempCtx = tempCanvas.getContext('2d')

      if (!tempCtx) {
        console.error('无法创建临时画布上下文用于生成Blob')
        return null
      }

      let viewportImage = null
      if (this._options.container && document.querySelector(this._options.container)) {
        viewportImage = await html2canvas(document.querySelector(this._options.container)!, {
          ignoreElements: (element) => {
            return element.getAttribute('name') === 'overlay-container'
          },
        })
      }
      else {
        viewportImage = this._viewer[0].drawer.canvas as HTMLCanvasElement
      }
      // 1. 首先绘制基础的OSD图像 (viewer content)
      tempCtx.drawImage(
        viewportImage, // 基础OSD图像
        sx,
        sy,
        sWidth,
        sHeight, // 源矩形 (物理像素) 从OSD绘制器
        0,
        0,
        sWidth,
        sHeight, // 目标矩形 (物理像素) 到tempCanvas
      )

      // 2. 如果 _isMarkVisible 为true, 则在其上绘制叠加层
      if (this._overlayManager && this._options.containOverlay) {
        // 处理单个或多个overlayManager的情况
        const overlayManagers = isArray(this._overlayManager) ? this._overlayManager : [this._overlayManager]

        for (const overlayManager of overlayManagers) {
          try {
            // 尝试从 overlayManager 获取 Konva 舞台实例
            const overlayKonvaStage = overlayManager.getStage()

            if (overlayKonvaStage) {
              // 使用 Konva 的 toCanvas 方法导出叠加层画布中对应选区的区域
              const overlayRegionCanvas = overlayKonvaStage.toCanvas({
                x, // 叠加层画布中的逻辑左边距
                y, // 叠加层画布中的逻辑顶边距
                width, // 逻辑宽度
                height, // 逻辑高度
                pixelRatio: dpr,
              })

              // 将导出的叠加层区域绘制到 tempCanvas 上
              tempCtx.drawImage(overlayRegionCanvas, 0, 0)
            }
            else {
              console.warn(
                '未能从OverlayManager获取Konva舞台用于截取叠加层，叠加层将不会出现在截图中。',
              )
            }
          }
          catch (error) {
            console.warn('处理叠加层时出错:', error)
          }
        }
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        tempCanvas.toBlob(resolve, 'image/png')
      })

      if (!blob) {
        console.error('无法从画布生成 Blob')
        return null
      }
      return blob
    }
    catch (error) {
      console.error('内部错误:', error)
      return null
    }
  }

  /**
   * 创建截图操作按钮（确认、取消、下载等）
   */
  private _createActionButton() {
    if (this._container) {
      this._buttonsContainer = document.createElement('div')
      this._buttonsContainer.id = 'osd-screenshot-action-button'
      this._buttonsContainer.style.position = 'absolute'
      // 计算按钮容器的位置，使其在选框右下角外部
      this._buttonsContainer.style.zIndex = '1000' // 确保按钮在最上层
      this._container.appendChild(this._buttonsContainer)
    }
    this._options.createActionButton?.(this._buttonsContainer)
  }

  public takeScreenshot() {
    this._isComplete = false
    this._setMouseEnabled(false)
    this._overlayManager?.forEach(l => l.setLabelVisible(false))
    this._container = this._initContainer()
    this._initKonva()
    this._initBackground()
    this._initEvent()
    window.addEventListener('keydown', this._boundCancelScreenshot)
  }

  public async saveScreenshot() {
    if (!this._screenshotShape) {
      this._resetScreenshot() // 如果没有选区，也应该重置一下状态以防万一
      return
    }
    try {
      // 调用新的辅助方法获取Blob
      const blob = await this._captureScreenSelectionToBlob()
      if (!blob) {
        // 如果blob为null，说明在_captureScreenSelectionToBlob中已记录错误，这里直接抛出或返回
        throw new Error('未能捕获截图区域为Blob')
      }

      // 使用 Clipboard API 将 Blob 写入剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob, // 使用Blob的类型作为键
        }),
      ])
    }
    catch (error) {
      console.error('confirmScreenshot: 截图或复制到剪贴板失败:', error)
    }
    finally {
      this._resetScreenshot() // 无论成功与否，都重置截图状态
    }
  }

  public setOptions(options: ScreenShotManagerTypes.ScreenShotOptions) {
    this._options = {
      ...this._options,
      ...options,
    }
  }

  public async getBlob() {
    return await this._captureScreenSelectionToBlob()
  }

  public destroy() {
    this._resetScreenshot() // 重置截图状态，清除所有事件监听器和DOM元素。
  }
}
