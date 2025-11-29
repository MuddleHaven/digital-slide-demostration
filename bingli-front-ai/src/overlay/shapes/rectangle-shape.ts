import { ShapeBase, ShapeCreateOptions } from "./shape-base";
import OpenSeadragon from "openseadragon";
import AnchorFactory from "../anchor-controller/anchor-factory";
import { AnchorPosition } from "../anchor-controller/anchor-base";
import {
  calculateRectangleMeasurements,
  formatRectangleMeasurements,
} from "../measurements/rectangle-measurement";
import { IRectangleShape } from "../../types/types";
/**
 * 圆形形状
 */
export default class RectangleShape extends ShapeBase {
  _mainShape: IRectangleShape;

  constructor(options: ShapeCreateOptions) {
    super(options);
    this._mainShape = this._shapeGroup
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 0)
      .attr("height", 0)
      .attr("fill", "transparent")
      .attr("stroke", this._strokeColor)
      .attr("stroke-width", this._strokeWidth * this._scale);
  }

  public setRect(
    startPoint: OpenSeadragon.Point,
    endPoint: OpenSeadragon.Point,
  ) {
    const width = endPoint.x - startPoint.x;
    const height = endPoint.y - startPoint.y;
    let x = startPoint.x;
    let y = startPoint.y;
    if (width < 0) {
      x = endPoint.x;
    }
    if (height < 0) {
      y = endPoint.y;
    }
    this._mainShape
      .attr("x", x)
      .attr("y", y)
      .attr("width", Math.abs(width))
      .attr("height", Math.abs(height));

    this._updateLabelText();
    this._updateLabelPosition();
    this.showLabel();
  }

  public containsPoint(point: OpenSeadragon.Point): boolean {
    // 获取矩形的属性
    const x = parseFloat(this._mainShape.attr("x") || "0");
    const y = parseFloat(this._mainShape.attr("y") || "0");
    const width = parseFloat(this._mainShape.attr("width") || "0");
    const height = parseFloat(this._mainShape.attr("height") || "0");

    // 检查点是否在矩形边界内
    return (
      point.x >= x &&
      point.x <= x + width &&
      point.y >= y &&
      point.y <= y + height
    );
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
        transformHandler: this._updateRectangleSize.bind(this),
      },
    );
  }

  private _updateRectangleSize(
    point: OpenSeadragon.Point,
    anchorPosition: AnchorPosition,
  ) {
    let x = parseFloat(this._mainShape.attr("x") || "0");
    let y = parseFloat(this._mainShape.attr("y") || "0");
    let width = parseFloat(this._mainShape.attr("width") || "0");
    let height = parseFloat(this._mainShape.attr("height") || "0");

    let x1 = x,
      y1 = y,
      x2 = x + width,
      y2 = y + height;

    switch (anchorPosition) {
      case AnchorPosition.TopLeft:
        x1 += point.x;
        y1 += point.y;
        break;
      case AnchorPosition.TopRight:
        x2 += point.x;
        y1 += point.y;
        break;
      case AnchorPosition.BottomLeft:
        x1 += point.x;
        y2 += point.y;
        break;
      case AnchorPosition.BottomRight:
        x2 += point.x;
        y2 += point.y;
        break;
    }

    // 重新计算左上角和宽高，保证宽高为正
    const newX = Math.min(x1, x2);
    const newY = Math.min(y1, y2);
    const newWidth = Math.abs(x2 - x1);
    const newHeight = Math.abs(y2 - y1);

    this._mainShape
      .attr("x", newX)
      .attr("y", newY)
      .attr("width", newWidth)
      .attr("height", newHeight);

    this._updateAnchors();
    this._updateLabelText();
    this._updateLabelPosition();
  }

  _updateLabelText() {
    const width = parseFloat(this._mainShape.attr("width") || "0");
    const height = parseFloat(this._mainShape.attr("height") || "0");
    this.setLabelText(
      formatRectangleMeasurements(
        calculateRectangleMeasurements(
          width,
          height,
          this._tMapInfo.scan_scale,
          this._tMapInfo.whole_width,
          this._tMapInfo.pixel_size,
        ),
      ),
    );
  }

  /**
   * 更新标签位置
   */
  _updateLabelPosition(): void {
    const x = parseFloat(this._mainShape.attr("x") || "0");
    const y = parseFloat(this._mainShape.attr("y") || "0");
    const width = parseFloat(this._mainShape.attr("width") || "0");
    const height = parseFloat(this._mainShape.attr("height") || "0");

    // 设置标签位置在矩形中心
    this._labelGroup.attr(
      "transform",
      `translate(${x + width / 2},${y + height / 2})`,
    );
  }

  public shapeMove(point: OpenSeadragon.Point) {
    // 获取当前位置
    const x = parseFloat(this._mainShape.attr("x") || "0");
    const y = parseFloat(this._mainShape.attr("y") || "0");

    // 更新位置
    this._mainShape.attr("x", x + point.x);
    this._mainShape.attr("y", y + point.y);

    this._updateAnchors();
    this._updateLabelPosition();
  }
}
