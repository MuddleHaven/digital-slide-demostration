import type * as OverlayManagerTypes from '../types'
import type { Options } from './base'
import Konva from 'konva'
import { nanoid } from 'nanoid'
import { DRAW_MODE } from '@/utils/constants'
import { getDistance } from '../utils'
import BaseShape from './base'

export default class Polygon extends BaseShape {
  _mainShape: Konva.Line

  private _tempLine: Konva.Line

  private _startPointShapeRadius = 5

  private _startPointShape: Konva.Circle

  private _snapDistance = 10

  private _isCompleted = false

  constructor(options: Options, point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    super(options, attrs)
    this._startPoint = point
    this._mainShape = this._createShape(point, attrs)
    this._tempLine = this._initTempLine(point)
    this._startPointShape = this._initStartPointShape(point)
  }

  _createShape(point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    const shape = new Konva.Line({
      points: attrs ? attrs.points : [point.x, point.y],
      stroke: this._shapeOptions.stroke,
      strokeWidth: this._shapeOptions.strokeWidth,
      strokeScaleEnabled: false,
      draggable: true,
      closed: !!attrs,
      attrs: {
        id: attrs && attrs.id ? attrs.id : nanoid(),
        measurement: {
          shapeType: DRAW_MODE.Polygon,
          labelTag: attrs ? attrs.measurement.labelTag : this._labelOptions.tag,
          description: attrs ? attrs.measurement.description : '',
          realArea: attrs ? attrs.measurement.realArea : 0,
          realPerimeter: attrs ? attrs.measurement.realPerimeter : 0,
        },
      },
    })
    this._layer.add(shape)
    return shape
  }

  private _initTempLine(point: OverlayManagerTypes.Point) {
    const tempLine = new Konva.Line({
      points: [point.x, point.y],
      strokeWidth: this._shapeOptions.strokeWidth,
      stroke: this._shapeOptions.stroke,
      strokeScaleEnabled: false,
      listening: false,
    })
    this._layer.add(tempLine)
    return tempLine
  }

  private _initStartPointShape(point: OverlayManagerTypes.Point) {
    const shape = new Konva.Circle({
      x: point.x,
      y: point.y,
      radius: this._startPointShapeRadius / this._stage.scaleX(),
      stroke: this._shapeOptions.stroke,
      strokeWidth: this._shapeOptions.strokeWidth,
      fill: '#fff',
      strokeScaleEnabled: false,
    })
    this._layer.add(shape)
    return shape
  }

  private _isSnap(point: OverlayManagerTypes.Point) {
    const distance = getDistance(this._startPoint, point)
    const points = this._mainShape.points()
    return distance < this._snapDistance / this._stage.scaleX() && points.length > 4
  }

  _updateShape(point: OverlayManagerTypes.Point) {
    let tempLinePoints = this._tempLine.points()
    if (this._isSnap(point)) {
      tempLinePoints = [...tempLinePoints.slice(0, 2), this._startPoint.x, this._startPoint.y]
      this._startPointShape.radius((this._startPointShapeRadius + 2) / this._stage.scaleX())
    }
    else {
      tempLinePoints = [...tempLinePoints.slice(0, 2), point.x, point.y]
      this._startPointShape.radius(this._startPointShapeRadius / this._stage.scaleX())
    }
    this._tempLine.points(tempLinePoints)
  }

  _completeShape() { }

  public addPoint(point: OverlayManagerTypes.Point) {
    if (this._isSnap(point)) {
      this._mainShape.closed(true)
      this._tempLine.destroy()
      this._startPointShape.destroy()
      this._isCompleted = true
      return
    }
    this._mainShape.points([...this._mainShape.points(), point.x, point.y])
    this._tempLine.points([point.x, point.y, point.x, point.y])
  }

  public checkIsCompleted() {
    return this._isCompleted
  }
}
