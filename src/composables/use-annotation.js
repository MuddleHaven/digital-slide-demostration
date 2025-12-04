import Konva from 'konva';
import { ref, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import * as sliceAPI from '@/service/slice.js';

export function useAnnotation(stage, layer, viewer) {
  const isAnnotating = ref(false);
  const currentTool = ref('rectangle'); // Default to rectangle
  const selectedShapeId = ref(null);

  let transformer = null;
  let currentShape = null;
  let isPolyDrawing = false;

  // Helper to get scale correction
  // Since we are drawing on a layer that is scaled by viewport zoom,
  // we need to adjust stroke width and handle sizes inversely to keep them visible
  const getScaleCorrection = () => {
    if (!stage.value) return 1;
    const scaleX = stage.value.scaleX();
    if (scaleX === 0) return 1;
    return 1 / scaleX;
  };

  const updateShapeStyles = (shape) => {
    const scale = getScaleCorrection();
    // Ensure visible stroke width regardless of zoom
    // Base width 2px, scaled up when zoomed out
    shape.strokeWidth(2 * scale);

    // If shape has radius (e.g. circle handles in transformer), we might need to adjust them too
    // But for now let's stick to stroke width
  };

  const updateTransformerConfig = () => {
    if (transformer) {
      const scale = getScaleCorrection();
      // Adjust anchor size so they remain clickable/visible but not huge
      // Reduced from 10 to 5 based on user feedback
      transformer.anchorSize(5);
      transformer.borderStrokeWidth(1); // Keep 1px screen width
      transformer.anchorStrokeWidth(1);
      // Also scale padding so the box doesn't look too tight or too loose
      transformer.padding(5);
    }
  };

  const initAnnotation = () => {
    if (!layer.value) return;

    transformer = new Konva.Transformer({
      ignoreStroke: true,
      // Use a function or update manually on zoom
    });

    // Hide delete button during transform
    transformer.on('transformstart', () => {
      removeDeleteGroup();
    });

    // Show delete button after transform
    transformer.on('transformend', () => {
      const node = transformer.nodes()[0];
      if (node) {
        createDeleteGroup(node);
      }
    });

    layer.value.add(transformer);

    // Listen to zoom events to update styles
    if (viewer.value) {
      viewer.value.addHandler('animation', () => {
        updateTransformerConfig();

        const scale = getScaleCorrection();
        layer.value.find('.annotation').forEach(node => {
          node.strokeWidth(2 * scale);
          if (node.className === 'Tag') {
            // Handle tags/labels scaling if any
          }
        });

        // Update Delete Group Position/Scale if selected
        if (transformer && transformer.nodes().length > 0) {
          updateDeleteGroupPosition(transformer.nodes()[0]);
        }

        layer.value.batchDraw();
      });
    }
  };

  const activateAnnotation = () => {
    isAnnotating.value = true;
    if (stage.value) {
      stage.value.on('mousedown.anno touchstart.anno', onMouseDown);
      stage.value.on('mousemove.anno touchmove.anno', onMouseMove);
      stage.value.on('mouseup.anno touchend.anno', onMouseUp);
      stage.value.on('click.anno tap.anno', onClick);
    }
  };

  const deactivateAnnotation = () => {
    isAnnotating.value = false;
    if (stage.value) {
      stage.value.off('.anno');
    }
    selectShape(null);
  };

  const setTool = (tool) => {
    currentTool.value = tool;
    currentShape = null;
    isPolyDrawing = false;
    selectShape(null);
  };

  const getRelativePointerPosition = () => {
    const transform = stage.value.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.value.getPointerPosition();
    return transform.point(pos);
  };

  let deleteGroup = null;

  const updateDeleteGroupPosition = (shape) => {
    if (!deleteGroup || !shape) return;
    const scale = getScaleCorrection();
    const clientRect = shape.getClientRect({ skipTransform: false });

    // Place at top-right corner
    // We need to account for the layer scale? No, deleteGroup is inside layer.
    // So we use coordinate system of the layer.
    // But getClientRect returns absolute position relative to stage (if skipTransform false)
    // Or relative to something else?
    // Let's use shape position + width?
    // Complex shapes (rotated) make this hard.
    // Using transformer position might be easier if possible.

    // Simple approach: Top right of bounding box
    const bbox = shape.getClientRect(); // Relative to stage? No, usually absolute unless specified.
    // Wait, getClientRect() is relative to the stage top-left.
    // We need local coordinates for the layer.

    // Easier: shape.x() + width? Only works for unrotated rects.

    // Let's try using the transformer's back logic or just offset from the shape center/position.
    // Actually, transformer puts handles around the shape.
    // We can find the top-right point of the shape in the layer's coordinate space.

    // Let's stick to a simple offset from the shape's reported position for now, 
    // or use `getClientRect` and transform it back to layer coords.

    const transform = layer.value.getAbsoluteTransform().copy();
    transform.invert();
    const absPos = { x: bbox.x + bbox.width, y: bbox.y };
    const relPos = transform.point(absPos);

    const offset = 15 * scale;
    deleteGroup.position({
      x: relPos.x + offset,
      y: relPos.y - offset
    });

    // Update scale of delete button itself
    deleteGroup.find('.delete-icon').forEach(node => {
      node.radius(8 * scale);
      node.strokeWidth(1 * scale);
    });
    deleteGroup.find('.delete-text').forEach(node => {
      node.fontSize(12 * scale);
      node.offset({
        x: node.width() / 2,
        y: node.height() / 2
      });
    });
  };

  const removeDeleteGroup = () => {
    if (deleteGroup) {
      deleteGroup.destroy();
      deleteGroup = null;
    }
  };

  const createDeleteGroup = (shape) => {
    removeDeleteGroup();
    const scale = getScaleCorrection();

    deleteGroup = new Konva.Group({
      name: 'annotation-delete-group'
    });

    const deleteCircle = new Konva.Circle({
      radius: 8 * scale,
      fill: 'white',
      stroke: 'red',
      strokeWidth: 1 * scale,
      name: 'delete-icon'
    });

    const deleteText = new Konva.Text({
      text: '✕',
      fontSize: 12 * scale,
      fill: 'red',
      fontStyle: 'bold',
      name: 'delete-text'
    });
    deleteText.offset({
      x: deleteText.width() / 2,
      y: deleteText.height() / 2
    });

    deleteGroup.add(deleteCircle);
    deleteGroup.add(deleteText);

    deleteGroup.on('click tap', (e) => {
      e.cancelBubble = true;
      e.evt.stopPropagation(); // Stop native propagation
      e.evt.preventDefault(); // Stop native default
      deleteSelected();
    });

    // Prevent mousedown from propagating to stage (which starts drawing)
    deleteGroup.on('mousedown touchstart', (e) => {
      e.cancelBubble = true;
    });

    layer.value.add(deleteGroup);
    updateDeleteGroupPosition(shape);
  };

  const bindShapeEvents = (shape) => {
    shape.on('dragstart', () => {
      removeDeleteGroup();
    });

    shape.on('dragend', () => {
      if (selectedShapeId.value === shape.id()) {
        createDeleteGroup(shape);
      }
    });
  };

  const selectShape = (shape) => {
    if (!shape) {
      selectedShapeId.value = null;
      transformer.nodes([]);
      removeDeleteGroup(); // Hide delete button
      layer.value.batchDraw();
      return;
    }
    selectedShapeId.value = shape.id();
    transformer.nodes([shape]);
    updateTransformerConfig(); // Ensure visible handles
    createDeleteGroup(shape); // Show delete button
    layer.value.batchDraw();
  };

  const onMouseDown = (e) => {
    if (e.evt.button !== 0) return;
    if (e.target.getParent()?.className === 'Transformer') return;

    // Check if we clicked on delete button
    const target = e.target;
    if (
      target.hasName('delete-icon') ||
      target.hasName('delete-text') ||
      target.getParent()?.hasName('annotation-delete-group')
    ) {
      return;
    }

    // Check if we clicked on an existing shape to select it
    // But only if we are NOT currently drawing a polygon (multi-click)
    // And we want to allow selection even if a tool is active?
    // User said: "Just turn on annotation function, default can select and delete"
    // So if I click on a shape, I select it. If I drag on empty space, I draw.

    const clickedShape = e.target.findAncestor('.annotation') || e.target;
    if (clickedShape && clickedShape.hasName('annotation')) {
      selectShape(clickedShape);
      // Don't start drawing if we clicked a shape (drag to move)
      return;
    } else {
      // Deselect if clicked on empty space
      selectShape(null);
    }

    const pos = getRelativePointerPosition();
    const id = uuidv4();
    const scale = getScaleCorrection();
    let shape;

    if (currentTool.value === 'polygon') {
      // Polygon handled in onClick/onMouseMove
      return;
    }

    switch (currentTool.value) {
      case 'rectangle':
        shape = new Konva.Rect({
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          stroke: 'blue',
          strokeWidth: 2 * scale,
          id: id,
          draggable: true,
          name: 'annotation'
        });
        break;
      case 'ellipse':
        shape = new Konva.Ellipse({
          x: pos.x,
          y: pos.y,
          radiusX: 0,
          radiusY: 0,
          stroke: 'blue',
          strokeWidth: 2 * scale,
          id: id,
          draggable: true,
          name: 'annotation'
        });
        break;
      case 'triangle':
        shape = new Konva.RegularPolygon({
          x: pos.x,
          y: pos.y,
          sides: 3,
          radius: 0,
          stroke: 'blue',
          strokeWidth: 2 * scale,
          id: id,
          draggable: true,
          name: 'annotation'
        });
        break;
    }

    if (shape) {
      currentShape = shape;
      bindShapeEvents(shape);
      layer.value.add(shape);

      // Add click listener for selection (though mousedown handles it too)
      shape.on('mousedown', (evt) => {
        // Already handled by top level, but ensure bubble
      });
    }
  };

  const onMouseMove = (e) => {
    if (!currentShape) return;
    const pos = getRelativePointerPosition();

    if (currentTool.value === 'rectangle') {
      const w = pos.x - currentShape.x();
      const h = pos.y - currentShape.y();
      currentShape.width(w);
      currentShape.height(h);
    } else if (currentTool.value === 'ellipse') {
      const rx = Math.abs(pos.x - currentShape.x());
      const ry = Math.abs(pos.y - currentShape.y());
      currentShape.radiusX(rx);
      currentShape.radiusY(ry);
    } else if (currentTool.value === 'triangle') {
      const dx = pos.x - currentShape.x();
      const dy = pos.y - currentShape.y();
      const r = Math.sqrt(dx * dx + dy * dy);
      currentShape.radius(r);
    } else if (currentTool.value === 'polygon' && isPolyDrawing) {
      const points = currentShape.points();
      const len = points.length;
      points[len - 2] = pos.x;
      points[len - 1] = pos.y;
      currentShape.points(points);
    }
    layer.value.batchDraw();
  };

  const onMouseUp = () => {
    if (currentTool.value === 'polygon') return;

    if (currentShape) {
      // Finished drawing shape
      // Save to backend?
      // For now just keep it in memory
      selectShape(currentShape); // Auto select after draw
      currentShape = null;
    }
  };

  const onClick = (e) => {
    if (currentTool.value === 'polygon') {
      const pos = getRelativePointerPosition();
      const scale = getScaleCorrection();

      if (!isPolyDrawing) {
        isPolyDrawing = true;
        const id = uuidv4();
        currentShape = new Konva.Line({
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: 'blue',
          strokeWidth: 2 * scale,
          closed: true,
          id: id,
          draggable: true,
          name: 'annotation'
        });
        bindShapeEvents(currentShape);
        layer.value.add(currentShape);
      } else {
        const points = currentShape.points();
        points.push(pos.x, pos.y);
        currentShape.points(points);
      }
    }
  };

  // Use a separate dblclick listener for polygon finish
  // Konva supports 'dblclick'
  const initDoubleClickListener = () => {
    stage.value.on('dblclick', () => {
      if (isPolyDrawing && currentShape) {
        isPolyDrawing = false;
        selectShape(currentShape);
        currentShape = null;
      }
    });
  };

  const deleteSelected = async () => {
    const selectedNode = transformer.nodes()[0];
    if (!selectedNode) return;

    const dbId = selectedNode.getAttr('dbId');
    if (dbId) {
      try {
        // Call API to delete
        await sliceAPI.Annodelete({ id: dbId });
        // If success, remove from canvas
      } catch (e) {
        console.error("Delete failed", e);
        // Should we alert user? For now just log.
      }
    }

    selectedNode.destroy();
    transformer.nodes([]);
    removeDeleteGroup(); // Also remove the button
    selectedShapeId.value = null;
    layer.value.batchDraw();
  };

  const loadAnnotations = async (sliceId) => {
    try {
      const res = await sliceAPI.getAnnos({ sliceId });
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach(anno => {
          const scale = getScaleCorrection();
          let shape;
          const jsonData = anno.jsonData; // Assuming jsonData is already parsed object based on log

          // If jsonData is string, parse it
          let data = jsonData;
          if (typeof jsonData === 'string') {
            try { data = JSON.parse(jsonData); } catch (e) { }
          }

          const commonAttrs = {
            id: uuidv4(), // Local Konva ID
            dbId: anno.id, // Backend ID
            name: 'annotation',
            draggable: true,
            stroke: 'blue',
            strokeWidth: 2 * scale // Initial scale
          };

          if (anno.type === 'RECTANGLE') {
            shape = new Konva.Rect({
              ...commonAttrs,
              x: data.x,
              y: data.y,
              width: data.w,
              height: data.h
            });
          } else if (anno.type === 'ELLIPSE') {
            shape = new Konva.Ellipse({
              ...commonAttrs,
              x: data.cx,
              y: data.cy,
              radiusX: data.rx,
              radiusY: data.ry
            });
          } else if (anno.type === 'POLYGON') {
            const flatPoints = data.points.flat();
            shape = new Konva.Line({
              ...commonAttrs,
              points: flatPoints,
              closed: true
            });
          }

          if (shape) {
            bindShapeEvents(shape);
            layer.value.add(shape);
          }
        });
        layer.value.batchDraw();
      }
    } catch (e) {
      console.error("Failed to load annotations", e);
    }
  };

  return {
    initAnnotation,
    activateAnnotation,
    deactivateAnnotation,
    setTool,
    currentTool,
    deleteSelected,
    initDoubleClickListener,
    loadAnnotations
  };
}
