/**
 * 基础测量接口
 * 定义所有形状测量值的通用接口
 */
export interface BaseMeasurement {
  // 像素测量值
  pixelMeasurements: Record<string, number>;
  // 实际物理测量值（可选，取决于是否提供了像素尺寸）
  realMeasurements?: Record<string, number>;
}

/**
 * 将微米转换为最合适的单位（μm、mm或cm）
 * @param um 微米值
 * @returns 包含转换后的值和单位的对象
 */
export function convertToAppropriateUnit(um: number): {
  value: number;
  unit: string;
} {
  if (um >= 10000) {
    // 10mm = 10000μm
    return { value: um / 10000, unit: "cm" };
  } else if (um >= 1000) {
    // 1mm = 1000μm
    return { value: um / 1000, unit: "mm" };
  }
  return { value: um, unit: "μm" };
}

/**
 * 将面积（μm²）转换为最合适的单位（μm²、mm²或cm²）
 * @param um2 面积，单位为μm²
 * @returns 包含转换后的值和单位的对象
 */
export function convertAreaToAppropriateUnit(um2: number): {
  value: number;
  unit: string;
} {
  if (um2 >= 1e8) {
    // 1 cm² = 1e8 μm²
    return { value: um2 / 1e8, unit: "cm²" };
  } else if (um2 >= 1e6) {
    // 1 mm² = 1e6 μm²
    return { value: um2 / 1e6, unit: "mm²" };
  }
  return { value: um2, unit: "μm²" };
}

/**
 * 像素转换为微米
 * @param scale 缩放比例
 * @param normalizedPixel 归一化像素值
 * @param canvasWidth 画布宽度
 * @param pixelSize 像素尺寸
 * @returns 微米值
 */
export function pixel2um(
  scale: number,
  normalizedPixel: number,
  canvasWidth: number,
  pixelSize: number
): number {
  return (canvasWidth * normalizedPixel * pixelSize * 100000) / scale;
}
