import AnchorBase, { AnchorPosition } from "./anchor-base";
import OpenSeadragon from "openseadragon";

export default class RectangleAnchor extends AnchorBase {
  public createAnchors(): void {
    // 创建左上锚点
    this._anchors.push(
      this._anchorConfig.parent
        .append("circle")
        .attr("data-type", "anchor")
        .attr("r", this._anchorConfig.anchorSize * this._anchorConfig.scale)
        .attr("data-position", AnchorPosition.TopLeft)
        .attr("fill", "#ffffff")
        .attr("stroke", "black")
        .attr("stroke-width", this._anchorConfig.anchorStrokeWidth * this._anchorConfig.scale)
    );

    // 创建右上锚点
    this._anchors.push(
      this._anchorConfig.parent
        .append("circle")
        .attr("data-type", "anchor")
        .attr("r", this._anchorConfig.anchorSize * this._anchorConfig.scale)
        .attr("data-position", AnchorPosition.TopRight)
        .attr("fill", "#ffffff")
        .attr("stroke", "black")
        .attr("stroke-width", this._anchorConfig.anchorStrokeWidth * this._anchorConfig.scale)
    );

    this._anchors.push(
      this._anchorConfig.parent
        .append("circle")
        .attr("data-type", "anchor")
        .attr("r", this._anchorConfig.anchorSize * this._anchorConfig.scale)
        .attr("data-position", AnchorPosition.BottomLeft)
        .attr("fill", "#ffffff")
        .attr("stroke", "black")
        .attr("stroke-width", this._anchorConfig.anchorStrokeWidth * this._anchorConfig.scale)
    );

    this._anchors.push(
      this._anchorConfig.parent
        .append("circle")
        .attr("data-type", "anchor")
        .attr("r", this._anchorConfig.anchorSize * this._anchorConfig.scale)
        .attr("data-position", AnchorPosition.BottomRight)
        .attr("fill", "#ffffff")
        .attr("stroke", "black")
        .attr("stroke-width", this._anchorConfig.anchorStrokeWidth * this._anchorConfig.scale)
    );

    this.updateAnchors();
  }

  public updateAnchors(): void {
    const x = this._shape.attr("x");
    const y = this._shape.attr("y");
    const width = this._shape.attr("width");
    const height = this._shape.attr("height");

    this._anchors.forEach((anchor) => {
      const position = anchor.attr("data-position") as AnchorPosition;
      if (position === AnchorPosition.TopLeft) {
        anchor.attr("cx", parseFloat(x));
        anchor.attr("cy", parseFloat(y));
      }
      if (position === AnchorPosition.TopRight) {
        anchor.attr("cx", parseFloat(x) + parseFloat(width));
        anchor.attr("cy", parseFloat(y));
      }
      if (position === AnchorPosition.BottomLeft) {
        anchor.attr("cx", parseFloat(x));
        anchor.attr("cy", parseFloat(y) + parseFloat(height));
      }
      if (position === AnchorPosition.BottomRight) {
        anchor.attr("cx", parseFloat(x) + parseFloat(width));
        anchor.attr("cy", parseFloat(y) + parseFloat(height));
      }
    });
  }

  /**
   * 锚点移动
   * @param point 移动的相对距离， 相对于锚点
   */
  public anchorMove(point: OpenSeadragon.Point): void {
    const position = this._draggingAnchor?.attr(
      "data-position"
    ) as AnchorPosition;
    this._anchorConfig.transformHandler?.(point, position);
  }
}
