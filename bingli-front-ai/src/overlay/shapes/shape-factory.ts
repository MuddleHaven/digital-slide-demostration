import { ShapeCreateOptions } from "./shape-base";
import { DrawMode, IShapeController } from "../../types/types";
import CircleShape from "./circle-shape";
import RectangleShape from "./rectangle-shape";
import EllipseShape from "./ellipse-shape";
import ArrowShape from "./arrow-shape";
import PolygonShape from "./polygon-shape";
import RulerShape from "./ruler-shape";
/**
 * 形状工厂类
 * 负责创建不同类型的形状
 */
export default class ShapeFactory {
  public static createShape(
    type: DrawMode,
    options: ShapeCreateOptions
  ): IShapeController | null {
    switch (type) {
      case DrawMode.Circle:
        return new CircleShape(options);
      case DrawMode.Rectangle:
        return new RectangleShape(options);
      case DrawMode.Ellipse:
        return new EllipseShape(options);
      case DrawMode.Arrow:
        return new ArrowShape(options);
      case DrawMode.Polygon:
        return new PolygonShape(options);
      case DrawMode.Ruler:
        return new RulerShape(options);
      default:
        return null;
    }
  }
}
