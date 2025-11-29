import * as d3 from "d3";
import * as turf from "@turf/turf";
import { ShapeBase, ShapeCreateOptions } from "./shape-base";
import OpenSeadragon from "openseadragon";
import AnchorFactory from "../anchor-controller/anchor-factory";
import {
  calculatePolygonMeasurements,
  formatPolygonMeasurements,
} from "../measurements/polygon-measurement";
import { IPolygonShape } from "../../types/types";

export default class PolygonShape extends ShapeBase {
  _mainShape: IPolygonShape;

  // 存储多边形顶点
  private _points: OpenSeadragon.Point[] = [];
  // 创建临时线条组
  private _lineGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  // 创建顶点组
  private _vertexGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  // 临时线（连接最后一个点和鼠标位置）
  private _tempLine: d3.Selection<SVGLineElement, unknown, null, undefined>;
  // 存储吸附距离
  private _snapDistance: number = 20;

  constructor(options: ShapeCreateOptions) {
    super(options);
    // 创建临时线组
    this._lineGroup = d3.select(options.svgContainer).append("g");
    // 创建跟随临时线
    this._tempLine = this._lineGroup
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0)
      .attr("stroke", this._strokeColor)
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-width", this._strokeWidth * this._scale)
      .attr("display", "none");
    // 创建顶点组
    this._vertexGroup = this._shapeGroup.append("g").attr("class", "vertices");

    // 创建多边形元素（初始不可见）
    this._mainShape = this._shapeGroup
      .append("polygon")
      .attr("points", "")
      .attr("fill", "transparent")
      .attr("stroke", this._strokeColor)
      .attr("stroke-width", this._strokeWidth * this._scale)
      .style("display", "none");
  }

  public addPoint(point: OpenSeadragon.Point): boolean {
    // 检查是否闭合多边形
    if (this._points.length > 2) {
      const distance = turf.distance(
        [this._points[0].x, this._points[0].y],
        [point.x, point.y],
        {
          units: "degrees",
        },
      );
      if (distance < 10 * this._scale) {
        this._complete();
        return true;
      }
    }
    // 添加新点
    this._points.push(point);
    // 绘制顶点
    this._vertexGroup
      .append("circle")
      .attr("cx", point.x)
      .attr("cy", point.y)
      .attr("r", 4 * this._scale)
      .attr("fill", this._strokeColor);

    // 如果有至少两个点，绘制线段
    if (this._points.length > 1) {
      const prevPoint = this._points[this._points.length - 2];
      this._lineGroup
        .append("line")
        .attr("x1", prevPoint.x)
        .attr("y1", prevPoint.y)
        .attr("x2", point.x)
        .attr("y2", point.y)
        .attr("stroke", this._strokeColor)
        .attr("stroke-width", this._strokeWidth * this._scale);
    }
    // 创建或更新临时线
    this.updateTempLine(point);
    return false;
  }

  public updateTempLine(point: OpenSeadragon.Point) {
    if (this._points.length === 0) return;
    const lastPoint = this._points[this._points.length - 1];

    this._tempLine
      .attr("x1", lastPoint.x)
      .attr("y1", lastPoint.y)
      .attr("x2", point.x)
      .attr("y2", point.y)
      .attr("display", null);

    const isCloseToFirstPoint = this._checkCloseToFirstPoint(point);
    if (isCloseToFirstPoint) {
      this._tempLine
        .attr("x1", lastPoint.x)
        .attr("y1", lastPoint.y)
        .attr("x2", this._points[0].x)
        .attr("y2", this._points[0].y);
    }
  }

  /**
   * 完成多边形绘制
   */
  private _complete(): void {
    if (this._points.length < 3) return;

    // 移出临时线组
    this._lineGroup.remove();

    // 移除跟随临时线
    this._tempLine.remove();

    // 移除顶点标记
    this._vertexGroup.remove();

    // 显示完整多边形
    this._updatePolygon();
    this._updateLabelText();
    this._updateLabelPosition();
    this.showLabel();
  }

  /**
   * 更新多边形
   */
  private _updatePolygon(): void {
    const pointsString = this._points.map((p) => `${p.x},${p.y}`).join(" ");
    this._mainShape.attr("points", pointsString);
    this._mainShape.style("display", null);
    this._updateLabelText();
    this._updateLabelPosition();
  }

  private _updateSinglePoint(point: OpenSeadragon.Point, index: number): void {
    const newPoint = this._points[index];
    newPoint.x += point.x;
    newPoint.y += point.y;
    this._points[index] = newPoint;
    this._updatePolygon();
  }

  private _checkCloseToFirstPoint(point: OpenSeadragon.Point) {
    // 检查是否接近第一个点
    if (this._points.length > 2) {
      const distance = turf.distance(
        [this._points[0].x, this._points[0].y],
        [point.x, point.y],
        {
          units: "degrees",
        },
      );
      // 如果接近第一个点，改变第一个点的样式
      this._vertexGroup
        .select("circle:first-child")
        .attr(
          "r",
          distance < this._snapDistance * this._scale
            ? 8 * this._scale
            : 5 * this._scale,
        );
      return distance < this._snapDistance * this._scale;
    }
    return false;
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
        polygonPoints: this._points,
        transformHandler: this._updateSinglePoint.bind(this),
      },
    );
  }

  public containsPoint(point: OpenSeadragon.Point): boolean {
    const polygonElement = this._mainShape.node();
    if (!polygonElement) return false;
    // 获取SVGPointList
    const pointList = polygonElement.points;
    const points: [number, number][] = [];
    for (let i = 0; i < pointList.numberOfItems; i++) {
      const point = pointList.getItem(i);
      points.push([point.x, point.y]);
    }
    return d3.polygonContains(points, [point.x, point.y]);
  }

  _updateLabelText() {
    this.setLabelText(
      formatPolygonMeasurements(
        calculatePolygonMeasurements(
          this._points,
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
    const centroid = d3.polygonCentroid(
      this._points.map((point) => [point.x, point.y]),
    );

    // 设置标签位置在矩形中心
    this._labelGroup.attr(
      "transform",
      `translate(${centroid[0]},${centroid[1]})`,
    );
  }

  public shapeMove(point: OpenSeadragon.Point) {
    // 更新所有点
    for (const item of this._points) {
      item.x += point.x;
      item.y += point.y;
    }

    // 更新多边形
    this._updatePolygon();

    this._updateAnchors();
    this._updateLabelPosition();
  }
}
