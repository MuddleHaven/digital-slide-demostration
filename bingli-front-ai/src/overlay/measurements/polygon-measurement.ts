import * as d3 from "d3";
import {
  BaseMeasurement,
  pixel2um,
  convertToAppropriateUnit,
  convertAreaToAppropriateUnit,
} from "./measurement-base";

/**
 * 多边形测量值接口
 */
export interface PolygonMeasurement extends BaseMeasurement {
  pixelMeasurements: {
    perimeter: number;
    area: number;
  };
  realMeasurements?: {
    perimeter: number;
    area: number;
  };
}

/**
 * 计算多边形的测量值
 * @param points 多边形的点（像素）
 * @param scale 缩放比例
 * @param canvasWidth 画布宽度
 * @param pixelSize 像素尺寸（可选，如果提供则计算实际物理尺寸）
 * @returns 包含像素尺寸和实际物理尺寸的测量值对象
 */
export function calculatePolygonMeasurements(
  points: OpenSeadragon.Point[],
  scale: number,
  canvasWidth: number,
  pixelSize?: number
): PolygonMeasurement {
  // 计算周长
  const perimeter = d3.polygonLength(points.map((point) => [point.x, point.y]));

  // 计算面积（使用鞋带公式）
  const area = d3.polygonArea(points.map((point) => [point.x, point.y]));

  const measurements: PolygonMeasurement = {
    pixelMeasurements: {
      perimeter,
      area,
    },
  };

  // 如果提供了像素尺寸，计算实际物理尺寸
  if (pixelSize) {
    measurements.realMeasurements = {
      perimeter: pixel2um(scale, perimeter, canvasWidth, pixelSize),
      // 面积需要特殊处理，因为它是平方单位
      area: pixel2um(scale, Math.sqrt(area), canvasWidth, pixelSize) ** 2,
    };
  }

  return measurements;
}

/**
 * 格式化多边形测量值显示
 * @param measurements 测量值对象
 * @returns 格式化后的显示字符串
 */
export function formatPolygonMeasurements(
  measurement: PolygonMeasurement
): string {
  const { perimeter, area } = measurement.pixelMeasurements;

  if (measurement.realMeasurements) {
    const realPerimeter = convertToAppropriateUnit(
      measurement.realMeasurements.perimeter
    );
    // 面积单位转换
    const realArea = convertAreaToAppropriateUnit(
      measurement.realMeasurements.area
    );

    return (
      `周长： ${realPerimeter.value.toFixed(2)}${realPerimeter.unit}\n` +
      `面积： ${realArea.value.toFixed(2)}${realArea.unit}`
    );
  }

  return `周长： ${perimeter.toFixed(2)}px\n` + `面积： ${area.toFixed(2)}px²`;
}
