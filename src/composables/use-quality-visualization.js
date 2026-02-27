import Konva from 'konva';
import OpenSeadragon from 'openseadragon';
import { ref, watch } from 'vue';

export function useQualityVisualization(viewer, containerId) {
  const stage = ref(null);
  const layer = ref(null);
  const isReady = ref(false);

  const initQualityKonva = () => {
    if (!viewer.value) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    stage.value = new Konva.Stage({
      container: containerId,
      width: container.clientWidth,
      height: container.clientHeight,
    });

    layer.value = new Konva.Layer();
    stage.value.add(layer.value);

    // Sync logic (simplified from use-osd-konva)
    viewer.value.addHandler('update-viewport', syncViewport);
    viewer.value.addHandler('resize', handleResize);
    viewer.value.addHandler('open', syncViewport);

    isReady.value = true;
    syncViewport();
  };

  const syncViewport = () => {
    if (!viewer.value || !stage.value) return;
    const viewport = viewer.value.viewport;

    const zoom = viewer.value.viewport.getZoom(true);
    const imageZoom = viewer.value.viewport.viewportToImageZoom(zoom);

    stage.value.scale({ x: imageZoom, y: imageZoom });

    const topLeft = viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
    stage.value.position({ x: topLeft.x, y: topLeft.y });

    const rotation = viewport.getRotation(true);
    stage.value.rotation(rotation);

    stage.value.batchDraw();
  };

  const handleResize = () => {
    if (!viewer.value || !stage.value) return;
    const container = document.getElementById(containerId);
    if (container) {
      stage.value.width(container.clientWidth);
      stage.value.height(container.clientHeight);
      syncViewport();
    }
  };

  // --- Quality Contour Drawing Logic ---

  const mapContourPoints = (contour, options) => {
    if (!viewer.value || !Array.isArray(contour)) return contour;
    const curveCols = Number(options?.width);
    const curveRows = Number(options?.height);
    if (!curveCols || !curveRows) return contour;
    const tiledImage = viewer.value.world?.getItemAt(0);
    if (!tiledImage) return contour;
    const dziSize = tiledImage.getContentSize();
    const dziWidth = dziSize.x;
    const dziHeight = dziSize.y;
    // console.log('curveCols:', curveCols, 'curveRows:', curveRows);
    // console.log('dziWidth:', dziWidth, 'dziHeight:', dziHeight);
    return contour.map(([x, y]) => [
      (parseFloat(x) / curveCols) * dziWidth,
      (parseFloat(y) / curveRows) * dziHeight
    ]);
  };

  const drawQualityContours = (areas, options = {}) => {
    if (!layer.value) return;
    layer.value.destroyChildren(); // Clear existing

    if (!areas || areas.length === 0) {
      layer.value.batchDraw();
      return;
    }

    console.log('drawQualityContours areas:', areas);

    areas.forEach(area => {
      // area: { key, color, contours: [[x,y],...], ... }
      if (!area.contours || area.contours.length === 0) return;

      const color = area.color || 'red';
      // contours [[[x,y], [x,y]...], [[x,y], [x,y]...], [[x,y], [x,y]...]]

      area.contours.forEach(contour => {
        // contour [[x,y], [x,y]...]
        if (!Array.isArray(contour) || contour.length < 2) return;
        const mappedContour = mapContourPoints(contour, options);
        let points = mappedContour.flat();

        // Heuristic: If key is 'cut', draw Line. Else Polygon.
        const isLine = area.key === 'cut';

        const shape = isLine ? new Konva.Line({
          points: points,
          stroke: color,
          strokeWidth: 2,
          strokeScaleEnabled: false, // Ensure constant screen width
          hitStrokeWidth: 10,
          closed: false
        }) : new Konva.Line({
          points: points,
          stroke: color,
          strokeWidth: 2,
          strokeScaleEnabled: false,
          closed: true,
          fill: color + '33', // 20% opacity (hex + 33)
        });

        layer.value.add(shape);
      });
    });

    layer.value.batchDraw();
  };

  return {
    initQualityKonva,
    drawQualityContours
  };
}
