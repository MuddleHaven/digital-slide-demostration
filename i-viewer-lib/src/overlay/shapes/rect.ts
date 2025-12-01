import type * as OverlayManagerTypes from '../types'
import type { Options } from './base'
import Konva from 'konva'
import { nanoid } from 'nanoid'
import { DRAW_MODE } from '@/utils/constants'
import BaseShape from './base'

export default class Rect extends BaseShape {
  _mainShape: Konva.Rect

  constructor(options: Options, point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    super(options, attrs)
    this._mainShape = this._createShape(point, attrs)
    this._startPoint = point
    this._layer.add(this._mainShape)
  }

  _createShape(point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    const shape = new Konva.Rect({
      x: attrs ? attrs.x : point.x,
      y: attrs ? attrs.y : point.y,
      width: attrs ? attrs.width : 0,
      height: attrs ? attrs.height : 0,
      draggable: true,
      stroke: this._shapeOptions.stroke,
      strokeWidth: this._shapeOptions.strokeWidth,
      strokeScaleEnabled: false,
      attrs: {
        id: attrs && attrs.id ? attrs.id : nanoid(),
        measurement: {
          shapeType: DRAW_MODE.Rect,
          labelTag: attrs ? attrs.measurement.labelTag : this._labelOptions.tag,
          description: attrs ? attrs.measurement.description : '',
          realWidth: attrs ? attrs.measurement.realWidth : 0,
          realHeight: attrs ? attrs.measurement.realHeight : 0,
          realArea: attrs ? attrs.measurement.realArea : 0,
          realPerimeter: attrs ? attrs.measurement.realPerimeter : 0,
        },
      },
    })
    return shape
  }

  _updateShape(point: OverlayManagerTypes.Point) {
    this._mainShape
      .width(point.x - this._mainShape.x())
      .height(point.y - this._mainShape.y())
  }

  _completeShape(point: OverlayManagerTypes.Point) {
    this._updateShape(point)
  }
}
