import Konva from 'konva';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import * as sliceAPI from '@/service/slice.js';

/**
 * annotation
 * @param {Konva.Stage} stage 
 * @param {Konva.Layer} layer 
 * @param {OpenSeadragon.Viewer} viewer 
 * @param {{initialSliceId: number, isQuality: boolean}} options 
 */
export function useAnnotation(stage, layer, viewer, options = {}) {
  const isAnnotating = ref(false);
  const currentTool = ref('rectangle');
  const selectedShapeId = ref(null);
  const selectedAnnoContent = ref('');
  const currentSliceId = ref(options.initialSliceId || null);
  const isQuality = !!options.isQuality;

  const annoApi = {
    getAnnos: isQuality ? sliceAPI.getQualityAnnos : sliceAPI.getAnnos,
    insertAnno: isQuality ? sliceAPI.qualityInsertAnno : sliceAPI.insertAnno,
    updateAnno: isQuality ? sliceAPI.qualityUpdateAnno : sliceAPI.updateAnno,
    deleteAnno: isQuality ? sliceAPI.qualityDeleteAnno : sliceAPI.deleteAnno
  };

  let transformer = null;
  let currentShape = null;
  let isPolyDrawing = false;

  // Helper to get scale correction
  const getScaleCorrection = () => {
    if (!stage.value) return 1;
    const scaleX = stage.value.scaleX();
    if (scaleX === 0) return 1;
    return 1 / scaleX;
  };

  const updateShapeStyles = (shape) => {
    const scale = getScaleCorrection();
    shape.strokeWidth(2 * scale);
  };

  const updateTransformerConfig = () => {
    if (transformer) {
      const scale = getScaleCorrection();
      transformer.anchorSize(5);
      transformer.borderStrokeWidth(1);
      transformer.anchorStrokeWidth(1);
      transformer.padding(5);
    }
  };

  const initAnnotation = () => {
    if (!layer.value) return;

    transformer = new Konva.Transformer({
      ignoreStroke: true,
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

    // Simple approach: Top right of bounding box
    const bbox = shape.getClientRect();

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
      if (selectedShapeId.value === shape.id()) {
        saveSelectedAnno();
      }
    });
  };

  const selectShape = (shape) => {
    if (!shape) {
      selectedShapeId.value = null;
      selectedAnnoContent.value = '';
      transformer.nodes([]);
      removeDeleteGroup(); // Hide delete button
      layer.value.batchDraw();
      return;
    }
    selectedShapeId.value = shape.id();
    selectedAnnoContent.value = shape.getAttr('content') || '';
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
          name: 'annotation',
          annoType: 'RECTANGLE',
          content: ''
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
          name: 'annotation',
          annoType: 'ELLIPSE',
          content: ''
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
          name: 'annotation',
          annoType: 'POLYGON',
          content: ''
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
      selectShape(currentShape);
      saveSelectedAnno();
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
        saveSelectedAnno();
        currentShape = null;
      }
    });
  };

  const inferAnnoType = (shape) => {
    const explicitType = shape.getAttr('annoType');
    if (explicitType) return explicitType;
    const className = shape.className;
    if (className === 'Rect') return 'RECTANGLE';
    if (className === 'Ellipse') return 'ELLIPSE';
    if (className === 'Line' || className === 'RegularPolygon') return 'POLYGON';
    return 'RECTANGLE';
  };

  const buildAnnoPayload = (shape, content, sliceId) => {
    const type = inferAnnoType(shape);
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;
    let jsonData = {};

    if (type === 'RECTANGLE') {
      const x = shape.x();
      const y = shape.y();
      const w = shape.width();
      const h = shape.height();
      const x2 = x + w;
      const y2 = y + h;
      minX = Math.min(x, x2);
      maxX = Math.max(x, x2);
      minY = Math.min(y, y2);
      maxY = Math.max(y, y2);
      jsonData = { x, y, w, h };
    } else if (type === 'ELLIPSE') {
      const cx = shape.x();
      const cy = shape.y();
      const rx = shape.radiusX();
      const ry = shape.radiusY();
      minX = cx - rx;
      maxX = cx + rx;
      minY = cy - ry;
      maxY = cy + ry;
      jsonData = { cx, cy, rx, ry };
    } else if (type === 'POLYGON') {
      const flat = shape.points();
      const points = [];
      for (let i = 0; i < flat.length; i += 2) {
        points.push([flat[i], flat[i + 1]]);
      }
      if (points.length > 0) {
        minX = Math.min(...points.map(p => p[0]));
        maxX = Math.max(...points.map(p => p[0]));
        minY = Math.min(...points.map(p => p[1]));
        maxY = Math.max(...points.map(p => p[1]));
      }
      jsonData = { points };
    }

    return {
      sliceId,
      content,
      maxX,
      minX,
      minY,
      maxY,
      type,
      jsonData
    };
  };

  const setCurrentSliceId = (sliceId) => {
    currentSliceId.value = sliceId;
  };

  const setSelectedAnnoContent = (val) => {
    selectedAnnoContent.value = val || '';
  };

  const saveSelectedAnno = async () => {
    const selectedNode = transformer && transformer.nodes()[0];
    if (!selectedNode) return;
    if (!currentSliceId.value) return;

    const content = selectedAnnoContent.value || '';
    const payload = buildAnnoPayload(selectedNode, content, currentSliceId.value);
    const dbId = selectedNode.getAttr('dbId');

    try {
      if (dbId) {
        payload.id = dbId;
        await annoApi.updateAnno(payload);
      } else {
        const res = await annoApi.insertAnno(payload);
        if (res && res.data != null) {
          selectedNode.setAttr('dbId', res.data);
        }
      }
      selectedNode.setAttr('content', content);
    } catch (e) {
      console.error("Save annotation failed", e);
    }
  };

  const deleteSelected = async () => {
    const selectedNode = transformer.nodes()[0];
    if (!selectedNode) return;

    const dbId = selectedNode.getAttr('dbId');
    if (dbId) {
      try {
        await annoApi.deleteAnno({ id: dbId });
      } catch (e) {
        console.error("Delete failed", e);
      }
    }

    selectedNode.destroy();
    transformer.nodes([]);
    removeDeleteGroup();
    selectedShapeId.value = null;
    selectedAnnoContent.value = '';
    layer.value.batchDraw();
  };

  const loadAnnotations = async (sliceId) => {
    try {
      currentSliceId.value = sliceId;
      const res = await annoApi.getAnnos({ sliceId });
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach(anno => {
          const scale = getScaleCorrection();
          let shape;
          const jsonData = anno.jsonData;

          let data = jsonData;
          if (typeof jsonData === 'string') {
            try { data = JSON.parse(jsonData); } catch (e) { }
          }

          const commonAttrs = {
            id: uuidv4(),
            dbId: anno.id,
            name: 'annotation',
            draggable: true,
            stroke: 'blue',
            strokeWidth: 2 * scale,
            content: anno.content || '',
            annoType: anno.type
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
    loadAnnotations,
    selectedShapeId,
    selectedAnnoContent,
    setSelectedAnnoContent,
    saveSelectedAnno,
    setCurrentSliceId
  };
}
