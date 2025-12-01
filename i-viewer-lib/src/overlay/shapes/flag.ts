import type * as OverlayManagerTypes from '../types'
import type { Options } from './base'
import Konva from 'konva'
import { nanoid } from 'nanoid'
import { DRAW_MODE } from '@/utils/constants'
import BaseShape from './base'

export default class Flag extends BaseShape {
  constructor(options: Options, point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    super(options, attrs)
    this._mainShape = this._createShape(point, attrs)
  }

  _createShape(point: OverlayManagerTypes.Point, attrs?: OverlayManagerTypes.ShapeAttr) {
    const scale = 1 / this._stage.scaleX()

    // 创建旗帜路径，包含旗杆底部、旗杆主体和旗帜
    const flagPath = new Konva.Path({
      x: attrs ? attrs.x : point.x,
      y: attrs ? attrs.y : point.y,
      data: 'M8 44H12H16 M12 44V4 M40 6H12V22H40L36 14L40 6Z',
      fill: attrs?.stroke || this._shapeOptions.stroke,
      stroke: attrs?.stroke || this._shapeOptions.stroke,
      strokeScaleEnabled: false,
      strokeWidth: attrs?.strokeWidth || this._shapeOptions.strokeWidth,
      draggable: true,
      scale: {
        x: scale,
        y: scale,
      },
      offset: {
        x: 12, // 旗杆中心点作为X轴变换原点
        y: 44, // 旗杆底部作为Y轴变换原点
      },
      attrs: {
        id: attrs && attrs.id ? attrs.id : nanoid(),
        measurement: {
          shapeType: DRAW_MODE.Flag,
          labelTag: attrs ? attrs.measurement.labelTag : this._labelOptions.tag,
          description: attrs ? attrs.measurement.description : '',
        },
      },
    })
    this._layer.add(flagPath)
    return flagPath
  }

  _updateShape(point: OverlayManagerTypes.Point) {
    this._mainShape.position(point)
  }

  _completeShape(point: OverlayManagerTypes.Point) {
    this._updateShape(point)
  }
}
