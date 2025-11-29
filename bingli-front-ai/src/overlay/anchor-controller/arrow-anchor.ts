import AnchorBase, { AnchorPosition } from "./anchor-base";
import OpenSeadragon from "openseadragon";

export default class ArrowAnchor extends AnchorBase {
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
    const markerSize = this._anchorConfig.markerSize;
    if (!startPoint || !endPoint || !markerSize) return;
    this._anchors.forEach((anchor) => {
      const position = anchor.attr("data-position") as AnchorPosition;
      if (position === AnchorPosition.StartPoint) {
        anchor.attr("cx", startPoint.x);
        anchor.attr("cy", startPoint.y);
      } else if (position === AnchorPosition.EndPoint) {
        // 计算向量方向
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;

        // 归一化向量
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitDx = dx / length;
        const unitDy = dy / length;

        // 计算箭头尖端位置
        // markerSize是箭头大小，scale是缩放因子
        const arrowHeadLength = markerSize * this._anchorConfig.scale;

        // 箭头尖端坐标
        const tipX = endPoint.x + unitDx * arrowHeadLength;
        const tipY = endPoint.y + unitDy * arrowHeadLength;

        anchor.attr("cx", tipX);
        anchor.attr("cy", tipY);
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
