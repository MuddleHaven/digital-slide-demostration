import OpenSeadragon from "openseadragon";
import { TMapInfo } from "@/types/slice-browsing";
import { DrawMode, ILabelType } from "../types/types";
import SvgOverlay from "./svg-overlay";
import ShapeFactory from "./shapes/shape-factory";
import { IShapeController } from "../types/types";
import CircleShape from "./shapes/circle-shape";
import RectangleShape from "./shapes/rectangle-shape";
import EllipseShape from "./shapes/ellipse-shape";
import ArrowShape from "./shapes/arrow-shape";
import PolygonShape from "./shapes/polygon-shape";
import RulerShape from "./shapes/ruler-shape";
import { IAnchor } from "./anchor-controller/anchor-factory";
import { AnchorPosition, IAnchorShape } from "./anchor-controller/anchor-base";

//
enum InteractionState {
  IDLE,
  DRAWING,
  DRAGGING,
}

const CURSOR_MAP = {
  [AnchorPosition.TopLeft]: "nw-resize",
  [AnchorPosition.TopRight]: "ne-resize",
  [AnchorPosition.BottomLeft]: "sw-resize",
  [AnchorPosition.BottomRight]: "se-resize",
  [AnchorPosition.MiddleRight]: "e-resize",
  [AnchorPosition.BottomCenter]: "s-resize",
};

export default class OsdOverlayManager {
  private _viewer: OpenSeadragon.Viewer;

  private _svgOverlay: SvgOverlay;

  private _svg: SVGSVGElement;

  private _svgNode: SVGGElement;

  private _drawMode: DrawMode = DrawMode.Move;

  private _interactionState: InteractionState = InteractionState.IDLE;

  private _startPoint: OpenSeadragon.Point | null = null;

  private _mouseTracker: OpenSeadragon.MouseTracker;

  private _currentShape: IShapeController | null = null;

  private _draggingShape: IShapeController | null = null;

  private _draggingAnchor: IAnchor | null = null;

  private _draggingLastPosition: OpenSeadragon.Point | null = null;

  private _shapeList: IShapeController[] = [];

  private _tMapInfo: TMapInfo;

  private _shapeEditHandler: ((shape: IShapeController) => void) | null = null;

  private _strokeColor: string = "red";

  private _labelTag: string = "标记";

  private _labelFontSize: number = 14;

  private _drawModeChangeHandler: (mode: DrawMode) => void = () => {};

  private _clickHandler: (e: any) => void = () => {};

  constructor(viewer: OpenSeadragon.Viewer, tMapInfo: TMapInfo) {
    this._viewer = viewer;

    this._svgOverlay = new SvgOverlay(viewer);

    this._svg = this._getSvg();

    this._svgNode = this._getSvgNode();

    this._mouseTracker = this._initMouseEvents();

    this._tMapInfo = tMapInfo;

    this._initOsdEvents();

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      this._initKeyboardEvents(e);
    });
  }

  private _getSvg() {
    return this._svgOverlay.getSvg();
  }

  private _getSvgNode() {
    return this._svgOverlay.getNode();
  }

  private _initOsdEvents() {
    this._viewer.addHandler("animation", () => {
      this._shapeList.forEach((shape) => {
        shape.resize(this._toViewportPixel(1));
      });
    });
  }

  private _toViewportPosition(point: OpenSeadragon.Point): OpenSeadragon.Point {
    return this._viewer.viewport.pointFromPixel(point);
  }

  private _toViewportPixel(pixel: number) {
    return Math.abs(
      this._toViewportPosition(new OpenSeadragon.Point(0, 0)).distanceTo(
        this._toViewportPosition(new OpenSeadragon.Point(pixel, 0))
      )
    );
  }

  private _initKeyboardEvents(e: KeyboardEvent) {
    // 处理删除键
    if (e.code === "Delete" || e.code === "Backspace") {
      // 如果有选中的形状，删除它
      if (this._currentShape) {
        const index = this._shapeList.indexOf(this._currentShape);
        if (index !== -1) {
          this._currentShape.destroy();
          this._shapeList.splice(index, 1);
          this._currentShape = null;
        }
        // 阻止默认行为
        e.preventDefault();
      }
    }
    // 处理Escape键
    if (e.key === "Escape") {
      // 如果正在绘制，取消绘制
      if (this._interactionState === InteractionState.DRAWING) {
        if (this._currentShape) {
          this._currentShape.destroy();
          this._currentShape = null;
        }
        this._interactionState = InteractionState.IDLE;
        this._startPoint = null;
        this.setDrawMode(DrawMode.Move);
        // 阻止默认行为
        e.preventDefault();
      }
    }
  }

  private _initMouseEvents() {
    this._svg.setAttribute("tabindex", "0");

    return new OpenSeadragon.MouseTracker({
      element: this._svg,
      pressHandler: (e) => {
        if (
          this._drawMode === DrawMode.Move &&
          this._interactionState === InteractionState.IDLE
        ) {
          this._currentShape = this._draggingShape = this._findShapeAtPosition(
            e.position
          );
          const _draggingItem = this._findAnchorAtPosition(e.position);
          this._draggingAnchor = _draggingItem.anchor;
          if (_draggingItem.shape) {
            this._currentShape = this._draggingShape = _draggingItem.shape;
          }
          if (this._draggingAnchor || this._draggingShape) {
            this._interactionState = InteractionState.DRAGGING;
            this._draggingLastPosition = e.position;
            this._viewer.setMouseNavEnabled(false);
          }
          this._changeSelect();
        } else if (
          this._drawMode === DrawMode.Polygon &&
          this._interactionState === InteractionState.DRAWING
        ) {
          this._updateShape(this._toViewportPosition(e.position));
        } else if (this._drawMode !== DrawMode.Move) {
          this._startDraw(e);
        }
      },
      moveHandler: (e) => {
        if (
          this._drawMode === DrawMode.Move &&
          this._interactionState === InteractionState.DRAGGING &&
          this._draggingLastPosition
        ) {
          const lastPoint = this._toViewportPosition(
            this._draggingLastPosition
          );
          const currentPoint = this._toViewportPosition(e.position);
          // 优先处理锚点
          if (this._draggingAnchor) {
            this._draggingAnchor.anchorMove(currentPoint.minus(lastPoint));
          } else if (this._draggingShape) {
            this._draggingShape.shapeMove(currentPoint.minus(lastPoint));
          }
          this._draggingLastPosition = e.position;
        } else if (
          this._drawMode === DrawMode.Polygon &&
          this._interactionState === InteractionState.DRAWING
        ) {
          // 多边形特殊处理
          (this._currentShape as PolygonShape).updateTempLine(
            this._toViewportPosition(e.position)
          );
        } else if (
          this._drawMode !== DrawMode.Move &&
          this._interactionState === InteractionState.DRAWING
        ) {
          this._draw(e.position);
        }
        this._findShapeAtPosition(e.position);
        this._findAnchorAtPosition(e.position);
      },
      releaseHandler: (e) => {
        if (
          this._drawMode === DrawMode.Move &&
          this._interactionState === InteractionState.DRAGGING
        ) {
          this._interactionState = InteractionState.IDLE;
          this._viewer.setMouseNavEnabled(true);
          this._draggingShape = null;
          this._draggingAnchor = null;
          this._draggingLastPosition = null;
        } else if (
          this._drawMode === DrawMode.Polygon &&
          this._interactionState === InteractionState.DRAWING
        ) {
          return;
        } else if (
          this._drawMode !== DrawMode.Move &&
          this._interactionState === InteractionState.DRAWING
        ) {
          this._endDraw(e.position);
        }
      },
      dblClickHandler: (e) => {
        const shape = this._findLabelAtPosition(e.position);
        if (shape) {
          this._shapeEditHandler?.(shape);
        }
      },
      clickHandler: (e) => {
        this._clickHandler(e);
      },
    });
  }

  private _findShapeAtPosition(
    position: OpenSeadragon.Point
  ): IShapeController | null {
    const currentShape = this._shapeList.find((shape) =>
      shape.containsPoint(this._toViewportPosition(position))
    );
    if (currentShape) {
      this._svg.style.cursor =
        this._drawMode === DrawMode.Move ? "move" : "auto";
    }
    return currentShape || null;
  }

  private _findAnchorAtPosition(position: OpenSeadragon.Point): {
    anchor: IAnchor | null;
    shape: IShapeController | null;
  } {
    let anchor: IAnchor | null = null;
    let shape: IShapeController | null = null;
    let current: IAnchorShape | null = null;
    this._shapeList.forEach((currentShape) => {
      const targetAnchor = currentShape.anchorContainsPoint(
        this._toViewportPosition(position)
      );
      if (targetAnchor) {
        anchor = targetAnchor.anchor;
        current = targetAnchor.current;
        shape = currentShape;
      }
    });
    if (current) {
      const cursor =
        CURSOR_MAP[
          (current as IAnchorShape).attr(
            "data-position"
          ) as keyof typeof CURSOR_MAP
        ];
      if (cursor) {
        this._svg.style.cursor =
          this._drawMode === DrawMode.Move ? cursor : "auto";
      } else {
        this._svg.style.cursor =
          this._drawMode === DrawMode.Move ? "pointer" : "auto";
      }
    }
    return {
      anchor: anchor,
      shape: shape,
    };
  }

  private _findLabelAtPosition(position: OpenSeadragon.Point) {
    return (
      this._shapeList.find((shape) =>
        shape.labelContainsPoint(this._toViewportPosition(position))
      ) || null
    );
  }

  public setDrawMode(mode: DrawMode) {
    this._drawMode = mode;
    this._svg.style.cursor = mode === DrawMode.Move ? "auto" : "crosshair";
    this._viewer.setMouseNavEnabled(mode === DrawMode.Move);
    this._drawModeChangeHandler?.(mode);
  }

  private _updateShape(point: OpenSeadragon.Point) {
    if (!this._startPoint) return;
    switch (this._drawMode) {
      case DrawMode.Circle:
        (this._currentShape as CircleShape).setCircle(this._startPoint, point);
        break;
      case DrawMode.Rectangle:
        (this._currentShape as RectangleShape).setRect(this._startPoint, point);
        break;
      case DrawMode.Ellipse:
        (this._currentShape as EllipseShape).setEllipse(
          this._startPoint,
          point
        );
        break;
      case DrawMode.Arrow:
        (this._currentShape as ArrowShape).setArrow(this._startPoint, point);
        break;
      case DrawMode.Polygon: {
        const isCompleted = (this._currentShape as PolygonShape).addPoint(
          point
        );
        if (isCompleted) {
          this._endDraw(point);
        }
        break;
      }
      case DrawMode.Ruler:
        (this._currentShape as RulerShape).setRuler(this._startPoint, point);
        break;
      // 其他形状类型将在后续实现
    }
  }

  private _startDraw(e: OpenSeadragon.PressMouseTrackerEvent) {
    if (
      this._drawMode === DrawMode.Move ||
      this._interactionState === InteractionState.DRAWING
    )
      return;
    this._interactionState = InteractionState.DRAWING;
    this._currentShape = ShapeFactory.createShape(this._drawMode, {
      shapeType: this._drawMode,
      svgContainer: this._svgNode,
      strokeWidth: 2,
      strokeColor: this._strokeColor,
      scale: this._toViewportPixel(1),
      tMapInfo: this._tMapInfo,
      labelTag: this._labelTag,
      labelFontSize: this._labelFontSize,
    });
    this._changeSelect();
    const point = this._toViewportPosition(e.position);
    this._startPoint = point;
    if (this._currentShape) {
      this._updateShape(point);
    }
  }

  private _draw(point: OpenSeadragon.Point) {
    if (
      this._drawMode === DrawMode.Move ||
      this._interactionState !== InteractionState.DRAWING ||
      !this._startPoint
    )
      return;
    // 根据形状类型更新形状
    this._updateShape(this._toViewportPosition(point));
  }

  private _endDraw(point: OpenSeadragon.Point) {
    if (
      this._drawMode === DrawMode.Move ||
      this._interactionState !== InteractionState.DRAWING
    )
      return;
    // 更新最终形状
    if (this._drawMode !== DrawMode.Polygon) {
      this._draw(point);
    }
    this._currentShape?.initAnchor();
    this._interactionState = InteractionState.IDLE;
    if (this._currentShape) this._shapeList.push(this._currentShape);
    this._currentShape = null;
    this._startPoint = null;
    this.setDrawMode(DrawMode.Move);
  }

  public registerShapeEditHandler(fun: (shape: IShapeController) => void) {
    this._shapeEditHandler = fun;
  }

  public setStrokeColor(color: string) {
    this._strokeColor = color;
  }

  private _changeSelect() {
    this._shapeList.forEach((shape) => {
      if (shape === this._currentShape) {
        shape.handleSelectShape();
      } else {
        shape.handleUnselectShape();
      }
    });
  }

  public setAlwaysShowLabels(isShow: boolean) {
    this._shapeList.forEach((shape) => {
      shape.setAlwaysShowLabel(isShow, this._currentShape);
    });
  }

  public setLabelTag(tag: string) {
    this._labelTag = tag;
  }

  public setShowShape(isShow: boolean) {
    this._shapeList.forEach((shape) => {
      shape.setShowShape(isShow);
    });
  }

  public setShowLabelThins(isShow: boolean, labelType: ILabelType) {
    this._shapeList.forEach((shape) => {
      shape.setShowLabelThins(isShow, labelType);
    });
  }

  public setLabelFontSize(size: number) {
    this._labelFontSize = size;
    this._shapeList.forEach((shape) => {
      shape.setLabelFontSize(size);
    });
  }

  public onDrawModeChange(fun: (mode: DrawMode) => void) {
    this._drawModeChangeHandler = fun;
  }

  public addClickHandler(fun: (e: any) => void) {
    this._clickHandler = fun;
  }

  public destroy() {
    this._shapeList.forEach((shape) => {
      shape.destroy();
    });
    this._shapeList = [];
    this._mouseTracker.destroy();
    this._svgOverlay.destroy();
  }
}
