import AnchorBase, { AnchorPosition } from "./anchor-base";
import OpenSeadragon from "openseadragon";

export default class EllipseAnchor extends AnchorBase {
  public createAnchors(): void {
    // 创建右侧锚点
    this._anchors.push(
      this._anchorConfig.parent
        .append("circle")
        .attr("data-type", "anchor")
        .attr("r", this._anchorConfig.anchorSize * this._anchorConfig.scale)
        .attr("data-position", AnchorPosition.MiddleRight)
        .attr("fill", "#ffffff")
        .attr("stroke", "black")
        .attr(
          "stroke-width",
          this._anchorConfig.anchorStrokeWidth * this._anchorConfig.scale,
        ),
    );

    // 创建底部锚点
    this._anchors.push(
      this._anchorConfig.parent
        .append("circle")
        .attr("data-type", "anchor")
        .attr("r", this._anchorConfig.anchorSize * this._anchorConfig.scale)
        .attr("data-position", AnchorPosition.BottomCenter)
        .attr("fill", "#ffffff")
        .attr("stroke", "black")
        .attr(
          "stroke-width",
          this._anchorConfig.anchorStrokeWidth * this._anchorConfig.scale,
        ),
    );
    this.updateAnchors();
  }

  public updateAnchors(): void {
    const cx = this._shape.attr("cx");
    const cy = this._shape.attr("cy");
    const rx = this._shape.attr("rx");
    const ry = this._shape.attr("ry");

    this._anchors.forEach((anchor) => {
      const position = anchor.attr("data-position") as AnchorPosition;
      if (position === AnchorPosition.MiddleRight) {
        anchor.attr("cx", parseFloat(cx) + parseFloat(rx));
        anchor.attr("cy", cy);
      } else if (position === AnchorPosition.BottomCenter) {
        anchor.attr("cx", cx);
        anchor.attr("cy", parseFloat(cy) + parseFloat(ry));
      }
    });
  }

  public anchorMove(point: OpenSeadragon.Point): void {
    this._anchorConfig.transformHandler?.(
      point,
      this._draggingAnchor?.attr("data-position") as AnchorPosition,
    );
    this.updateAnchors();
  }
}
