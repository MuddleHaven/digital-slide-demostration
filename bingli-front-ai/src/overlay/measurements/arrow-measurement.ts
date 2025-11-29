import {
  BaseMeasurement,
  pixel2um,
  convertToAppropriateUnit,
} from "./measurement-base";

/**
 * 箭头测量值接口
 */
export interface ArrowMeasurement extends BaseMeasurement {
  pixelMeasurements: {
    length: number;
  };
  realMeasurements?: {
    length: number;
  };
}

/**
 * 计算箭头的测量值
 * @param length 箭头的长度（像素）
 * @param scale 缩放比例
 * @param canvasWidth 画布宽度
 * @param pixelSize 像素尺寸（可选，如果提供则计算实际物理尺寸）
 * @returns 包含像素尺寸和实际物理尺寸的测量值对象
 */
export function calculateArrowMeasurements(
  length: number,
  scale: number,
  canvasWidth: number,
  pixelSize?: number
): ArrowMeasurement {
  const measurements: ArrowMeasurement = {
    pixelMeasurements: {
      length,
    },
  };

  // 如果提供了像素尺寸，计算实际物理尺寸
  if (pixelSize) {
    measurements.realMeasurements = {
      length: pixel2um(scale, length, canvasWidth, pixelSize),
    };
  }

  return measurements;
}

/**
 * 格式化箭头测量值显示
 * @param measurements 测量值对象
 * @returns 格式化后的显示字符串
 */
export function formatArrowMeasurements(measurement: ArrowMeasurement): string {
  const { length } = measurement.pixelMeasurements;

  if (measurement.realMeasurements) {
    const realLength = convertToAppropriateUnit(
      measurement.realMeasurements.length
    );

    return `长度： ${realLength.value.toFixed(2)}${realLength.unit}`;
  }

  return `长度： ${length.toFixed(2)}px`;
}
