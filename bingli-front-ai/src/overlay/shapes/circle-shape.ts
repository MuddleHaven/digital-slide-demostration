import { ShapeBase, ShapeCreateOptions } from "./shape-base";
import OpenSeadragon from "openseadragon";
import AnchorFactory from "../anchor-controller/anchor-factory";
import { ICircleShape } from "../../types/types";
import {
  calculateCircleMeasurements,
  formatCircleMeasurements,
} from "../measurements/circle-measurement";

/**
 * 圆形形状
 */
export default class CircleShape extends ShapeBase {
  _mainShape: ICircleShape;

  constructor(options: ShapeCreateOptions) {
    super(options);
    this._mainShape = this._shapeGroup
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 0)
      .attr("data-type", "shape")
      .attr("fill", "transparent")
      .attr("stroke", this._strokeColor)
      .attr("stroke-width", this._strokeWidth * this._scale);
  }

  public setCircle(
    startPoint: OpenSeadragon.Point,
    endPoint: OpenSeadragon.Point,
  ) {
    const radius = endPoint.distanceTo(startPoint) / 2;
    // 计算圆心 - 起始点和终点的中点
    const centerX = (startPoint.x + endPoint.x) / 2;
    const centerY = (startPoint.y + endPoint.y) / 2;
    this._mainShape.attr("cx", centerX).attr("cy", centerY).attr("r", radius);

    this._updateLabelText();
    this._updateLabelPosition();
    this.showLabel();
  }

  public containsPoint(point: OpenSeadragon.Point): boolean {
    const cx = parseFloat(this._mainShape.attr("cx") || "0");
    const cy = parseFloat(this._mainShape.attr("cy") || "0");
    const r = parseFloat(this._mainShape.attr("r") || "0");

    const dx = point.x - cx;
    const dy = point.y - cy;
    return dx * dx + dy * dy <= r * r;
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
        transformHandler: this._updateCircleSize.bind(this),
      },
    );
  }

  _updateCircleSize(point: OpenSeadragon.Point) {
    const r = parseFloat(this._mainShape.attr("r"));
    const cx = parseFloat(this._mainShape.attr("cx"));
    const nR = r + point.x / 2;
    if (nR <= 0) return;
    this._mainShape.attr("r", nR).attr("cx", cx + point.x / 2);
    this._updateAnchors();
    this._updateLabelText();
    this._updateLabelPosition();
  }

  _updateLabelText() {
    const radius = parseFloat(this._mainShape.attr("r"));
    this.setLabelText(
      formatCircleMeasurements(
        calculateCircleMeasurements(
          radius,
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
    // 获取圆心位置
    const cx = parseFloat(this._mainShape.attr("cx") || "0");
    const cy = parseFloat(this._mainShape.attr("cy") || "0");

    // 设置标签位置在圆心
    this._labelGroup.attr("transform", `translate(${cx},${cy})`);
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
