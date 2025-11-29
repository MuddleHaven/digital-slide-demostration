import AnchorBase, { AnchorPosition } from "./anchor-base";
import OpenSeadragon from "openseadragon";

export default class RulerAnchor extends AnchorBase {
  public createAnchors(): void {
    this._anchors.push(
      this._anchorConfig.parent
        .append("circle")
        .attr("data-type", "anchor")
        .attr("r", this._anchorConfig.anchorSize * this._anchorConfig.scale)
        .attr("data-position", AnchorPosition.StartPoint)
        .attr("fill", "#ffffff")
        .attr("stroke", "black")
        .attr("stroke-width", this._anchorConfig.anchorStrokeWidth * this._anchorConfig.scale)
    );

    this._anchors.push(
      this._anchorConfig.parent
        .append("circle")
        .attr("data-type", "anchor")
        .attr("r", this._anchorConfig.anchorSize * this._anchorConfig.scale)
        .attr("data-position", AnchorPosition.EndPoint)
        .attr("fill", "#ffffff")
        .attr("stroke", "black")
        .attr("stroke-width", this._anchorConfig.anchorStrokeWidth * this._anchorConfig.scale)
    );
    this.updateAnchors();
  }

  public updateAnchors(): void {
    const startPoint = this._anchorConfig.startPoint;
    const endPoint = this._anchorConfig.endPoint;
    if (!startPoint || !endPoint) return;
    this._anchors.forEach((anchor) => {
      const position = anchor.attr("data-position") as AnchorPosition;
      if (position === AnchorPosition.StartPoint) {
        anchor.attr("cx", startPoint.x);
        anchor.attr("cy", startPoint.y);
      } else if (position === AnchorPosition.EndPoint) {
        anchor.attr("cx", endPoint.x);
        anchor.attr("cy", endPoint.y);
      }
    });
  }

  public anchorMove(point: OpenSeadragon.Point): void {
    const startPoint = this._anchorConfig.startPoint;
    const endPoint = this._anchorConfig.endPoint;

    if (!startPoint || !endPoint || !this._draggingAnchor) return;
    const position = this._draggingAnchor.attr(
      "data-position"
    ) as AnchorPosition;

    if (position === AnchorPosition.StartPoint) {
      this._anchorConfig.startPoint = new OpenSeadragon.Point(
        startPoint.x + point.x,
        startPoint.y + point.y
      );
    } else {
      this._anchorConfig.endPoint = new OpenSeadragon.Point(
        endPoint.x + point.x,
        endPoint.y + point.y
      );
    }

    this._anchorConfig.transformHandler?.(
      this._anchorConfig.startPoint,
      this._anchorConfig.endPoint
    );

    this.updateAnchors();
  }
}
