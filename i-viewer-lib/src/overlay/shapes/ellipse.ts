import type * as OverlayManagerTypes from '../types'
import type { Options } from './base'
import Konva from 'konva'
import { nanoid } from 'nanoid'
import { DRAW_MODE } from '@/utils/constants'
import { getCenterPoint, getDistanceX, getDistanceY } from '../utils'
import BaseShape from './base'

export default class Ellipse extends BaseShape {
  _mainShape: Konva.Ellipse

  constructor(options: Options, point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    super(options, attrs)
    this._mainShape = this._createShape(point, attrs)
    this._startPoint = point
    this._layer.add(this._mainShape)
  }

  _createShape(point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    const shape = new Konva.Ellipse({
      x: attrs ? attrs.x : point.x,
      y: attrs ? attrs.y : point.y,
      radiusX: attrs ? attrs.radiusX : 0,
      radiusY: attrs ? attrs.radiusY : 0,
      stroke: this._shapeOptions.stroke,
      strokeWidth: this._shapeOptions.strokeWidth,
      strokeScaleEnabled: false,
      draggable: true,
      attrs: {
        id: attrs && attrs.id ? attrs.id : nanoid(),
        measurement: {
          shapeType: DRAW_MODE.Ellipse,
          labelTag: attrs ? attrs.measurement.labelTag : this._labelOptions.tag,
          description: attrs ? attrs.measurement.description : '',
          realRadiusX: attrs ? attrs.measurement.realRadiusX : 0,
          realRadiusY: attrs ? attrs.measurement.realRadiusY : 0,
          realArea: attrs ? attrs.measurement.realArea : 0,
          realPerimeter: attrs ? attrs.measurement.realPerimeter : 0,
        },
      },
    })
    return shape
  }

  _updateShape(point: OverlayManagerTypes.Point) {
    const distanceX = getDistanceX(point, this._startPoint)
    const distanceY = getDistanceY(point, this._startPoint)
    const centerPoint = getCenterPoint(point, this._startPoint)
    this._mainShape.position(centerPoint).radiusX(distanceX / 2).radiusY(distanceY / 2)
  }

  _completeShape(point: OverlayManagerTypes.Point) {
    this._updateShape(point)
  }
}
