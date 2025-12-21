import Konva from 'konva';
import { ref, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';

/**
 * 测量工具
 * @param {Konva.Stage} stage 
 * @param {Konva.Layer} layer 
 * @param {OpenSeadragon.Viewer} viewer 
 * @param {{conversionFactor: number, unit: string}} options 
 */
export function useMeasurement(stage, layer, viewer, options = {}) {
  const isMeasuring = ref(false);
  const isDrawing = ref(false);

  let conversionFactor = typeof options.conversionFactor === 'number' && options.conversionFactor > 0
    ? options.conversionFactor
    : 4;
  let measurementUnit = options.unit || 'μm';

  const getScaleCorrection = () => {
    if (!stage.value) return 1;
    const scaleX = stage.value.scaleX();
    if (scaleX === 0) return 1;
    return 1 / scaleX;
  };

  // Temporary storage for the drawing shape
  let arrow = null;
  let label = null;
  let tag = null;
  let text = null;

  const updateMeasurementStyles = () => {
    if (!layer.value) return;
    const scale = getScaleCorrection();

    // Update Arrows
    layer.value.find('.measurement-arrow').forEach(node => {
      node.strokeWidth(2 * scale);
      node.pointerLength(5 * scale);
      node.pointerWidth(5 * scale);
    });

    layer.value.find('.measurement-tag').forEach(node => {
      node.pointerWidth(5 * scale);
      node.pointerHeight(5 * scale);
      node.shadowBlur(5 * scale);
      node.shadowOffset({ x: 5 * scale, y: 10 * scale });
    });

    layer.value.find('.measurement-text').forEach(node => {
      node.fontSize(14 * scale);
      node.padding(5 * scale);
    });

    // Update Delete Icons
    layer.value.find('.measurement-delete-group').forEach(group => {
      const arrowId = group.getAttr('arrowId');
      if (!arrowId) return;

      const arrowNode = layer.value.findOne('#' + arrowId);
      if (arrowNode) {
        // Calculate position based on arrow end point + offset
        const points = arrowNode.points();
        // points are [x1, y1, x2, y2]
        const endX = points[2];
        const endY = points[3];

        // We want visual offset of e.g. 15px
        // Offset in canvas coords = 15 * scale
        const offset = 15 * scale;

        group.position({
          x: endX + offset,
          y: endY - offset
        });
      }

      // Update icon size
      group.find('.measurement-delete-icon').forEach(node => {
        node.radius(8 * scale);
        node.strokeWidth(1 * scale);
      });

      group.find('.measurement-delete-text').forEach(node => {
        node.fontSize(12 * scale);
        // Center the X
        node.offset({
          x: node.width() / 2,
          y: node.height() / 2
        });
      });
    });

    layer.value.batchDraw();
  };

  const updateAllMeasurementLabels = () => {
    if (!layer.value) return;
    const arrows = layer.value.find('.measurement-arrow');
    arrows.forEach(arrowNode => {
      const points = arrowNode.points();
      if (!points || points.length < 4) return;
      const dx = points[2] - points[0];
      const dy = points[3] - points[1];
      const pixelDistance = Math.sqrt(dx * dx + dy * dy);
      const physicalDistance = pixelDistance * conversionFactor;
      const measurementId = arrowNode.getAttr('measurementId') || arrowNode.id();
      const labelNode = layer.value.findOne(node =>
        node.hasName('measurement-label') && node.getAttr('measurementId') === measurementId
      );
      if (!labelNode) return;
      const textNode = labelNode.findOne('.measurement-text');
      if (!textNode) return;
      const distanceText = `${Math.round(physicalDistance)}${measurementUnit}`;
      textNode.text(distanceText);
    });
    layer.value.batchDraw();
  };

  const initMeasurement = () => {
    if (viewer.value) {
      viewer.value.addHandler('animation', () => {
        updateMeasurementStyles();
      });
    }
    if (stage.value) {
      stage.value.on('mousedown.measure touchstart.measure', onMouseDown);
      stage.value.on('mousemove.measure touchmove.measure', onMouseMove);
      stage.value.on('mouseup.measure touchend.measure', onMouseUp);
    }
  };

  const activateMeasurement = () => {
    isMeasuring.value = true;
  };

  const deactivateMeasurement = () => {
    isMeasuring.value = false;
    isDrawing.value = false;
  };

  const getRelativePointerPosition = () => {
    const transform = stage.value.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.value.getPointerPosition();
    return transform.point(pos);
  };

  const onMouseDown = (e) => {
    if (e.evt.button !== 0) return;

    const target = e.target;
    if (
      target.hasName('measurement-delete-icon') ||
      target.hasName('measurement-delete-text') ||
      target.getParent()?.hasName('measurement-delete-group')
    ) {
      return;
    }

    if (!isMeasuring.value) {
      return;
    }

    isDrawing.value = true;
    const pos = getRelativePointerPosition();
    const scale = getScaleCorrection();

    const arrowId = uuidv4();
    arrow = new Konva.Arrow({
      points: [pos.x, pos.y, pos.x, pos.y],
      pointerLength: 5 * scale,
      pointerWidth: 5 * scale,
      fill: 'red',
      stroke: 'red',
      strokeWidth: 2 * scale,
      name: 'measurement-arrow',
      id: arrowId
    });
    arrow.setAttr('measurementId', arrowId);

    label = new Konva.Label({
      x: pos.x,
      y: pos.y,
      opacity: 0.75,
      name: 'measurement-label'
    });
    label.setAttr('measurementId', arrowId);

    tag = new Konva.Tag({
      fill: 'black',
      pointerDirection: 'down',
      pointerWidth: 5 * scale,
      pointerHeight: 5 * scale,
      lineJoin: 'round',
      shadowColor: 'black',
      shadowBlur: 5 * scale,
      shadowOffset: { x: 5 * scale, y: 10 * scale },
      shadowOpacity: 0.5,
      name: 'measurement-tag'
    });

    text = new Konva.Text({
      text: `0${measurementUnit}`,
      fontFamily: 'Calibri',
      fontSize: 14 * scale,
      padding: 5 * scale,
      fill: 'white',
      name: 'measurement-text'
    });

    label.add(tag);
    label.add(text);

    layer.value.add(arrow);
    layer.value.add(label);
  };

  const onMouseMove = (e) => {
    if (!isDrawing.value) return;
    const pos = getRelativePointerPosition();

    const points = arrow.points();
    points[2] = pos.x;
    points[3] = pos.y;
    arrow.points(points);

    const dx = pos.x - points[0];
    const dy = pos.y - points[1];
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    const physicalDistance = pixelDistance * conversionFactor;
    const distanceText = `${Math.round(physicalDistance)}${measurementUnit}`;
    text.text(distanceText);
    label.position({
      x: (points[0] + pos.x) / 2,
      y: (points[1] + pos.y) / 2
    });

    layer.value.batchDraw();
  };

  let deleteGroup = null;

  const onMouseUp = () => {
    isDrawing.value = false;

    if (arrow && label) {
      const scale = getScaleCorrection();
      const points = arrow.points();
      const endX = points[2];
      const endY = points[3];
      const offset = 15 * scale;

      deleteGroup = new Konva.Group({
        x: endX + offset,
        y: endY - offset,
        name: 'measurement-delete-group',
        arrowId: arrow.id()
      });
      deleteGroup.setAttr('arrowId', arrow.id());
      deleteGroup.setAttr('measurementId', arrow.id());

      const deleteCircle = new Konva.Circle({
        radius: 8 * scale,
        fill: 'white',
        stroke: 'red',
        strokeWidth: 1 * scale,
        name: 'measurement-delete-icon'
      });

      const deleteText = new Konva.Text({
        text: '✕',
        fontSize: 12 * scale,
        fill: 'red',
        fontStyle: 'bold',
        name: 'measurement-delete-text'
      });
      deleteText.offset({
        x: deleteText.width() / 2,
        y: deleteText.height() / 2
      });

      deleteGroup.add(deleteCircle);
      deleteGroup.add(deleteText);

      deleteGroup.on('click tap', (e) => {
        e.cancelBubble = true;
        e.evt.preventDefault();
        e.evt.stopPropagation();

        arrowNode.destroy();
        labelNode.destroy();
        deleteGroupNode.destroy();
        layer.value.batchDraw();
      });

      deleteGroup.on('mousedown touchstart', (e) => {
        e.cancelBubble = true;
      });

      // We need to capture the current nodes in closure for the click handler
      const arrowNode = arrow;
      const labelNode = label;
      const deleteGroupNode = deleteGroup;

      layer.value.add(deleteGroup);
      layer.value.batchDraw();
    }

    arrow = null;
    label = null;
    tag = null;
    text = null;
    deleteGroup = null;
  };

  const clearMeasurements = () => {
    if (!layer.value) return;
    layer.value.find('.measurement-arrow').forEach(node => node.destroy());
    layer.value.find('.measurement-label').forEach(node => node.destroy());
    layer.value.find('.measurement-delete-group').forEach(node => node.destroy());
    layer.value.batchDraw();
  };

  const setConversionFactor = (factor, unit) => {
    if (typeof factor === 'number' && factor > 0) {
      conversionFactor = factor;
    }
    if (unit) {
      measurementUnit = unit;
    }
    updateAllMeasurementLabels();
  };

  return {
    initMeasurement,
    activateMeasurement,
    deactivateMeasurement,
    isMeasuring,
    clearMeasurements,
    setConversionFactor
  };
}
