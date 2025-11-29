import { BaseMeasurement, pixel2um, convertToAppropriateUnit, convertAreaToAppropriateUnit } from './measurement-base';

/**
 * 椭圆测量值接口
 */
export interface EllipseMeasurement extends BaseMeasurement {
  pixelMeasurements: {
    radiusX: number;
    radiusY: number;
    perimeter: number;
    area: number;
  };
  realMeasurements?: {
    radiusX: number;
    radiusY: number;
    perimeter: number;
    area: number;
  };
}

/**
 * 计算椭圆的测量值
 * @param radiusX 椭圆X轴半径（像素）
 * @param radiusY 椭圆Y轴半径（像素）
 * @param scale 缩放比例
 * @param canvasWidth 画布宽度
 * @param pixelSize 像素尺寸（可选，如果提供则计算实际物理尺寸）
 * @returns 包含像素尺寸和实际物理尺寸的测量值对象
 */
export function calculateEllipseMeasurements(
  radiusX: number,
  radiusY: number,
  scale: number,
  canvasWidth: number,
  pixelSize?: number
): EllipseMeasurement {
  // 计算像素尺寸
  // 椭圆周长近似公式：2π * sqrt((a² + b²) / 2)，其中a和b是半长轴和半短轴
  const pixelPerimeter = 2 * Math.PI * Math.sqrt((radiusX * radiusX + radiusY * radiusY) / 2);
  const pixelArea = Math.PI * radiusX * radiusY;

  const measurements: EllipseMeasurement = {
    pixelMeasurements: {
      radiusX,
      radiusY,
      perimeter: pixelPerimeter,
      area: pixelArea,
    }
  };

  // 如果提供了像素尺寸，计算实际物理尺寸
  if (pixelSize) {
    measurements.realMeasurements = {
      radiusX: pixel2um(scale, radiusX, canvasWidth, pixelSize),
      radiusY: pixel2um(scale, radiusY, canvasWidth, pixelSize),
      perimeter: pixel2um(scale, pixelPerimeter, canvasWidth, pixelSize),
      // 面积需要特殊处理，因为它是平方单位
      area: pixel2um(scale, Math.sqrt(pixelArea), canvasWidth, pixelSize) ** 2,
    };
  }

  return measurements;
}

/**
 * 格式化椭圆测量值显示
 * @param measurements 测量值对象
 * @returns 格式化后的显示字符串
 */
export function formatEllipseMeasurements(measurement: EllipseMeasurement): string {
  const { radiusX, radiusY, perimeter, area } = measurement.pixelMeasurements;

  if (measurement.realMeasurements) {
    const realRadiusX = convertToAppropriateUnit(measurement.realMeasurements.radiusX);
    const realRadiusY = convertToAppropriateUnit(measurement.realMeasurements.radiusY);
    const realPerimeter = convertToAppropriateUnit(measurement.realMeasurements.perimeter);
    const realArea = convertAreaToAppropriateUnit(measurement.realMeasurements.area);

    return `长轴： ${realRadiusX.value.toFixed(2)}${realRadiusX.unit}\n` +
           `短轴： ${realRadiusY.value.toFixed(2)}${realRadiusY.unit}\n` +
           `周长： ${realPerimeter.value.toFixed(2)}${realPerimeter.unit}\n` +
           `面积： ${realArea.value.toFixed(2)}${realArea.unit}`;
  }

  return `长轴： ${radiusX.toFixed(2)}px\n` +
         `短轴： ${radiusY.toFixed(2)}px\n` +
         `周长： ${perimeter.toFixed(2)}px\n` +
         `面积： ${area.toFixed(2)}px²`;
}
