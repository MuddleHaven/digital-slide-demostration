import {
  BaseMeasurement,
  pixel2um,
  convertToAppropriateUnit,
  convertAreaToAppropriateUnit,
} from "./measurement-base";

/**
 * 圆形测量值接口
 */
export interface CircleMeasurement extends BaseMeasurement {
  pixelMeasurements: {
    radius: number;
    circumference: number;
    area: number;
  };
  realMeasurements?: {
    radius: number;
    circumference: number;
    area: number;
  };
}

/**
 * 计算圆形的测量值
 * @param radius 圆的半径（像素）
 * @param scale 缩放比例
 * @param canvasWidth 画布宽度（可选，如果提供则计算实际物理尺寸）
 * @param pixelSize 像素尺寸（可选，如果提供则计算实际物理尺寸）
 * @returns 包含像素尺寸和实际物理尺寸的测量值对象
 */
export function calculateCircleMeasurements(
  radius: number,
  scale: number,
  canvasWidth: number,
  pixelSize?: number
): CircleMeasurement {
  // 计算像素尺寸
  const pixelCircumference = 2 * Math.PI * radius;
  const pixelArea = Math.PI * radius * radius;

  const measurements: CircleMeasurement = {
    pixelMeasurements: {
      radius,
      circumference: pixelCircumference,
      area: pixelArea,
    },
  };

  // 如果提供了像素尺寸，计算实际物理尺寸
  if (pixelSize) {
    measurements.realMeasurements = {
      radius: pixel2um(scale, radius, pixelSize, canvasWidth),
      circumference: pixel2um(
        scale,
        pixelCircumference,
        pixelSize,
        canvasWidth
      ),
      // 面积需要特殊处理，因为它是平方单位
      area: pixel2um(scale, Math.sqrt(pixelArea), canvasWidth, pixelSize) ** 2,
    };
  }

  return measurements;
}

/**
 * 格式化圆形测量值显示
 * @param measurements 测量值对象
 * @returns 格式化后的显示字符串
 */
export function formatCircleMeasurements(
  measurement: CircleMeasurement
): string {
  const { radius, circumference, area } = measurement.pixelMeasurements;

  if (measurement.realMeasurements) {
    const realRadius = convertToAppropriateUnit(
      measurement.realMeasurements.radius
    );
    const realCircumference = convertToAppropriateUnit(
      measurement.realMeasurements.circumference
    );
    // 面积单位转换
    const realArea = convertAreaToAppropriateUnit(
      measurement.realMeasurements.area
    );

    return (
      `半径： ${realRadius.value.toFixed(2)}${realRadius.unit}\n` +
      `周长： ${realCircumference.value.toFixed(2)}${realCircumference.unit}\n` +
      `面积： ${realArea.value.toFixed(2)}${realArea.unit}`
    );
  }

  return (
    `半径： ${radius.toFixed(2)}px\n` +
    `周长： ${circumference.toFixed(2)}px\n` +
    `面积： ${area.toFixed(2)}px²`
  );
}
