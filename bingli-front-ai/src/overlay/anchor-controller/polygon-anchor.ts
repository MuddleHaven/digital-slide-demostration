import AnchorBase, { AnchorPosition } from "./anchor-base";
import OpenSeadragon from "openseadragon";

export default class PolygonAnchor extends AnchorBase {
  public createAnchors(): void {
    // 创建左上锚点

    this._anchorConfig.polygonPoints?.forEach((point, index) => {
      this._anchors.push(
        this._anchorConfig.parent
          .append("circle")
          .attr("data-type", "anchor")
          .attr("data-point-index", index)
          .attr("r", this._anchorConfig.anchorSize * this._anchorConfig.scale)
          .attr("fill", "#ffffff")
          .attr("stroke", "black")
          .attr(
            "stroke-width",
            this._anchorConfig.anchorStrokeWidth * this._anchorConfig.scale,
          ),
      );
    });

    this.updateAnchors();
  }

  public updateAnchors(): void {
    this._anchorConfig.polygonPoints?.forEach((point, index) => {
      const anchor = this._anchors[index];
      if (anchor) {
        anchor.attr("cx", point.x);
        anchor.attr("cy", point.y);
      }
    });
  }

  /**
   * 锚点移动
   * @param point 移动的相对距离， 相对于锚点
   */
  public anchorMove(point: OpenSeadragon.Point): void {
    // 检查 point 是否为有效值
    if (!point) {
      console.warn("Invalid point provided to anchorMove");
      return;
    }
    const pointIndex = parseInt(
      this._draggingAnchor?.attr("data-point-index") as string,
    );
    if (
      (!pointIndex && pointIndex !== 0) ||
      !this._anchorConfig.polygonPoints
    ) {
      return;
    }

    this._anchorConfig.transformHandler?.(point, pointIndex);
    this.updateAnchors();
  }
}
