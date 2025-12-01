import type * as OverlayManagerTypes from '../types'
import type { Options } from './base'
import Konva from 'konva'
import { nanoid } from 'nanoid'
import { DRAW_MODE } from '@/utils/constants'
import { getCenterPoint, getDistance } from '../utils'
import BaseShape from './base'

export default class Circle extends BaseShape {
  _mainShape: Konva.Circle

  constructor(options: Options, point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    super(options, attrs)
    this._mainShape = this._createShape(point, attrs)
    this._startPoint = point
    this._layer.add(this._mainShape)
  }

  _createShape(point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    const shape = new Konva.Circle({
      x: attrs ? attrs.x : point.x,
      y: attrs ? attrs.y : point.y,
      radius: attrs ? attrs.radius : 0,
      stroke: this._shapeOptions.stroke,
      strokeWidth: this._shapeOptions.strokeWidth,
      strokeScaleEnabled: false,
      draggable: true,
      attrs: {
        id: attrs && attrs.id ? attrs.id : nanoid(),
        measurement: {
          shapeType: DRAW_MODE.Circle,
          labelTag: attrs ? attrs.measurement.labelTag : this._labelOptions.tag,
          description: attrs ? attrs.measurement.description : '',
          realRadius: attrs ? attrs.measurement.realRadius : 0,
          realCircumference: attrs ? attrs.measurement.realCircumference : 0,
          realArea: attrs ? attrs.measurement.realArea : 0,
        },
      },
    })
    return shape
  }

  _updateShape(point: OverlayManagerTypes.Point) {
    const distance = getDistance(point, this._startPoint)
    const centerPoint = getCenterPoint(point, this._startPoint)
    this._mainShape.position(centerPoint).radius(distance / 2)
  }

  _completeShape(point: OverlayManagerTypes.Point) {
    this._updateShape(point)
  }
}
