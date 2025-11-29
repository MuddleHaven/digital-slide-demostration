import {
  DrawMode,
  ICircleShape,
  IEllipseShape,
  IRectangleShape,
  IShape,
  IArrowShape,
  IRulerShape,
  IPolygonShape,
} from "../../types/types";
import { AnchorCreateConfig } from "./anchor-base";
import CircleAnchor from "./circle-anchor";
import EllipseAnchor from "./ellipse-anchor";
import RectangleAnchor from "./rectangle-anchor";
import ArrowAnchor from "./arrow-anchor";
import RulerAnchor from "./ruler-anchor";
import PolygonAnchor from "./polygon-anchor";

export type IAnchor = CircleAnchor;

export default class AnchorFactory {
  public static createAnchor(
    shapeType: DrawMode,
    shape: IShape,
    options: AnchorCreateConfig
  ): IAnchor | null {
    switch (shapeType) {
      case DrawMode.Circle:
        return new CircleAnchor(shapeType, shape as ICircleShape, options);
      case DrawMode.Rectangle:
        return new RectangleAnchor(
          shapeType,
          shape as IRectangleShape,
          options
        );
      case DrawMode.Ellipse:
        return new EllipseAnchor(shapeType, shape as IEllipseShape, options);
      case DrawMode.Arrow:
        return new ArrowAnchor(shapeType, shape as IArrowShape, options);
      case DrawMode.Polygon:
        return new PolygonAnchor(shapeType, shape as IPolygonShape, options);
      case DrawMode.Ruler:
        return new RulerAnchor(shapeType, shape as IRulerShape, options);
      default:
        return null;
    }
  }
}
