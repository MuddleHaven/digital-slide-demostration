import type Konva from 'konva'
import type * as OverlayManagerTypes from './types'

/**
 * 获取正确的指针位置
 * @returns {OverlayManagerTypes.Point | null} 指针位置
 */
export function getCorrectPointerPosition(stage: Konva.Stage): OverlayManagerTypes.Point | null {
  const pos = stage.getRelativePointerPosition()
  if (!pos)
    return null

  return { x: pos.x, y: pos.y }
}

export function getDistance(point1: OverlayManagerTypes.Point, point2: OverlayManagerTypes.Point) {
  return Math.sqrt(
    (point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2,
  )
}

export function getCenterPoint(point1: OverlayManagerTypes.Point, point2: OverlayManagerTypes.Point) {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2,
  }
}

export function getDistanceX(point1: OverlayManagerTypes.Point, point2: OverlayManagerTypes.Point) {
  return Math.abs(point1.x - point2.x)
}

export function getDistanceY(point1: OverlayManagerTypes.Point, point2: OverlayManagerTypes.Point) {
  return Math.abs(point1.y - point2.y)
}

export function roundToDecimalPlaces(num: number, decimalPlaces: number): number {
  const factor = 10 ** decimalPlaces
  return Math.round(num * factor) / factor
}
/**
 * 将微米转换为最合适的单位（μm、mm或cm）
 * @param um 微米值
 * @returns 包含转换后的值和单位的对象
 */
export function convertToAppropriateUnit(um: number): {
  value: number
  unit: string
} {
  if (um >= 10000) {
    // 10mm = 10000μm
    return { value: roundToDecimalPlaces(um / 10000, 2), unit: 'cm' }
  }
  else if (um >= 1000) {
    // 1mm = 1000μm
    return { value: roundToDecimalPlaces(um / 1000, 2), unit: 'mm' }
  }
  return { value: roundToDecimalPlaces(um, 2), unit: 'μm' }
}

/**
 * 将面积（μm²）转换为最合适的单位（μm²、mm²或cm²）
 * @param um2 面积，单位为μm²
 * @returns 包含转换后的值和单位的对象
 */
export function convertAreaToAppropriateUnit(um2: number): {
  value: number
  unit: string
} {
  if (um2 >= 1e8) {
    // 1 cm² = 1e8 μm²
    return { value: roundToDecimalPlaces(um2 / 1e8, 2), unit: 'cm²' }
  }
  else if (um2 >= 1e6) {
    // 1 mm² = 1e6 μm²
    return { value: roundToDecimalPlaces(um2 / 1e6, 2), unit: 'mm²' }
  }
  return { value: roundToDecimalPlaces(um2, 2), unit: 'μm²' }
}
