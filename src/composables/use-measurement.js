import Konva from 'konva';
import { ref, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export function useMeasurement(stage, layer, viewer) {
  const isMeasuring = ref(false);
  const isDrawing = ref(false);

  // Helper to get scale correction
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

    // Update Labels/Tags/Text
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

  const initMeasurement = () => {
    if (viewer.value) {
      viewer.value.addHandler('animation', () => {
        updateMeasurementStyles();
      });
    }
  };

  const activateMeasurement = () => {
    isMeasuring.value = true;
    if (stage.value) {
      stage.value.on('mousedown.measure touchstart.measure', onMouseDown);
      stage.value.on('mousemove.measure touchmove.measure', onMouseMove);
      stage.value.on('mouseup.measure touchend.measure', onMouseUp);
    }
  };

  const deactivateMeasurement = () => {
    isMeasuring.value = false;
    isDrawing.value = false;
    if (stage.value) {
      stage.value.off('.measure');
    }
  };

  const getRelativePointerPosition = () => {
    const transform = stage.value.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.value.getPointerPosition();
    return transform.point(pos);
  };

  const onMouseDown = (e) => {
    // Only left click
    if (e.evt.button !== 0) return;

    // Check if we clicked on a delete button or something that shouldn't trigger draw
    const target = e.target;
    if (
      target.hasName('measurement-delete-icon') ||
      target.hasName('measurement-delete-text') ||
      target.getParent()?.hasName('measurement-delete-group')
    ) {
      return;
    }

    isDrawing.value = true;
    const pos = getRelativePointerPosition();
    const scale = getScaleCorrection();

    // Create Arrow
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

    // Create Label (Distance)
    label = new Konva.Label({
      x: pos.x,
      y: pos.y,
      opacity: 0.75
    });

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
      text: '0px',
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

    // Update arrow points
    const points = arrow.points();
    points[2] = pos.x;
    points[3] = pos.y;
    arrow.points(points);

    // Calculate distance
    const dx = pos.x - points[0];
    const dy = pos.y - points[1];
    const dist = Math.sqrt(dx * dx + dy * dy).toFixed(2);

    // Update Label
    text.text(`${dist}px`);
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

      // Create a delete button group attached to the measurement
      deleteGroup = new Konva.Group({
        x: endX + offset,
        y: endY - offset,
        name: 'measurement-delete-group',
        arrowId: arrow.id() // Link to arrow
      });
      // Custom attribute to store arrow ID
      deleteGroup.setAttr('arrowId', arrow.id());

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
      // Center text
      deleteText.offset({
        x: deleteText.width() / 2,
        y: deleteText.height() / 2
      });

      deleteGroup.add(deleteCircle);
      deleteGroup.add(deleteText);

      // Make it clickable
      deleteGroup.on('click tap', (e) => {
        // prevent default
        e.cancelBubble = true; // Stop propagation in Konva
        e.evt.preventDefault(); // Stop native event
        e.evt.stopPropagation(); // Stop native propagation

        // Remove all related shapes
        arrowNode.destroy();
        labelNode.destroy();
        deleteGroupNode.destroy();
        layer.value.batchDraw();
      });

      // Add mousedown to stop propagation so drawing doesn't start
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

    // Reset references for next drawing
    arrow = null;
    label = null;
    tag = null;
    text = null;
    deleteGroup = null;
  };

  return {
    initMeasurement,
    activateMeasurement,
    deactivateMeasurement,
    isMeasuring
  };
}
