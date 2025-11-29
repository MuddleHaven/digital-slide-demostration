import OpenSeadragon from "openseadragon";
import * as d3 from "d3";
import { DrawMode, ILabelType, IShape, IShapeController } from "../../types/types";
import { IAnchor } from "../anchor-controller/anchor-factory";
import { TMapInfo } from "@/types/slice-browsing";
/**
 * 形状基础接口
 * 定义所有形状的通用方法和属性
 */
export abstract class ShapeBase {
  protected _scale: number;

  protected _strokeWidth: number;

  protected _strokeColor: string;

  protected _alwaysShowLabel: boolean = false;

  protected _svgContainer!: SVGGElement;

  protected _shapeGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

  protected _labelGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

  protected _labelBackground: d3.Selection<
    SVGRectElement,
    unknown,
    null,
    undefined
  >;

  protected _labelText: d3.Selection<SVGTextElement, unknown, null, undefined>;

  protected _isShowLabel: boolean = true;

  protected _isShowMeasurement: boolean = true;

  protected _isShowDescription: boolean = true;

  protected _labelDescription: string = "";

  protected _isShowTag: boolean = false;

  protected _labelTag: string = "";

  protected _labelFontSize: number;

  protected _mainShape!: IShape;

  protected _anchors: IAnchor | null = null;

  protected _anchorSize: number;

  protected _anchorStrokeWidth: number;

  public shapeType: DrawMode;

  protected _tMapInfo: TMapInfo;

  constructor(options: ShapeCreateOptions) {
    this.shapeType = options.shapeType;
    this._scale = options.scale || 1;
    this._anchorSize = options.anchorSize || 4;
    this._shapeGroup = d3.select(options.svgContainer).append("g");
    this._labelGroup = this._shapeGroup.append("g");
    this._tMapInfo = options.tMapInfo;
    this._strokeWidth = options.strokeWidth;
    this._strokeColor = options.strokeColor;
    this._labelTag = options.labelTag;
    this._labelFontSize = options.labelFontSize;

    // 创建标签背景
    this._labelBackground = this._labelGroup
      .append("rect")
      .attr("fill", "rgb(255,255,204)");

    // 创建标签文本
    this._labelText = this._labelGroup
      .append("text")
      .attr("font-size", this._labelFontSize * this._scale)
      .attr("fill", "black");

    // 初始设置标签不可见
    this._labelGroup.style("display", "none");

    this._svgContainer = options.svgContainer;
    this._anchorStrokeWidth = options.anchorStrokeWidth || 2;
  }

  public abstract containsPoint(point: OpenSeadragon.Point): boolean;

  public abstract shapeMove(point: OpenSeadragon.Point): void;

  public abstract initAnchor(): void;

  public setAnchorSize() {
    // this._anchorList.forEach()
  }

  protected _updateAnchors() {
    this._anchors?.updateAnchors();
  }

  public anchorContainsPoint(point: OpenSeadragon.Point) {
    return this._anchors?.anchorContainsPoint(point);
  }

  /**
   * 设置标签文本
   * @param text 文本内容
   */
  public setLabelText(text?: string): void {
    if (!text) {
      text = this._getLabelText();
    }
    // 清空现有文本
    this._labelText.text("");
    // 处理换行
    const linesAndType: {
      data: string;
      type: ILabelType;
      display: "none" | null;
    }[] = text.split("\n").map((l) => ({
      data: l,
      type: ILabelType.MEASUREMENT,
      display: null,
    }));
    if (linesAndType?.[0]?.type === ILabelType.TAG) {
      linesAndType.shift();
    } else {
      linesAndType.unshift({
        data: `标签：${this._labelTag}`,
        type: ILabelType.TAG,
        display: this._isShowTag ? null : "none",
      });
    }
    linesAndType.push({
      data: `描述：${this._labelDescription}`,
      type: ILabelType.DESCRIPTION,
      display: this._isShowDescription ? null : "none",
    });
    linesAndType.forEach((line, i) => {
      this._labelText
        .append("tspan")
        .attr("data-type", line.type)
        .attr("display", line.display)
        .attr("x", 0)
        .attr("dy", i === 0 ? 0 : "1.2em")
        .text(line.data);
    });

    // 更新背景大小
    this.updateLabelStyle();
  }

  /**
   * 更新标签样式
   */
  public updateLabelStyle(): void {
    // 获取文本边界框
    const bBox = (this._labelText.node() as SVGTextElement).getBBox();
    const padding = 8 * this._scale;

    // 调整背景大小
    this._labelBackground
      .attr("x", bBox.x - padding)
      .attr("y", bBox.y - padding)
      .attr("width", bBox.width + padding * 2)
      .attr("height", bBox.height + padding * 2);
  }
  /**
   * 显示标签
   */
  public showLabel(): void {
    this._labelGroup.style("display", null);
  }

  /**
   * 隐藏标签
   */
  public hideLabel(): void {
    this._labelGroup.style("display", "none");
  }

  public handleSelectShape() {
    this._anchors?.showAnchors();
    this.showLabel();
  }

  public handleUnselectShape() {
    this._anchors?.hideAnchors();
    if (this._alwaysShowLabel) return;
    this.hideLabel();
  }

  public setAlwaysShowLabel(isShow: boolean, shape: IShapeController | null) {
    this._alwaysShowLabel = isShow;
    if (isShow) {
      this.showLabel();
    } else {
      if (!shape) {
        this.hideLabel();
        return;
      }
      if (shape._mainShape !== this._mainShape) {
        this.hideLabel();
      }
    }
  }

  public setShowShape(isShow: boolean) {
    d3.select(this._svgContainer).attr("display", isShow ? null : "none");
    this.hideLabel();
  }

  public setShowLabelThins(isShow: boolean, labelType: ILabelType) {
    if (labelType === ILabelType.TAG) {
      this._isShowTag = isShow;
    } else if (labelType === ILabelType.MEASUREMENT) {
      this._isShowMeasurement = isShow;
    } else if (labelType === ILabelType.DESCRIPTION) {
      this._isShowDescription = isShow;
    }
    this._labelText
      .selectAll(`tspan[data-type='${labelType}']`)
      .attr("display", isShow ? null : "none");
    this.updateLabelStyle();
    this._updateLabelPosition();
  }

  public setLabelFontSize(size: number) {
    this._labelFontSize = size;
    this._labelText.attr("font-size", `${size * this._scale}px`);
    this.updateLabelStyle();
    this._updateLabelPosition();
  }

  protected abstract _updateLabelText(): void;

  protected abstract _updateLabelPosition(): void;

  /**
   * 获取标签文本内容
   * @returns 标签的完整文本内容，包括所有 tspan 元素
   */
  protected _getLabelText(): string {
    const tspanTexts: string[] = [];
    const textNode = this._labelText.node();
    if (textNode) {
      this._labelText.selectAll("tspan").each(function () {
        tspanTexts.push(d3.select(this).text());
      });
    }

    // 返回组合的文本，用换行符分隔
    return tspanTexts.join("\n");
  }

  private _getLabelPosition(): { x: number; y: number } {
    // 获取当前 transform 属性
    const transformString = this._labelGroup.attr("transform");

    // 解析 translate 值
    const match = /translate\(\s*([^,)]+)[ ,]([^)]+)\)/.exec(
      transformString || ""
    );
    if (match) {
      return {
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
      };
    }
    return { x: 0, y: 0 };
  }

  public getLabelDescription() {
    return this._labelDescription;
  }

  public setLabelDescription(description: string) {
    this._labelDescription = description;
    this.setLabelText(this._getLabelText());
  }

  public labelContainsPoint(point: OpenSeadragon.Point) {
    const { x, y } = this._getLabelPosition();
    // 获取矩形的属性
    const width = parseFloat(this._labelBackground.attr("width") || "0");
    const height = parseFloat(this._labelBackground.attr("height") || "0");

    // 检查点是否在矩形边界内
    return (
      point.x >= x &&
      point.x <= x + width &&
      point.y >= y &&
      point.y <= y + height
    );
  }

  public destroy() {
    this._shapeGroup.remove();
  }

  public resize(scale: number) {
    this._scale = scale;
    this._mainShape.attr("stroke-width", this._strokeWidth * this._scale);
    this._anchors?.resize(scale);
    this._labelText.attr("font-size", 14 * this._scale);
    this.updateLabelStyle();
  }
}

/**
 * 形状创建参数接口
 */
export interface ShapeCreateOptions {
  shapeType: DrawMode;
  svgContainer: SVGGElement;
  strokeWidth: number;
  strokeColor: string;
  scale?: number;
  anchorSize?: number;
  anchorStrokeWidth?: number;
  tMapInfo: TMapInfo;
  labelTag: string;
  labelFontSize: number;
}

/**
 * 形状变换事件处理器
 */
export interface ShapeTransformHandler {}
