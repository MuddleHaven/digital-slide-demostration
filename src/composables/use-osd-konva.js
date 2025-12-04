import Konva from 'konva';
import OpenSeadragon from 'openseadragon';
import { ref, onUnmounted, watch } from 'vue';

export function useOsdKonva(viewer, containerId) {
  const stage = ref(null);
  const layer = ref(null);
  const isReady = ref(false);

  // Initialize Konva Stage and Layer
  const initKonva = () => {
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

    // Bind sync events
    viewer.value.addHandler('update-viewport', syncViewport);
    viewer.value.addHandler('resize', handleResize);
    viewer.value.addHandler('open', syncViewport);

    // Forward Zoom (Wheel) events from Konva container to OSD
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Implement Right-Click Pan
    stage.value.on('contentContextmenu', (e) => {
      e.evt.preventDefault(); // Stop context menu
    });

    let isPanning = false;
    let lastPoint = null;

    stage.value.on('mousedown', (e) => {
      if (e.evt.button === 2) { // Right click
        isPanning = true;
        lastPoint = { x: e.evt.clientX, y: e.evt.clientY };
      }
    });

    stage.value.on('mousemove', (e) => {
      if (isPanning && lastPoint) {
        const currentPoint = { x: e.evt.clientX, y: e.evt.clientY };
        const deltaX = currentPoint.x - lastPoint.x;
        const deltaY = currentPoint.y - lastPoint.y;

        const viewportPoint = viewer.value.viewport.deltaPointsFromPixels(
          new OpenSeadragon.Point(-deltaX, -deltaY)
        );
        viewer.value.viewport.panBy(viewportPoint);
        viewer.value.viewport.applyConstraints();

        lastPoint = currentPoint;
      }
    });

    stage.value.on('mouseup', (e) => {
      if (e.evt.button === 2) {
        isPanning = false;
        lastPoint = null;
      }
    });

    isReady.value = true;
    syncViewport(); // Initial sync
  };

  const handleWheel = (e) => {
    if (!viewer.value) return;
    e.preventDefault();

    // OSD Zoom Logic
    const zoomFactor = 1.2;
    const newZoom = e.deltaY > 0
      ? viewer.value.viewport.getZoom() / zoomFactor
      : viewer.value.viewport.getZoom() * zoomFactor;

    // Get pointer position relative to OSD element
    const rect = viewer.value.element.getBoundingClientRect();
    const point = new OpenSeadragon.Point(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    const viewportPoint = viewer.value.viewport.pointFromPixel(point);

    viewer.value.viewport.zoomTo(newZoom, viewportPoint);
    viewer.value.viewport.applyConstraints();
  };

  const getScale = () => {
    if (!viewer.value) return { x: 1, y: 1 };
    const zoom = viewer.value.viewport.getZoom(true);
    const imageZoom = viewer.value.viewport.viewportToImageZoom(zoom);
    return { x: imageZoom, y: imageZoom };
  };

  const syncViewport = () => {
    if (!viewer.value || !stage.value) return;

    const viewport = viewer.value.viewport;

    // 1. Scale
    const newScale = getScale();
    stage.value.scale(newScale);

    // 2. Position (TopLeft in pixels)
    const topLeft = viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
    stage.value.position({ x: topLeft.x, y: topLeft.y });

    // 3. Rotation
    const rotation = viewport.getRotation(true);
    stage.value.rotation(rotation);

    // 4. Size (Handle Resize)
    // Only check size if explicitly needed or on resize event
    // For performance, we trust the container size doesn't change on every viewport update
    
    // 5. Flip (Optional, if needed)
    const flip = viewport.getFlip();
    stage.value.container().style.transform = flip ? 'scaleX(-1)' : 'scaleX(1)';

    // Use draw() instead of batchDraw() to sync with OSD's animation loop and avoid jitter
    stage.value.draw();
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

  onUnmounted(() => {
    if (stage.value) {
      stage.value.destroy();
    }

    // Remove wheel listener
    const container = document.getElementById(containerId);
    if (container) {
      container.removeEventListener('wheel', handleWheel);
    }

    if (viewer.value) {
      viewer.value.removeHandler('update-viewport', syncViewport);
      viewer.value.removeHandler('resize', handleResize);
      viewer.value.removeHandler('open', syncViewport);
    }
  });

  return {
    stage,
    layer,
    initKonva,
    isReady
  };
}
