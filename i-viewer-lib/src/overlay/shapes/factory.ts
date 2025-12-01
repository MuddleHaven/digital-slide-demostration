import type * as OverlayManagerTypes from '../types'
import type { Options } from './base'
import { DRAW_MODE } from '@/utils/constants'
import Arrow from './arrow'
import Circle from './circle'
import Ellipse from './ellipse'
import Polygon from './polygon'
import Rect from './rect'
import Ruler from './ruler'
import Flag from './flag'

/**
 * 形状工厂类
 * 负责创建不同类型的形状
 */
export default class ShapeFactory {
  public static createShape(
    type: OverlayManagerTypes.DrawMode,
    options: Options,
    point: OverlayManagerTypes.Point,
    attrs?: { [key: string]: any },
  ): OverlayManagerTypes.Shape | null {
    switch (type) {
      case DRAW_MODE.Circle:
        return new Circle(options, point, attrs)
      case DRAW_MODE.Rect:
        return new Rect(options, point, attrs)
      case DRAW_MODE.Ellipse:
        return new Ellipse(options, point, attrs)
      case DRAW_MODE.Arrow:
        return new Arrow(options, point, attrs)
      case DRAW_MODE.Polygon:
        return new Polygon(options, point, attrs)
      case DRAW_MODE.Ruler:
        return new Ruler(options, point, attrs)
      case DRAW_MODE.Flag:
        return new Flag(options, point, attrs)
      default:
        return null
    }
  }
}
