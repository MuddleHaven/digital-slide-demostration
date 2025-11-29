import AnchorBase, { AnchorPosition } from "./anchor-base";
import OpenSeadragon from "openseadragon";

export default class CircleAnchor extends AnchorBase {
  public createAnchors(): void {
    this._anchors.push(
      this._anchorConfig.parent
        .append("circle")
        .attr("data-type", "anchor")
        .attr("r", this._anchorConfig.anchorSize * this._anchorConfig.scale)
        .attr("data-position", AnchorPosition.MiddleRight)
        .attr("fill", "#ffffff")
        .attr("stroke", "black")
        .attr("stroke-width", this._anchorConfig.anchorStrokeWidth * this._anchorConfig.scale)
    );
    this.updateAnchors();
  }

  public updateAnchors(): void {
    const cx = this._shape.attr("cx");
    const cy = this._shape.attr("cy");
    const r = this._shape.attr("r");
    this._anchors.forEach((anchor) => {
      anchor.attr("cx", parseFloat(cx) + parseFloat(r));
      anchor.attr("cy", cy);
    });
  }

  public anchorMove(point: OpenSeadragon.Point): void {
    this._anchorConfig.transformHandler?.(point)
  }
}
