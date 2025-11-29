import { nanoid } from "nanoid";
import { ShapeBase, ShapeCreateOptions } from "./shape-base";
import OpenSeadragon from "openseadragon";
import * as turf from "@turf/turf";
import AnchorFactory from "../anchor-controller/anchor-factory";
import {
  calculateArrowMeasurements,
  formatArrowMeasurements,
} from "../measurements/arrow-measurement";
import { IArrowShape } from "../../types/types";

export default class ArrowShape extends ShapeBase {
  _mainShape: IArrowShape;

  private _markerId: string;

  private _startPoint: OpenSeadragon.Point | null = null;

  private _endPoint: OpenSeadragon.Point | null = null;

  private _markerSize: number = 6;

  private _tolerance: number = 5;

  constructor(options: ShapeCreateOptions) {
    super(options);
    // 生成唯一的marker ID
    this._markerId = `arrow-marker-${nanoid()}`;
    // 定义箭头标记
    this._shapeGroup
      .append("defs")
      .append("marker")
      .attr("id", this._markerId)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 0)
      .attr("refY", 0)
      .attr("markerWidth", this._markerSize)
      .attr("markerHeight", this._markerSize)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", this._strokeColor);

    // 创建路径元素
    this._mainShape = this._shapeGroup
      .append("path")
      .attr("d", "M0,0L0,0") // 初始为空路径
      .attr("stroke", this._strokeColor)
      .attr("stroke-width", this._strokeWidth * this._scale)
      .attr("fill", "none")
      .attr("marker-end", `url(#${this._markerId})`); // 应用箭头标记
  }

  public setArrow(
    startPoint: OpenSeadragon.Point,
    endPoint: OpenSeadragon.Point,
  ) {
    this._startPoint = startPoint;
    this._endPoint = endPoint;
    // 创建路径数据
    const pathData = `M${startPoint.x},${startPoint.y}L${endPoint.x},${endPoint.y}`;
    // 更新路径
    this._mainShape.attr("d", pathData);

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
        markerSize: this._markerSize,
        transformHandler: this.setArrow.bind(this),
      },
    );
  }

  public containsPoint(point: OpenSeadragon.Point): boolean {
    if (!this._startPoint || !this._endPoint) return false;
    // 获取路径的点
    const pathData = this._mainShape.attr("d");
    if (!pathData || pathData === "M0,0L0,0") return false;

    // 计算点到线段的距离
    const distanceToLine = turf.pointToLineDistance(
      turf.point([point.x, point.y]),
      turf.lineString([
        [this._startPoint.x, this._startPoint.y],
        [this._endPoint.x, this._endPoint.y],
      ]),
      { units: "degrees" },
    );

    // 获取当前的描边宽度
    const strokeWidth = parseFloat(this._mainShape.attr("stroke-width"));
    const tolerance = this._tolerance * this._scale;
    // 检查点是否在线段上
    if (distanceToLine <= strokeWidth / 2 + tolerance) {
      return true;
    }
    // 检查点是否在箭头头部附近
    // 获取箭头头部大小
    const arrowHeadSize = this._markerSize * this._scale; // 从marker定义中获取
    // 检查点是否在箭头头部的边界框内
    const distanceToArrowHead = Math.sqrt(
      Math.pow(point.x - this._endPoint.x, 2) +
        Math.pow(point.y - this._endPoint.y, 2),
    );

    return distanceToArrowHead <= arrowHeadSize * 1.5;
  }

  _updateLabelText() {
    if (!this._startPoint || !this._endPoint) return;
    const length = Math.sqrt(
      Math.pow(this._endPoint.x - this._startPoint.x, 2) +
        Math.pow(this._endPoint.y - this._startPoint.y, 2),
    );

    this.setLabelText(
      formatArrowMeasurements(
        calculateArrowMeasurements(
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

    // 更新路径
    this.setArrow(this._startPoint, this._endPoint);

    this._updateAnchors();
    this._updateLabelPosition();
  }
}
