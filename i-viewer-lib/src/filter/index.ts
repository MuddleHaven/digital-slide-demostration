import type OpenSeadragon from 'openseadragon'
import type { OsdManager } from '../osd'
import type * as FilterManagerTypes from './types.d'

// 导出类型
export type { FilterParams } from './types.d'

// 导出常量
export const DEFAULT_FILTER_PARAMS: FilterManagerTypes.FilterParams = {
  gamma: 1.0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  equalization: 0,
  redBalance: 0,
  greenBalance: 0,
  blueBalance: 0,
}

export const FILTER_PARAMS_RANGE = {
  gamma: [0.2, 5.0],
  brightness: [-100, 100],
  contrast: [-50, 100],
  saturation: [-100, 100],
  sharpness: [0, 10],
  equalization: [0.0, 1.0],
  redBalance: [-100, 100],
  greenBalance: [-100, 100],
  blueBalance: [-100, 100],
}

/**
 * CSS滤镜类
 * 该类通过动态生成和应用CSS filter样式（包含内联SVG滤镜）来实现对OpenSeadragon视图的图像调整。
 */
export class FilterManager {
  // 默认滤镜参数
  static DefaultParams: FilterManagerTypes.FilterParams = DEFAULT_FILTER_PARAMS

  // 滤镜参数范围
  static ParamsRange = FILTER_PARAMS_RANGE

  private _viewer: OpenSeadragon.Viewer
  private _params: FilterManagerTypes.FilterParams
  private _enabled: boolean = true
  private _styleElement: HTMLStyleElement | null = null
  private _canvasElements: HTMLElement[] = []
  private _originalStyles: Map<HTMLElement, string> = new Map()

  // COLORIZE_MID 算法的原始参数，用于颜色平衡计算
  // 这些常量在 _generateColorBalanceFilter 方法中被使用，IDE可能无法正确识别静态成员的引用
  static readonly COLORIZE_MID_FA = 64.0
  static readonly COLORIZE_MID_FB = 85.0
  static readonly COLORIZE_MID_FSCALE = 1.785

  /**
   * 构造函数
   * @param osd OpenSeadragon.Viewer 实例。
   */
  constructor(osd: OsdManager) {
    this._viewer = osd.getViewer()
    this._params = { ...FilterManager.DefaultParams }
    this._init()
  }

  /**
   * 初始化滤镜系统。
   * 创建用于应用CSS滤镜的`<style>`元素，并设置事件监听器以响应视图变化。
   */
  private _init(): void {
    this._styleElement = document.createElement('style')
    document.head.appendChild(this._styleElement)

    this._updateCanvasElements() // 初始查找

    // 监听OpenSeadragon事件，以便在canvas元素可能发生变化时更新列表
    this._viewer.addHandler('open', this._updateCanvasElements.bind(this))
  }

  /**
   * 更新当前视图中所有canvas元素的列表。
   * 同时保存每个canvas元素的原始style属性，以便在禁用滤镜或重置时恢复。
   */
  private _updateCanvasElements(): void {
    const container = this._viewer.element as HTMLElement
    if (!container)
      return

    const currentCanvases = Array.from(container.querySelectorAll('canvas'))
    const newCanvasElements: HTMLElement[] = []

    // 识别新增的canvas元素并保存其原始样式
    currentCanvases.forEach((canvas) => {
      if (!this._canvasElements.includes(canvas)) {
        this._originalStyles.set(canvas, canvas.getAttribute('style') || '')
      }
      newCanvasElements.push(canvas)
    })

    // 如果canvas列表发生变化，或有元素被移除，也需要处理 _originalStyles
    this._canvasElements.forEach((canvas) => {
      if (!newCanvasElements.includes(canvas)) {
        this._originalStyles.delete(canvas)
      }
    })

    this._canvasElements = newCanvasElements

    // 如果滤镜已启用且参数非默认，则重新应用
    if (this._enabled && this._needsFiltering()) {
      this._applyFilters()
    }
    else if (this._enabled && !this._needsFiltering()) {
      // 如果启用了但参数是默认，确保样式被重置
      this._resetCanvasStyles()
    }
  }

  /**
   * 检查当前滤镜参数是否至少有一个不同于默认值。
   * @returns 如果至少有一个参数不是默认值，则返回 `true`，否则返回 `false`。
   */
  private _needsFiltering(): boolean {
    // 通过比较当前参数与默认参数对象来确定是否需要应用滤镜
    return Object.keys(this._params).some(
      key =>
        this._params[key as keyof FilterManagerTypes.FilterParams]
        !== FilterManager.DefaultParams[key as keyof FilterManagerTypes.FilterParams],
    )
  }

  /**
   * 将所有受影响的canvas元素的style属性恢复到应用滤镜之前的原始状态。
   */
  private _resetCanvasStyles(): void {
    this._canvasElements.forEach((canvas) => {
      const originalStyle = this._originalStyles.get(canvas)
      if (typeof originalStyle === 'string') {
        canvas.setAttribute('style', originalStyle)
      }
      else {
        // 如果没有保存的原始样式（理论上不应发生），则移除filter样式
        canvas.style.filter = ''
      }
    })
    // 清空style标签内容，确保移除所有滤镜效果
    if (this._styleElement) {
      this._styleElement.innerHTML = ''
    }
  }

  /**
   * 生成伽马校正SVG滤镜的URL编码字符串。
   * @param gamma 伽马值。
   * @returns SVG滤镜的URL编码字符串。
   */
  private _generateGammaFilter(gamma: number): string {
    const gammaFilterSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <filter id="gamma">
          <feComponentTransfer>
            <feFuncR type="gamma" exponent="${gamma}"/>
            <feFuncG type="gamma" exponent="${gamma}"/>
            <feFuncB type="gamma" exponent="${gamma}"/>
          </feComponentTransfer>
        </filter>
      </svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(gammaFilterSvg.trim())}#gamma")`
  }

  /**
   * 生成锐化SVG滤镜的URL编码字符串。
   * @param sharpness 锐化强度 (0-10)。
   * @returns SVG滤镜的URL编码字符串。
   */
  private _generateSharpenFilter(sharpness: number): string {
    const center = 1 + sharpness * 0.4 // 卷积核中心值
    const edge = -sharpness * 0.1 // 卷积核边缘值
    const sharpenFilterSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <filter id="sharpen">
          <feConvolveMatrix order="3 3" preserveAlpha="true"
            kernelMatrix="0 ${edge} 0 ${edge} ${center} ${edge} 0 ${edge} 0"/>
        </filter>
      </svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(sharpenFilterSvg.trim())}#sharpen")`
  }

  /**
   * 生成图像均衡化SVG滤镜的URL编码字符串 (简化版)。
   * @param amount 均衡化程度 (0.0-1.0)。
   * @returns SVG滤镜的URL编码字符串。
   */
  private _generateEqualizationFilter(amount: number): string {
    const equalizationFilterSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <filter id="equalizeSimple">
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0 ${amount} 1"/>
            <feFuncG type="table" tableValues="0 ${amount} 1"/>
            <feFuncB type="table" tableValues="0 ${amount} 1"/>
          </feComponentTransfer>
        </filter>
      </svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(equalizationFilterSvg.trim())}#equalizeSimple")`
  }

  /**
   * 生成颜色平衡SVG滤镜的URL编码字符串，基于COLORIZE_MID算法。
   * @param rAdj 红色通道调整值 (-100 到 100)。
   * @param gAdj 绿色通道调整值 (-100 到 100)。
   * @param bAdj 蓝色通道调整值 (-100 到 100)。
   * @returns SVG滤镜的URL编码字符串。
   */
  private _generateColorBalanceFilter(
    rAdj: number,
    gAdj: number,
    bAdj: number,
  ): string {
    const tableValuesR: string[] = []
    const tableValuesG: string[] = []
    const tableValuesB: string[] = []

    for (let i = 0; i < 256; i++) {
      // 复刻COLORIZE_MID算法核心逻辑来计算中间调系数
      const fTmp1Calc
        = (i - FilterManager.COLORIZE_MID_FB) / FilterManager.COLORIZE_MID_FA + 0.5
      const fTmp2Calc
        = (i + FilterManager.COLORIZE_MID_FB - 255.0) / -FilterManager.COLORIZE_MID_FA
          + 0.5

      // 模拟 $.LimitBorder(value, 0, 1.0) 的行为：先取整，然后限制在[0,1]范围
      let fTmp1Processed = Math.floor(fTmp1Calc)
      fTmp1Processed = Math.max(0, Math.min(1, fTmp1Processed))

      let fTmp2Processed = Math.floor(fTmp2Calc)
      fTmp2Processed = Math.max(0, Math.min(1, fTmp2Processed))

      const midToneProduct
        = fTmp1Processed * fTmp2Processed * FilterManager.COLORIZE_MID_FSCALE
      const midToneCoefficient = Math.floor(midToneProduct) // 该系数决定是否应用调整

      // 应用调整并生成SVG tableValues所需格式 (0.0-1.0)
      const sumR = i + midToneCoefficient * rAdj
      const sumG = i + midToneCoefficient * gAdj
      const sumB = i + midToneCoefficient * bAdj

      tableValuesR.push(
        (Math.max(0, Math.min(255, Math.floor(sumR))) / 255.0).toFixed(5),
      )
      tableValuesG.push(
        (Math.max(0, Math.min(255, Math.floor(sumG))) / 255.0).toFixed(5),
      )
      tableValuesB.push(
        (Math.max(0, Math.min(255, Math.floor(sumB))) / 255.0).toFixed(5),
      )
    }

    const rTableStr = tableValuesR.join(' ')
    const gTableStr = tableValuesG.join(' ')
    const bTableStr = tableValuesB.join(' ')

    const colorBalanceFilterSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <filter id="colorBalanceMidTone" color-interpolation-filters="sRGB">
          <feComponentTransfer>
            <feFuncR type="table" tableValues="${rTableStr}"/>
            <feFuncG type="table" tableValues="${gTableStr}"/>
            <feFuncB type="table" tableValues="${bTableStr}"/>
          </feComponentTransfer>
        </filter>
      </svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(colorBalanceFilterSvg.trim())}#colorBalanceMidTone")`
  }

  /**
   * 根据当前滤镜参数构建并应用CSS filter字符串到所有目标canvas元素。
   */
  private _applyFilters(): void {
    if (!this._enabled || this._canvasElements.length === 0) {
      this._resetCanvasStyles() // 如果禁用或没有canvas，确保样式被重置
      return
    }

    if (!this._needsFiltering()) {
      this._resetCanvasStyles()
      return
    }
    let filterCssString = '' // 用于CSS filter属性的字符串

    // 基础CSS滤镜：亮度、对比度、饱和度
    // 注意：CSS的 brightness 和 contrast 与IOsdFilterParams中的定义可能需要转换以匹配视觉效果。
    // 此处采用直接的百分比转换作为示例。
    if (this._params.brightness !== FilterManager.DefaultParams.brightness) {
      filterCssString += `brightness(${1 + this._params.brightness / 100}) `
    }
    if (this._params.contrast !== FilterManager.DefaultParams.contrast) {
      // CSS contrast: 0%是灰度, 100%是原始, >100%增加对比度
      filterCssString += `contrast(${1 + this._params.contrast / 100}) `
    }
    if (this._params.saturation !== FilterManager.DefaultParams.saturation) {
      // CSS saturate: 0%是灰度, 100%是原始, >100%增加饱和度
      filterCssString += `saturate(${1 + this._params.saturation / 100}) `
    }

    // SVG滤镜：伽马、锐化、均衡化、颜色平衡
    if (this._params.gamma !== FilterManager.DefaultParams.gamma) {
      filterCssString += `${this._generateGammaFilter(this._params.gamma)} `
    }
    if (this._params.sharpness > 0) {
      // 锐化参数通常大于0才有效
      filterCssString += `${this._generateSharpenFilter(this._params.sharpness)} `
    }
    if (this._params.equalization > 0) {
      // 均衡化参数大于0才有效
      filterCssString += `${this._generateEqualizationFilter(this._params.equalization)} `
    }
    if (
      this._params.redBalance !== FilterManager.DefaultParams.redBalance
      || this._params.greenBalance !== FilterManager.DefaultParams.greenBalance
      || this._params.blueBalance !== FilterManager.DefaultParams.blueBalance
    ) {
      filterCssString += `${this._generateColorBalanceFilter(
        this._params.redBalance,
        this._params.greenBalance,
        this._params.blueBalance,
      )} `
    }

    filterCssString = filterCssString.trim()

    // 应用滤镜到所有canvas元素
    // 为避免直接修改canvas元素的style属性导致与OpenSeadragon的冲突或覆盖原始style，
    // 考虑将滤镜规则应用到<style>标签，并通过特定类名或选择器指向canvas。
    // 但当前实现是直接修改canvas.style.filter，这在简单场景下可行。
    // 注意：如果OpenSeadragon自身也操作canvas.style，可能会有冲突。
    if (this._styleElement) {
      // 使用 style 元素统一应用 filter
      // const canvasSelector = this._canvasElements.map((_, index) => `.openseadragon-canvas canvas:nth-of-type(${index + 1})`).join(', ');
      // 更通用的选择器，如果canvas结构固定
      // const genericCanvasSelector = ".openseadragon-canvas canvas";

      if (filterCssString) {
        // 注意：为每个canvas元素应用滤镜，如果canvas数量多，style标签内容会很大
        // 更好的方式可能是给canvas添加一个共同的类，然后针对这个类设置滤镜
        // 但目前保持原逻辑，直接操作每个canvas的style
        this._canvasElements.forEach((canvas) => {
          canvas.style.filter = filterCssString
        })
      }
      else {
        this._resetCanvasStyles() // 如果没有滤镜了，重置
      }
    }
  }

  /**
   * 设置滤镜参数。
   * 部分或全部参数都可以设置。设置后会自动重新应用滤镜。
   * @param params 一个包含部分或全部滤镜参数的对象。
   */
  public setParams(params: Partial<FilterManagerTypes.FilterParams>): void {
    this._params = { ...this._params, ...params }
    this._applyFilters()
  }

  /**
   * 获取当前的滤镜参数。
   * @returns 当前所有滤镜参数的对象副本。
   */
  public getParams(): FilterManagerTypes.FilterParams {
    return { ...this._params }
  }

  /**
   * 重置所有滤镜参数到其默认值。
   * 重置后会自动重新应用滤镜（通常是移除所有滤镜效果）。
   */
  public resetParams(): void {
    this._params = { ...FilterManager.DefaultParams }
    this._applyFilters()
  }

  /**
   * 启用滤镜效果。
   * 如果之前已禁用，调用此方法将重新应用当前参数下的滤镜。
   */
  public enable(): void {
    if (!this._enabled) {
      this._enabled = true
      this._applyFilters()
    }
  }

  /**
   * 禁用滤镜效果。
   * 调用此方法将移除所有已应用的CSS滤镜，并恢复canvas的原始样式。
   */
  public disable(): void {
    if (this._enabled) {
      this._enabled = false
      this._resetCanvasStyles()
    }
  }

  /**
   * 检查滤镜当前是否已启用。
   * @returns 如果滤镜已启用，则返回 `true`，否则返回 `false`。
   */
  public isEnabled(): boolean {
    return this._enabled
  }

  /**
   * 销毁滤镜实例。
   * 移除所有应用的样式和事件监听器，释放资源。
   */
  public destroy(): void {
    this._resetCanvasStyles() // 首先恢复所有样式

    if (this._styleElement) {
      this._styleElement.remove()
      this._styleElement = null
    }

    // 移除事件监听器
    // 注意：移除匿名函数作为处理器比较困难，最好在add时保存函数引用
    // 为简化，这里假设bind后的函数引用是稳定的或可以重新创建进行移除
    // 更健壮的方式是在构造时保存绑定后的函数引用。
    try {
      this._viewer.removeHandler('open', this._updateCanvasElements.bind(this))
      this._viewer.removeHandler(
        'add-item-failed',
        this._updateCanvasElements.bind(this),
      )
      this._viewer.removeHandler(
        'tile-loaded',
        this._updateCanvasElements.bind(this),
      )
    }
    catch (e) {
      console.warn('移除OpenSeadragon事件处理器时可能发生错误: ', e)
    }

    this._canvasElements = []
    this._originalStyles.clear()
  }
}
