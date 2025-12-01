export type Konva = typeof import('konva')
export type Constants = typeof import('../utils/constants')
export type DRAW_MODE = Constants['DRAW_MODE']
export type EVENT_OWNER = Constants['EVENT_OWNER']
export type LABEL_TYPE = Constants['LABEL_TYPE']

export type DrawMode = typeof DRAW_MODE[keyof typeof DRAW_MODE]
export type EventOnwer = typeof EVENT_OWNER[keyof typeof EVENT_OWNER]
export type LabelType = keyof typeof LABEL_TYPE
export type LabelThinsVisible = {
  [K in keyof typeof LABEL_TYPE as `${typeof LABEL_TYPE[K]}Visible`]?: boolean
}

export type ICircle = import('./shapes').Circle
export type IRect = import('./shapes').Rect
export type IEllipse = import('./shapes').Ellipse
export type IArrow = import('./shapes').Arrow
export type IPolygon = import('./shapes').Polygon
export type IRuler = import('./shapes').Ruler
export type IFlag = import('./shapes').Flag

export type Shape = ICircle | IRect | IEllipse | IArrow | IPolygon | IRuler | IFlag
export type MainShape = Konva.Circle | Konva.Rect | Konva.Ellipse | Konva.Arrow | Konva.Line | Konva.Image

export interface LabelOptions extends LabelThinsVisible {
  fontSize?: number
  pixelSize?: number
  alwaysVisible?: boolean
  tag?: string
  editDescriptionEvent?: (description: string, cb: (description: string) => void) => void
}

export interface ShapeOptions {
  strokeWidth?: number
  stroke?: string
  visible?: boolean
  drawComplete?: (shape: Shape) => void
  dragComplete?: (shape: Shape) => void
  transformComplete?: (shape: Shape) => void
  deleteComplete?: (shape: Shape) => void
}

export type ITransformer = import('./transformer').default

export interface BaseShapeOptions {
  stage: Konva.Stage
  layer: Konva.Layer
  transformer: ITransformer
}

export interface KonvaOptions {
  size: { width: number, height: number }
  rotation: number
  scale: { x: number, y: number }
  position: { x: number, y: number }
  flip: boolean
}

export interface Point {
  x: number
  y: number
}

export interface BaseMeasurement {
  shapeType: DrawMode
  labelTag: string
  description: string
}

export interface CircleMeasurement extends BaseMeasurement {
  realRadius: number
  realCircumference: number
  realArea: number
}

export interface RectMeasurement extends BaseMeasurement {
  realWidth: number
  realHeight: number
  realArea: number
  realPerimeter: number
}

export interface EllipseMeasurement extends BaseMeasurement {
  realRadiusX: number
  realRadiusY: number
  realArea: number
  realPerimeter: number
}

export interface PolygonMeasurement extends BaseMeasurement {
  realArea: number
  realPerimeter: number
}

export interface RulerMeasurement extends BaseMeasurement {
  realLength: number
}

export interface ShapeAttr {
  [key: string]: any
}

export type CursorStyle = 'auto' | 'crosshair' | 'grab' | 'grabbing' | 'all-scroll' | 'move' | 'pointer'
