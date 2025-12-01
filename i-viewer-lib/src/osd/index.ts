import type * as OsdManagerTypes from './types.d'
import { nanoid } from 'nanoid'
import OpenSeadragon from 'openseadragon'

// 导出类型
export type { MyOsd } from './types.d'

export class OsdManager {
  public osdManagerId: string = nanoid()

  private _viewer: OpenSeadragon.Viewer

  constructor(config: OsdManagerTypes.MyOsd.Options) {
    this._viewer = this._init(config)
  }

  private _init(config: OsdManagerTypes.MyOsd.Options) {
    if (!this._checkDom(config.id, config.element)) {
      throw new Error('Dom不存在，无法实例化')
    }
    const osd = new OpenSeadragon.Viewer({
      alwaysBlend: true,
      immediateRender: false,
      blendTime: 0.5,
      showNavigator: true,
      showNavigationControl: false,
      navigatorPosition: 'TOP_LEFT',
      minZoomImageRatio: 0.5,
      maxZoomPixelRatio: 2,
      maxImageCacheCount: 500,
      zoomPerClick: 2,
      zoomPerScroll: 2,
      navigatorMaintainSizeRatio: true,
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: false,
        flickEnabled: true,
        flickMomentum: 0.1,
      },
      ...config,
    })
    return osd
  }

  private _checkDom(id?: string, element?: HTMLElement) {
    if (id) {
      return !!document.querySelector(`#${id}`)
    }
    if (element) {
      return document.contains(element)
    }
    return false
  }

  public setFlickEnabled(enabled: boolean) {
    // @ts-expect-error 官方定义有误
    this._viewer.gestureSettingsMouse.flickEnabled = enabled
  }

  public setEffectEnabled(enabled: boolean) {
    // @ts-expect-error 官方定义有误
    this._viewer.viewport.centerSpringX.animationTime = enabled ? 1.2 : 0
    // @ts-expect-error 官方定义有误
    this._viewer.viewport.centerSpringY.animationTime = enabled ? 1.2 : 0
    // @ts-expect-error 官方定义有误
    this._viewer.viewport.zoomSpring.animationTime = enabled ? 1.2 : 0
    // @ts-expect-error 官方定义有误
    this._viewer.viewport.degreesSpring.animationTime = enabled ? 1.2 : 0
    this.setFlickEnabled(enabled)
  }

  public getViewer(): OpenSeadragon.Viewer {
    return this._viewer
  }

  public destroy() {
    this._viewer?.destroy()
  }
}
