import type * as OverlayManagerTypes from '../types'
import type { Options } from './base'
import Konva from 'konva'
import { nanoid } from 'nanoid'
import { DRAW_MODE } from '@/utils/constants'
import BaseShape from './base'

export default class Ruler extends BaseShape {
  _mainShape: Konva.Arrow

  constructor(options: Options, point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    super(options, attrs)
    this._mainShape = this._createShape(point, attrs)
    this._startPoint = point
    this._layer.add(this._mainShape)
  }

  _createShape(point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    const shape = new Konva.Arrow({
      points: attrs ? attrs.points : [point.x, point.y],
      pointerAtBeginning: true,
      pointerLength: 0,
      pointerWidth: (this._shapeOptions.strokeWidth * 5) / this._stage.scaleX(),
      fill: this._shapeOptions.stroke,
      stroke: this._shapeOptions.stroke,
      strokeWidth: this._shapeOptions.strokeWidth,
      hitStrokeWidth: this._shapeOptions.strokeWidth * 5,
      strokeScaleEnabled: false,
      draggable: true,
      attrs: {
        id: attrs && attrs.id ? attrs.id : nanoid(),
        measurement: {
          shapeType: DRAW_MODE.Ruler,
          labelTag: attrs ? attrs.measurement.labelTag : this._labelOptions.tag,
          description: attrs ? attrs.measurement.description : '',
          realLength: attrs ? attrs.measurement.realLength : 0,
        },
      },
    })
    return shape
  }

  _updateShape(point: OverlayManagerTypes.Point) {
    this._mainShape.points([this._startPoint.x, this._startPoint.y, point.x, point.y])
  }

  _completeShape(point: OverlayManagerTypes.Point) {
    this._updateShape(point)
  }
}
