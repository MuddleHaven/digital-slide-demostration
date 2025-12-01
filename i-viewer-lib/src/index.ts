// 主入口文件 - 使用现代化的ES模块导出方式

// 显式导出所有类
import OpenSeadragon from 'openseadragon'

export { OpenSeadragon }

export { FilterManager } from './filter'
// 导出常量
export { DEFAULT_FILTER_PARAMS, FILTER_PARAMS_RANGE } from './filter'
// 导出所有类型
export type { FilterParams } from './filter'
export { OsdManager } from './osd'
export type { MyOsd } from './osd'

export { OverlayManager } from './overlay'
export type {
  BaseMeasurement,
  CircleMeasurement,
  CursorStyle,
  DrawMode,
  EllipseMeasurement,
  EventOnwer,
  LabelOptions,
  LabelThinsVisible,
  LabelType,
  MainShape,
  Point,
  PolygonMeasurement,
  RectMeasurement,
  RulerMeasurement,
  Shape,
  ShapeAttr,
  ShapeOptions,
} from './overlay'

export { ScreenShotManager } from './screen-shot'
export type { ScreenShotOptions } from './screen-shot'
export * as Constants from './utils/constants'
