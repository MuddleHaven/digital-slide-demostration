import { DrawMode, IShape } from "../../types/types";
import { IAnchor } from "./anchor-factory";
/**
 * 控制锚点位置枚举
 */
export enum AnchorPosition {
  TopLeft = "top-left",
  TopCenter = "top-center",
  TopRight = "top-right",
  MiddleLeft = "middle-left",
  MiddleRight = "middle-right",
  BottomLeft = "bottom-left",
  BottomCenter = "bottom-center",
  BottomRight = "bottom-right",
  StartPoint = "start-point",
  EndPoint = "end-point",
}

/**
 * 控制锚点配置接口
 */
export interface AnchorCreateConfig {
  svgContainer: SVGGElement;
  parent: d3.Selection<SVGGElement, unknown, null, undefined>;
  cursor?: string;
  anchorSize: number;
  anchorStrokeWidth: number;
  scale: number;
  startPoint?: OpenSeadragon.Point;
  endPoint?: OpenSeadragon.Point;
  markerSize?: number;
  polygonPoints?: OpenSeadragon.Point[];
  transformHandler?: (...args: any[]) => void;
}

export type IAnchorShape = d3.Selection<
  SVGCircleElement,
  unknown,
  null,
  undefined
>;

export default abstract class AnchorBase {
  protected _shapeType: DrawMode;

  protected _shape: IShape;

  protected _anchorConfig: AnchorCreateConfig;

  protected _anchors: IAnchorShape[] = [];

  protected _draggingAnchor: IAnchorShape | null = null;

  constructor(
    shapeType: DrawMode,
    shape: IShape,
    anchorConfig: AnchorCreateConfig,
  ) {
    this._anchorConfig = anchorConfig;
    this._shapeType = shapeType;
    this._shape = shape;
    this.createAnchors();
  }

  /**
   * 创建锚点
   */
  public abstract createAnchors(): void;

  /**
   * 更新锚点位置
   */
  public abstract updateAnchors(): void;

  /**
   * 检查点是否在锚点内
   */
  public anchorContainsPoint(
    point: OpenSeadragon.Point,
  ): { anchor: IAnchor; current: IAnchorShape } | null {
    this._draggingAnchor =
      this._anchors.find((anchor) => {
        const cx = parseFloat(anchor.attr("cx") || "0");
        const cy = parseFloat(anchor.attr("cy") || "0");
        const r = parseFloat(anchor.attr("r") || "0");

        const dx = point.x - cx;
        const dy = point.y - cy;
        return dx * dx + dy * dy <= r * r;
      }) || null;
    return this._draggingAnchor
      ? { anchor: this, current: this._draggingAnchor }
      : null;
  }

  /**
   * 移动锚点
   * @param point
   */
  public abstract anchorMove(point: OpenSeadragon.Point): void;

  /**
   * 清除所有锚点
   */
  public clearAnchors(): void {
    this._anchors.forEach((anchor) => {
      anchor.remove();
    });
    this._anchors = [];
  }

  /**
   * 显示所有锚点
   */
  public showAnchors() {
    this._anchors.forEach((anchor) => {
      anchor.style("display", null);
    });
  }

  /**
   * 隐藏所有锚点
   */

  public hideAnchors() {
    this._anchors.forEach((anchor) => {
      anchor.style("display", "none");
    });
  }

  public resize(scale: number) {
    this._anchorConfig.scale = scale;
    this._anchors.forEach((anchor) => {
      anchor.attr("r", this._anchorConfig.anchorSize * scale);
      anchor.attr("stroke-width", this._anchorConfig.anchorStrokeWidth * scale);
    });
  }
}
