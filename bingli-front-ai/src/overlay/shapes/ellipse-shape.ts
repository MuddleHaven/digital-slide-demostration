import { ShapeBase, ShapeCreateOptions } from "./shape-base";
import OpenSeadragon from "openseadragon";
import AnchorFactory from "../anchor-controller/anchor-factory";
import {
  calculateEllipseMeasurements,
  formatEllipseMeasurements,
} from "../measurements/ellipse-measurement";
import { AnchorPosition } from "../anchor-controller/anchor-base";
import { IEllipseShape } from "../../types/types";
/**
 * 椭圆形状
 */
export default class EllipseShape extends ShapeBase {
  _mainShape: IEllipseShape;

  constructor(options: ShapeCreateOptions) {
    super(options);
    this._mainShape = this._shapeGroup
      .append("ellipse")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("rx", 0)
      .attr("ry", 0)
      .attr("data-type", "shape")
      .attr("fill", "transparent")
      .attr("stroke", this._strokeColor)
      .attr("stroke-width", this._strokeWidth * this._scale);
  }

  public setEllipse(
    startPoint: OpenSeadragon.Point,
    endPoint: OpenSeadragon.Point,
  ) {
    let cx: number, cy: number;
    const radiusX = Math.abs(endPoint.x - startPoint.x) / 2;
    const radiusY = Math.abs(endPoint.y - startPoint.y) / 2;
    cx = startPoint.x + radiusX;
    cy = startPoint.y + radiusY;
    if (endPoint.x - startPoint.x < 0) {
      cx = endPoint.x + radiusX;
    }
    if (endPoint.y - startPoint.y < 0) {
      cy = endPoint.y + radiusY;
    }

    this._mainShape
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("rx", radiusX)
      .attr("ry", radiusY);

    this._updateLabelText();
    this._updateLabelPosition();
    this.showLabel();
  }

  public initAnchor(): void {
    this._anchors = AnchorFactory.createAnchor(
      this.shapeType,
      this._mainShape,
      {
        svgContainer: this._svgContainer,
        parent: this._shapeGroup,
        anchorSize: this._anchorSize,
        anchorStrokeWidth: this._anchorStrokeWidth,
        scale: this._scale,
        transformHandler: this._updateEllipseSize.bind(this),
      },
    );
  }

  public containsPoint(point: OpenSeadragon.Point): boolean {
    // 获取椭圆的属性
    const cx = parseFloat(this._mainShape.attr("cx") || "0");
    const cy = parseFloat(this._mainShape.attr("cy") || "0");
    const rx = parseFloat(this._mainShape.attr("rx") || "0");
    const ry = parseFloat(this._mainShape.attr("ry") || "0");

    // 防止除以零
    if (rx === 0 || ry === 0) return false;

    // 计算点到椭圆中心的相对位置
    const dx = point.x - cx;
    const dy = point.y - cy;

    // 应用椭圆方程: (x-h)²/a² + (y-k)²/b² ≤ 1
    const result = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

    // 如果结果小于或等于1，则点在椭圆内部
    return result <= 1;
  }

  _updateLabelText() {
    const rx = parseFloat(this._mainShape.attr("rx") || "0");
    const ry = parseFloat(this._mainShape.attr("ry") || "0");

    this.setLabelText(
      formatEllipseMeasurements(
        calculateEllipseMeasurements(
          rx,
          ry,
          this._tMapInfo.scan_scale,
          this._tMapInfo.whole_width,
          this._tMapInfo.pixel_size,
        ),
      ),
    );
  }

  _updateLabelPosition(): void {
    const cx = parseFloat(this._mainShape.attr("cx") || "0");
    const cy = parseFloat(this._mainShape.attr("cy") || "0");

    this._labelGroup.attr("transform", `translate(${cx},${cy})`);
  }

  private _updateEllipseSize(
    point: OpenSeadragon.Point,
    anchorPosition: AnchorPosition,
  ): void {
    if (anchorPosition === AnchorPosition.MiddleRight) {
      const rx = parseFloat(this._mainShape.attr("rx") || "0");
      const cx = parseFloat(this._mainShape.attr("cx") || "0");
      const newRx = rx + point.x / 2;
      if (newRx <= 0) {
        return;
      }
      this._mainShape.attr("rx", newRx).attr("cx", cx + point.x / 2);
    }
    if (anchorPosition === AnchorPosition.BottomCenter) {
      const ry = parseFloat(this._mainShape.attr("ry") || "0");
      const cy = parseFloat(this._mainShape.attr("cy") || "0");
      const newRy = ry + point.y / 2;
      if (newRy <= 0) {
        return;
      }
      this._mainShape.attr("ry", newRy).attr("cy", cy + point.y / 2);
    }

    this._updateLabelText();
    this._updateLabelPosition();
  }

  public shapeMove(point: OpenSeadragon.Point) {
    // 获取当前位置
    const cx = parseFloat(this._mainShape.attr("cx") || "0");
    const cy = parseFloat(this._mainShape.attr("cy") || "0");

    // 更新位置
    this._mainShape.attr("cx", cx + point.x);
    this._mainShape.attr("cy", cy + point.y);

    this._updateAnchors();
    this._updateLabelPosition();
  }
}
