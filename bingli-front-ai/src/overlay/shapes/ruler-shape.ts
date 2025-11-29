import * as d3 from "d3";
import { ShapeBase, ShapeCreateOptions } from "./shape-base";
import OpenSeadragon from "openseadragon";
import * as turf from "@turf/turf";
import AnchorFactory from "../anchor-controller/anchor-factory";
import {
  calculateRulerMeasurements,
  formatRulerMeasurements,
} from "../measurements/ruler-measurement";
import { IRulerShape } from "../../types/types";
/**
 * 圆形形状
 */
export default class RulerShape extends ShapeBase {
  _mainShape: IRulerShape;

  private _startMarker: d3.Selection<SVGLineElement, unknown, null, undefined>;

  private _endMarker: d3.Selection<SVGLineElement, unknown, null, undefined>;

  private _startPoint: OpenSeadragon.Point | null = null;

  private _endPoint: OpenSeadragon.Point | null = null;

  private _markerLength: number;

  private _tolerance: number = 5;

  constructor(options: ShapeCreateOptions) {
    super(options);

    // 创建主线
    this._mainShape = this._shapeGroup
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0)
      .attr("stroke", this._strokeColor)
      .attr("stroke-width", this._strokeWidth * this._scale);

    // 创建起点标记
    this._startMarker = this._shapeGroup
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0)
      .attr("stroke", this._strokeColor)
      .attr("stroke-width", this._strokeWidth * this._scale);

    // 创建终点标记
    this._endMarker = this._shapeGroup
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0)
      .attr("stroke", this._strokeColor)
      .attr("stroke-width", this._strokeWidth * this._scale);

    this._markerLength = this._strokeWidth * this._scale * 4;
  }

  public setRuler(
    startPoint: OpenSeadragon.Point,
    endPoint: OpenSeadragon.Point,
  ) {
    this._startPoint = startPoint;
    this._endPoint = endPoint;
    // 设置主线
    this._mainShape
      .attr("x1", startPoint.x)
      .attr("y1", startPoint.y)
      .attr("x2", endPoint.x)
      .attr("y2", endPoint.y);

    // 计算垂直于线的方向
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // 如果长度为0，不显示标记
    if (length === 0) {
      this._startMarker.style("display", "none");
      this._endMarker.style("display", "none");
      return;
    }

    // 计算垂直方向
    const perpX = -dy / length;
    const perpY = dx / length;

    // 设置起点标记
    this._startMarker
      .style("display", null)
      .attr("x1", startPoint.x - (perpX * this._markerLength) / 2)
      .attr("y1", startPoint.y - (perpY * this._markerLength) / 2)
      .attr("x2", startPoint.x + (perpX * this._markerLength) / 2)
      .attr("y2", startPoint.y + (perpY * this._markerLength) / 2);

    // 设置终点标记
    this._endMarker
      .style("display", null)
      .attr("x1", endPoint.x - (perpX * this._markerLength) / 2)
      .attr("y1", endPoint.y - (perpY * this._markerLength) / 2)
      .attr("x2", endPoint.x + (perpX * this._markerLength) / 2)
      .attr("y2", endPoint.y + (perpY * this._markerLength) / 2);

    this._updateLabelText();
    this._updateLabelPosition();
    this.showLabel();
  }

  public initAnchor(): void {
    if (!this._startPoint || !this._endPoint) return;
    this._anchors = AnchorFactory.createAnchor(
      this.shapeType,
      this._mainShape,
      {
        svgContainer: this._svgContainer,
        parent: this._shapeGroup,
        anchorSize: this._anchorSize,
        anchorStrokeWidth: this._anchorStrokeWidth,
        scale: this._scale,
        startPoint: this._startPoint,
        endPoint: this._endPoint,
        transformHandler: this.setRuler.bind(this),
      },
    );
  }

  public containsPoint(point: OpenSeadragon.Point): boolean {
    if (!this._startPoint || !this._endPoint) return false;

    const distanceToLine = turf.pointToLineDistance(
      turf.point([point.x, point.y]),
      turf.lineString([
        [this._startPoint.x, this._startPoint.y],
        [this._endPoint.x, this._endPoint.y],
      ]),
      { units: "degrees" },
    );

    return distanceToLine <= this._tolerance * this._scale;
  }

  _updateLabelText() {
    if (!this._startPoint || !this._endPoint) return;
    const length = Math.sqrt(
      Math.pow(this._endPoint.x - this._startPoint.x, 2) +
        Math.pow(this._endPoint.y - this._startPoint.y, 2),
    );

    this.setLabelText(
      formatRulerMeasurements(
        calculateRulerMeasurements(
          length,
          this._tMapInfo.scan_scale,
          this._tMapInfo.whole_width,
          this._tMapInfo.pixel_size,
        ),
      ),
    );
  }

  _updateLabelPosition(): void {
    if (!this._startPoint || !this._endPoint) return;

    const midX = (this._endPoint.x + this._startPoint.x) / 2;
    const midY = (this._endPoint.y + this._startPoint.y) / 2;
    const labelHeight = parseFloat(
      this._labelGroup.select("rect").attr("height") || "0",
    );
    const labelWidth = parseFloat(
      this._labelGroup.select("rect").attr("width") || "0",
    );
    this._labelGroup.attr(
      "transform",
      `translate(${midX - labelWidth / 2},${midY - labelHeight / 2})`,
    );
  }

  public shapeMove(point: OpenSeadragon.Point) {
    if (!this._startPoint || !this._endPoint) return;

    // 更新起点和终点
    this._startPoint.x += point.x;
    this._startPoint.y += point.y;
    this._endPoint.x += point.x;
    this._endPoint.y += point.y;

    // 重新设置测距器
    this.setRuler(this._startPoint, this._endPoint);

    this._updateAnchors();
    this._updateLabelText();
    this._updateLabelPosition();
  }
}
