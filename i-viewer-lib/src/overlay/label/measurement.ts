import type Konva from 'konva'
import type * as OverlayManagerTypes from '../types'
import { DRAW_MODE, LABEL_TYPE } from '@/utils/constants'
import { convertAreaToAppropriateUnit, convertToAppropriateUnit, getDistance } from '../utils'

export default class MeasurementController {
  private _stage: Konva.Stage

  private _pixelSize: number

  private _labelThinsVisible: Required<OverlayManagerTypes.LabelThinsVisible>

  constructor(
    stage: Konva.Stage,
    pixelSize: number,
    labelThinsVisible: Required<OverlayManagerTypes.LabelThinsVisible>,
  ) {
    this._pixelSize = pixelSize
    this._labelThinsVisible = labelThinsVisible
    this._stage = stage
  }

  /**
   * 像素转换为微米
   * @param pixel 像素值
   * @returns 微米值
   */
  private _pixel2um(pixel: number): number {
    return pixel * this._pixelSize * 1000
  }

  /**
   * 获取圆的测量文本
   * @param circle 圆
   * @returns 测量文本
   */
  private _getCircleMeasurementText(circle: Konva.Circle): string {
    const measurement: OverlayManagerTypes.CircleMeasurement = circle.getAttrs().measurement
    const clientRect = circle.getClientRect()
    const scaleX = this._stage.scaleX()
    const { width: diameter } = clientRect
    measurement.realRadius = Math.abs(this._pixel2um(diameter / 2 / scaleX))
    measurement.realCircumference = 2 * Math.PI * measurement.realRadius
    measurement.realArea
      = Math.PI * measurement.realRadius * measurement.realRadius
    circle.setAttrs({
      measurement,
    })
    const visibleRadius = convertToAppropriateUnit(
      measurement.realRadius,
    )
    const visibleArea = convertAreaToAppropriateUnit(
      measurement.realArea,
    )
    const visibleCircumference = convertToAppropriateUnit(
      measurement.realCircumference,
    )

    return [
      `半径：${visibleRadius.value} ${visibleRadius.unit}`,
      `周长：${visibleCircumference.value} ${visibleCircumference.unit}`,
      `面积：${visibleArea.value} ${visibleArea.unit}`,
    ].join('\n')
  }

  /**
   * 获取矩形的测量文本
   * @param rect 矩形
   * @returns 测量文本
   */
  private _getRectMeasurementText(rect: Konva.Rect): string {
    const clientRect = rect.getClientRect()
    const scale = this._stage.scale()
    const { width, height } = clientRect
    const measurement: OverlayManagerTypes.RectMeasurement = rect.getAttrs().measurement
    measurement.realWidth = Math.abs(this._pixel2um(width / scale.x))
    measurement.realHeight = Math.abs(this._pixel2um(height / scale.y))
    measurement.realArea = measurement.realWidth * measurement.realHeight
    measurement.realPerimeter
      = 2 * (measurement.realWidth + measurement.realHeight)
    rect.setAttrs({
      measurement,
    })
    const visibleWidth = convertToAppropriateUnit(measurement.realWidth)
    const visibleHeight = convertToAppropriateUnit(
      measurement.realHeight,
    )
    const visiblePerimeter = convertToAppropriateUnit(
      measurement.realPerimeter,
    )
    const visibleArea = convertAreaToAppropriateUnit(
      measurement.realArea,
    )
    return [
      `宽度：${visibleWidth.value} ${visibleWidth.unit}`,
      `高度：${visibleHeight.value} ${visibleHeight.unit}`,
      `周长：${visiblePerimeter.value} ${visiblePerimeter.unit}`,
      `面积：${visibleArea.value} ${visibleArea.unit}`,
    ].join('\n')
  }

  /**
   * 获取椭圆的测量文本
   * @param ellipse 椭圆
   * @returns 测量文本
   */
  private _getEllipseMeasurement(ellipse: Konva.Ellipse) {
    const measurement: OverlayManagerTypes.EllipseMeasurement = ellipse.getAttrs().measurement
    const clientRect = ellipse.getClientRect()
    const scale = this._stage.scale()
    const { width: diameterX, height: diameterY } = clientRect
    measurement.realRadiusX = Math.abs(this._pixel2um(diameterX / 2 / scale.x))
    measurement.realRadiusY = Math.abs(this._pixel2um(diameterY / 2 / scale.y))
    measurement.realPerimeter
      = 2
        * Math.PI
        * Math.sqrt(
          (measurement.realRadiusX * measurement.realRadiusX
            + measurement.realRadiusY * measurement.realRadiusY)
          / 2,
        )
    measurement.realArea
      = Math.PI * measurement.realRadiusX * measurement.realRadiusY
    ellipse.setAttrs({
      measurement,
    })
    const visibleRadiusX = convertToAppropriateUnit(
      measurement.realRadiusX,
    )
    const visibleRadiusY = convertToAppropriateUnit(
      measurement.realRadiusY,
    )
    const visiblePerimeter = convertToAppropriateUnit(
      measurement.realPerimeter,
    )
    const visibleArea = convertAreaToAppropriateUnit(
      measurement.realArea,
    )
    return [
      `半长轴：${visibleRadiusX.value} ${visibleRadiusX.unit}`,
      `半短轴：${visibleRadiusY.value} ${visibleRadiusY.unit}`,
      `周长：${visiblePerimeter.value} ${visiblePerimeter.unit}`,
      `面积：${visibleArea.value} ${visibleArea.unit}`,
    ].join('\n')
  }

  /**
   * 获取箭头的测量文本
   * @returns 测量文本
   */
  private _getArrowMeasurement() {
    return [].join('\n')
  }

  /**
   * 计算多边形的面积
   * @param points 点
   * @returns 面积
   */
  private _calculatePolygonArea(points: OverlayManagerTypes.Point[]) {
    let area = 0
    const n = points.length
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      area += points[i].x * points[j].y - points[i].y * points[j].x
    }
    return Math.abs(area) / 2
  }

  /**
   * 计算多边形的周长
   * @param points 点
   * @returns 周长
   */
  private _calculatePolygonPerimeter(points: OverlayManagerTypes.Point[]) {
    let perimeter = 0
    const n = points.length
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      perimeter += getDistance(points[i], points[j])
    }
    return perimeter
  }

  /**
   * 获取多边形的测量文本
   * @param polygon 多边形
   * @returns 测量文本
   */
  private _getPolygonMeasurement(polygon: Konva.Line) {
    const points = polygon.points().reduce((acc: OverlayManagerTypes.Point[], point, index) => {
      if (index % 2 === 0) {
        acc.push({ x: point, y: polygon.points()[index + 1] })
      }
      return acc
    }, [])

    const area = this._calculatePolygonArea(points)
    const perimeter = this._calculatePolygonPerimeter(points)
    const measurement: OverlayManagerTypes.PolygonMeasurement = polygon.getAttrs().measurement
    measurement.realArea = Math.abs(this._pixel2um(area))
    measurement.realPerimeter = Math.abs(this._pixel2um(perimeter))
    polygon.setAttrs({
      measurement,
    })
    const visibleArea = convertAreaToAppropriateUnit(
      measurement.realArea,
    )
    const visiblePerimeter = convertToAppropriateUnit(
      measurement.realPerimeter,
    )
    return [
      `面积：${visibleArea.value} ${visibleArea.unit}`,
      `周长：${visiblePerimeter.value} ${visiblePerimeter.unit}`,
    ].join('\n')
  }

  /**
   * 获取测距仪的测量文本
   * @param ruler 测距仪
   * @returns 测量文本
   */
  private _getRulerMeasurement(ruler: Konva.Line) {
    const points = ruler.points()
    const startPoint = {
      x: points[0] as number,
      y: points[1] as number,
    }
    const endPoint = {
      x: points[2] as number,
      y: points[3] as number,
    }
    const measurement: OverlayManagerTypes.RulerMeasurement = ruler.getAttrs().measurement
    measurement.realLength = this._pixel2um(getDistance(startPoint, endPoint))
    ruler.setAttrs({
      measurement,
    })
    const visibleLength = convertToAppropriateUnit(
      measurement.realLength,
    )
    return [`长度：${visibleLength.value} ${visibleLength.unit}`].join('\n')
  }

  /**
   * 获取旗子的测量文本
   * @returns 测量文本
   */
  private _getFlagMeasurement() {
    return [].join('\n')
  }

  /**
   * 获取测量文本
   * @param shape 形状
   * @returns 测量文本
   */
  public getMeasurementText(shape: OverlayManagerTypes.MainShape) {
    let measurementTextRaw = ''
    switch (shape.getAttrs().measurement.shapeType) {
      case DRAW_MODE.Circle:
        measurementTextRaw = this._getCircleMeasurementText(
          shape as Konva.Circle,
        )
        break
      case DRAW_MODE.Rect:
        measurementTextRaw = this._getRectMeasurementText(shape as Konva.Rect)
        break
      case DRAW_MODE.Ellipse:
        measurementTextRaw = this._getEllipseMeasurement(
          shape as Konva.Ellipse,
        )
        break
      case DRAW_MODE.Arrow:
        measurementTextRaw = this._getArrowMeasurement()
        break
      case DRAW_MODE.Polygon:
        measurementTextRaw = this._getPolygonMeasurement(shape as Konva.Line)
        break
      case DRAW_MODE.Ruler:
        measurementTextRaw = this._getRulerMeasurement(shape as Konva.Line)
        break
      case DRAW_MODE.Flag:
        measurementTextRaw = this._getFlagMeasurement()
        break
      default:
        break
    }

    const tagText = this._labelThinsVisible[`${LABEL_TYPE.TAG}Visible`]
      ? `标签：${shape.getAttrs().measurement.labelTag}`
      : ''

    const descriptionText = this._labelThinsVisible[`${LABEL_TYPE.DESCRIPTION}Visible`]
      ? `描述：${shape.getAttrs().measurement.description}`
      : ''

    const measurementText = this._labelThinsVisible[`${LABEL_TYPE.MEASUREMENT}Visible`]
      ? measurementTextRaw
      : ''

    const result = []
    if (tagText)
      result.push(tagText)
    if (measurementText)
      result.push(measurementText)
    if (descriptionText)
      result.push(descriptionText)
    return result.join('\n')
  }

  /**
   * 设置标签可见性
   * @param labelThinsVisible 标签可见性
   */
  public setLabelThinsVisible(labelThinsVisible: Required<OverlayManagerTypes.LabelThinsVisible>) {
    this._labelThinsVisible = labelThinsVisible
  }
}
