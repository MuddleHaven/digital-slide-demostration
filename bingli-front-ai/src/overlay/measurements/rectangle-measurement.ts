import {
  BaseMeasurement,
  pixel2um,
  convertToAppropriateUnit,
  convertAreaToAppropriateUnit,
} from "./measurement-base";

/**
 * 矩形测量值接口
 */
export interface RectangleMeasurement extends BaseMeasurement {
  pixelMeasurements: {
    width: number;
    height: number;
    perimeter: number;
    area: number;
  };
  realMeasurements?: {
    width: number;
    height: number;
    perimeter: number;
    area: number;
  };
}

/**
 * 计算矩形的测量值
 * @param width 矩形的宽度（像素）
 * @param height 矩形的高度（像素）
 * @param scale 缩放比例
 * @param canvasWidth 画布宽度
 * @param pixelSize 像素尺寸（可选，如果提供则计算实际物理尺寸）
 * @returns 包含像素尺寸和实际物理尺寸的测量值对象
 */
export function calculateRectangleMeasurements(
  width: number,
  height: number,
  scale: number,
  canvasWidth: number,
  pixelSize?: number
): RectangleMeasurement {
  // 计算像素尺寸
  const pixelPerimeter = 2 * (width + height);
  const pixelArea = width * height;

  const measurements: RectangleMeasurement = {
    pixelMeasurements: {
      width,
      height,
      perimeter: pixelPerimeter,
      area: pixelArea,
    },
  };

  // 如果提供了像素尺寸，计算实际物理尺寸
  if (pixelSize) {
    measurements.realMeasurements = {
      width: pixel2um(scale, width, canvasWidth, pixelSize),
      height: pixel2um(scale, height, canvasWidth, pixelSize),
      perimeter: pixel2um(scale, pixelPerimeter, canvasWidth, pixelSize),
      // 面积需要特殊处理，因为它是平方单位
      area: pixel2um(scale, Math.sqrt(pixelArea), canvasWidth, pixelSize) ** 2,
    };
  }

  return measurements;
}

/**
 * 格式化矩形测量值显示
 * @param measurements 测量值对象
 * @returns 格式化后的显示字符串
 */
export function formatRectangleMeasurements(
  measurement: RectangleMeasurement
): string {
  const { width, height, perimeter, area } = measurement.pixelMeasurements;

  if (measurement.realMeasurements) {
    const realWidth = convertToAppropriateUnit(
      measurement.realMeasurements.width
    );
    const realHeight = convertToAppropriateUnit(
      measurement.realMeasurements.height
    );
    const realPerimeter = convertToAppropriateUnit(
      measurement.realMeasurements.perimeter
    );
    // 面积单位转换
    const realArea = convertAreaToAppropriateUnit(
      measurement.realMeasurements.area
    );

    return (
      `宽度： ${realWidth.value.toFixed(2)}${realWidth.unit}\n` +
      `高度： ${realHeight.value.toFixed(2)}${realHeight.unit}\n` +
      `周长： ${realPerimeter.value.toFixed(2)}${realPerimeter.unit}\n` +
      `面积： ${realArea.value.toFixed(2)}${realArea.unit}`
    );
  }

  return (
    `宽度： ${width.toFixed(2)}px\n` +
    `高度： ${height.toFixed(2)}px\n` +
    `周长： ${perimeter.toFixed(2)}px\n` +
    `面积： ${area.toFixed(2)}px²`
  );
}
