import { ref, watch, reactive } from 'vue';
import h337 from '@sitka/heatmap.js';
import { createOSDAnnotator } from '@annotorious/openseadragon';
import { Deck, COORDINATE_SYSTEM } from '@deck.gl/core';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { v4 as uuid } from 'uuid';
import * as sliceAPI from '@/service/slice.js';
import { debounce } from 'lodash'; // Assuming lodash is available

// Constants for Heatmap Types
const HeatMapType = {
  Main: 'Main',
  Auxiliary: 'Auxiliary'
};

class HeatMapOptions {
  constructor(type, display = true, title = '', style = 0) {
    this.type = type;
    this.display = display;
    this.title = title;
    this.style = style; // 0: default, ...
    this.selected = false;
    this.disabled = false;
    this.badge = '';
  }
}

export function useAiVisualization(viewer, sliceData) {
  const heatMapDisplayArray = ref([]);
  const contourDisplayArray = ref([]);

  // Internal state for data
  const heatMapData = ref(null);
  const curveData = ref(null);
  const subCurveData = ref(null);
  const isNeedUpdate = ref(true);

  // Annotorious instance for AI curves
  const aiAnnotator = ref(null);

  // Resize observer for heatmap overlay
  let heatmapResizeObserver = null;

  // Current Slice ID
  const currentSliceId = ref(null);

  // --- Initialization ---

  const initAiVisualization = (sliceId, aiResult) => {
    currentSliceId.value = sliceId;
    setupButtons(aiResult);

    // Reset data on new slice
    heatMapData.value = null;
    curveData.value = null;
    subCurveData.value = null;
    isNeedUpdate.value = true;

    // Initialize AI Annotator if not exists
    if (!aiAnnotator.value && viewer.value) {
      aiAnnotator.value = createOSDAnnotator(viewer.value, {
        drawingEnabled: false,
        autoSave: false, // AI annotations are read-only usually
        userSelectAction: "NONE", // Disable selection
        readOnly: true
      });
    }
  };

  const setupButtons = (aiResult) => {
    if (!aiResult) {
      heatMapDisplayArray.value = [];
      contourDisplayArray.value = [];
      return;
    }

    const {
      mainLabel, subLabel,
      mainHeatmapStyle, subHeatmapStyle,
      mainCurveNumContours, subCurveNumContours
    } = aiResult;

    const hmArr = [];
    const cvArr = [];

    const getBadge = (title) => {
      if (!title) return '';
      return title.length > 2 ? title.substring(0, 2) : title;
    };

    if (subLabel && subHeatmapStyle >= 0) {
      // Auxiliary Heatmap
      const hmOpt = new HeatMapOptions(HeatMapType.Auxiliary, true, subLabel, subHeatmapStyle);
      hmOpt.badge = getBadge(subLabel);
      hmArr.push(hmOpt);

      // Auxiliary Curve
      const cvOpt = new HeatMapOptions(HeatMapType.Auxiliary, true, subLabel, subHeatmapStyle);
      cvOpt.badge = getBadge(subLabel); // Use same badge logic as HeatmapOptions reference
      cvArr.push(cvOpt);
    }

    if (mainLabel && mainHeatmapStyle >= 0) {
      // Main Heatmap
      const hmOpt = new HeatMapOptions(HeatMapType.Main, true, mainLabel, mainHeatmapStyle);
      hmOpt.badge = getBadge(mainLabel);
      hmArr.push(hmOpt);

      // Main Curve
      const cvOpt = new HeatMapOptions(HeatMapType.Main, true, mainLabel, mainHeatmapStyle);
      cvOpt.badge = getBadge(mainLabel);
      cvArr.push(cvOpt);
    }

    heatMapDisplayArray.value = hmArr;
    contourDisplayArray.value = cvArr;
  };

  // --- Data Fetching ---

  const fetchData = async (sliceId) => {
    if (!sliceId) return;

    // If we already have data for this slice and don't need update
    if (heatMapData.value && !isNeedUpdate.value) return;

    try {
      const res = await sliceAPI.getHeatmapCurve(sliceId);
      if (res) {
        heatMapData.value = res.heatmapData;
        curveData.value = res.curveData;
        subCurveData.value = res.subCurveData;
        isNeedUpdate.value = false;
      }
    } catch (error) {
      console.error("Failed to fetch AI visualization data", error);
    }
  };

  // --- Toggle Logic ---

  const toggleHeatmap = debounce(async (option) => {
    if (!viewer.value) return;

    option.selected = !option.selected;

    // Update other buttons state
    heatMapDisplayArray.value.forEach(item => {
      if (item.type !== option.type) {
        item.selected = false;
        item.disabled = option.selected; // Disable others if one is selected
      } else {
        item.disabled = false;
      }
    });

    updateAllButtonsState();

    if (option.selected) {
      await fetchData(currentSliceId.value);

      // Determine if we should use deck.gl or h337
      // For now, let's default to h337 as per "existing implementation" request, 
      // or we can switch. Let's implement h337 first as default.
      // To use deck.gl, uncomment the deckGL line.

      displayFilteredHeatMap(option);
      // displayDeckGLHeatMap(option); 

    } else {
      hideHeatmap();
    }
  }, 100);

  const toggleContour = debounce(async (option) => {
    if (!viewer.value) return;

    option.selected = !option.selected;

    // Update other buttons state
    contourDisplayArray.value.forEach(item => {
      if (item.type !== option.type) {
        item.selected = false;
      }
    });

    updateAllButtonsState();

    if (option.selected) {
      await fetchData(currentSliceId.value);
      displayAICurve(option);
    } else {
      clearAICurve();
    }
  }, 100);

  const updateAllButtonsState = () => {
    const isAnyHeatmapSelected = heatMapDisplayArray.value.some(e => e.selected);
    const isAnyContourSelected = contourDisplayArray.value.some(e => e.selected);

    const selectedType = isAnyHeatmapSelected
      ? heatMapDisplayArray.value.find(e => e.selected).type
      : (isAnyContourSelected ? contourDisplayArray.value.find(e => e.selected).type : null);

    if (!selectedType) {
      // Enable all if nothing selected
      heatMapDisplayArray.value.forEach(i => i.disabled = false);
      contourDisplayArray.value.forEach(i => i.disabled = false);
    } else {
      // Disable those not matching the selected type
      heatMapDisplayArray.value.forEach(i => i.disabled = i.type !== selectedType);
      contourDisplayArray.value.forEach(i => i.disabled = i.type !== selectedType);
    }
  };

  // --- Heatmap Implementation (h337) ---

  const displayFilteredHeatMap = (option) => {
    hideHeatmap(); // Clear existing

    if (!heatMapData.value) return;

    const isAuxiliary = option.type === HeatMapType.Auxiliary;
    const dataStr = isAuxiliary ? heatMapData.value.otherData : heatMapData.value.data;
    const rawData = JSON.parse(dataStr || '[]');

    const targetCurveData = isAuxiliary ? subCurveData.value : curveData.value;
    const { curveRows, curveCols, pointList } = targetCurveData || {};

    // Create Overlay Div
    const elementDiv = document.createElement('div');
    elementDiv.id = 'heatmap-overlay';
    // Reference style
    elementDiv.style.padding = '0px';
    elementDiv.style.filter = 'blur(8px)';
    elementDiv.style.width = '100%';
    elementDiv.style.height = '100%';

    // Aspect ratio
    const heatmapRows = parseInt(heatMapData.value.rows);
    const heatmapCols = parseInt(heatMapData.value.cols);

    const overlay = {
      element: elementDiv,
      width: 1, // Normalized width
      height: heatmapRows / heatmapCols,
      checkResize: false
    };

    viewer.value.addOverlay(overlay);

    // Calculate sizes like reference
    // We need to wait for OSD to update overlay size?
    // Or we use the container size logic from reference more strictly.

    // The reference implementation calculates startWidth based on elementDiv.offsetWidth.
    // If the overlay is added with width: 1, OSD sets its size.
    // We might need to defer this slightly or ensure elementDiv has layout.

    const updateHeatmap = () => {
      const zoomLevel = viewer.value.viewport.getZoom();
      // elementDiv size in pixels on screen
      const rect = elementDiv.getBoundingClientRect();

      // If rect is 0 (hidden), wait?
      if (rect.width === 0) return;

      const startWidth = rect.width / zoomLevel;
      const startHeight = rect.height / zoomLevel;

      // Re-calculate points if size changes significantly?
      // No, points are calculated once based on "startWidth" which is base resolution?
      // Actually, in reference, points are calculated ONCE using startWidth.
      // And then canvas is SCALED using transform.

      // So we need a stable "startWidth".
      // If we use width: 1 overlay, OSD scales the div.
      // At zoom 1, div width = image width (in screen pixels? No, world coordinates).

      // Let's try to calculate startWidth from Image Source directly, as it should be 1:1 with image pixels if we want highest quality.
      // OR stick to the reference: `elementDiv.offsetWidth / zoomLevel`.

      // We need to do this calculation ONCE when creating the heatmap instance.
      // But elementDiv needs to be in DOM and sized.

      const displayObjc = { gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' } };
      const points = [];
      let maxVal = 0;

      let scaledPolygons = [];
      if (pointList && pointList.length > 0) {
        scaledPolygons = pointList.map(poly => poly.map(([x, y]) => {
          return [
            Math.floor((x / curveCols) * startWidth),
            Math.floor((y / curveRows) * startHeight)
          ];
        }));
      }

      rawData.forEach(p => {
        const nx = Math.floor((p.x / heatmapCols) * startWidth);
        const ny = Math.floor((p.y / heatmapRows) * startHeight);

        if (scaledPolygons.length > 0) {
          const inside = scaledPolygons.some(poly => isPointInPolygon([nx, ny], poly));
          if (!inside) return;
        }

        points.push({ x: nx, y: ny, value: p.value });
        if (p.value > maxVal) maxVal = p.value;
      });

      const heatmapInstance = h337.create({
        container: elementDiv,
        gradient: displayObjc.gradient,
        radius: 10,
        blur: 0.5,
        maxOpacity: 1.0,
        minOpacity: 0.8,
      });

      heatmapInstance.setData({
        max: 0.5,
        min: 0.1,
        data: points,
      });

      // Setup Resize Observer AFTER creation
      if (heatmapResizeObserver) heatmapResizeObserver.disconnect();
      heatmapResizeObserver = new ResizeObserver((entries) => {
        const canvasElement = elementDiv.querySelector('canvas');
        if (canvasElement) {
          const currentWidth = entries[0].contentRect.width;
          const scale = currentWidth / startWidth;
          canvasElement.style.transform = `scale(${scale})`;
          canvasElement.style.transformOrigin = '0 0';
          canvasElement.style.opacity = "0.95";
          canvasElement.style.filter = 'blur(6px)';

          // Ensure canvas fills the div visually
          // canvasElement.style.width = '100%';
          // canvasElement.style.height = '100%';
          // Note: h337 sets canvas width/height to container size at creation.
          // We use transform to scale it up/down as OSD zooms the container.
        }
      });
      heatmapResizeObserver.observe(elementDiv); // Observe elementDiv, not container
    };

    // Wait for next tick or short delay to ensure elementDiv is in DOM and sized by OSD
    setTimeout(updateHeatmap, 100);
  };

  // Helper for Polygon Test
  function isPointInPolygon(point, polygon) {
    // point [x, y], polygon [[x,y],...]
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // --- Deck.gl Implementation ---

  const displayDeckGLHeatMap = (option) => {
    hideHeatmap();
    if (!heatMapData.value) return;

    const isAuxiliary = option.type === HeatMapType.Auxiliary;
    const dataStr = isAuxiliary ? heatMapData.value.otherData : heatMapData.value.data;
    const rawData = JSON.parse(dataStr || '[]');

    const heatmapWidth = heatMapData.value.cols;
    const heatmapHeight = heatMapData.value.rows;

    // Map to 0..1 coordinates
    const points = rawData.map(p => ({
      position: [p.x / heatmapWidth, p.y / heatmapHeight], // Normalized 0-1
      weight: p.value
    }));

    // Create Overlay Div
    const elementDiv = document.createElement('div');
    elementDiv.id = 'heatmap-deckgl-overlay';
    elementDiv.style.width = '100%';
    elementDiv.style.height = '100%';

    viewer.value.addOverlay({
      element: elementDiv,
      x: 0, y: 0, width: 1,
      checkResize: false
    });

    // We need the overlay to track OSD. 
    // DeckGL can work with OSD but it's complex to sync views perfectly.
    // Simplest way: DeckGL as an Overlay (DIV) inside OSD.
    // But DeckGL canvas needs to be sized.

    // Let's make the overlay div match the image aspect ratio.
    // And use DeckGL to render into it.
    // We use COORDINATE_SYSTEM.CARTESIAN or NORMALIZED?
    // DeckGL HeatmapLayer usually works in pixels or meters.

    // If we use normalized coordinates [0..1, 0..1], we can scale the view.
    // But DeckGL inside OSD overlay might behave weirdly with events.
    // pointerEvents: none.
    elementDiv.style.pointerEvents = 'none';

    const deck = new Deck({
      parent: elementDiv,
      initialViewState: {
        target: [0.5, 0.5, 0],
        zoom: 0 // We might need to sync zoom? 
        // Or if the DIV itself is scaled by OSD, we just render flat 0..1 space?
      },
      views: [
        // We need a view that maps 0..1 to the canvas size
      ],
      layers: [
        new HeatmapLayer({
          id: 'heatmap-layer',
          data: points,
          getPosition: d => d.position,
          getWeight: d => d.weight,
          aggregation: 'SUM',
          radiusPixels: 30, // This might need tuning or scaling
          intensity: 1,
          threshold: 0.1
        })
      ],
      style: { width: '100%', height: '100%' }
    });

    // NOTE: DeckGL inside OSD Overlay is tricky because OSD scales the DOM element.
    // If the DOM element size changes (CSS transform), DeckGL canvas resolution might look bad
    // or DeckGL might try to resize.

    // The reference implementation for DeckGL used `heatmapResizeObserver` too.
    // It seems they just put DeckGL in the div and let it be.
  };

  const hideHeatmap = () => {
    const existing = document.getElementById('heatmap-overlay');
    if (existing && viewer.value) {
      viewer.value.removeOverlay(existing);
    }
    // Also remove deckgl if any
    const deckExisting = document.getElementById('heatmap-deckgl-overlay');
    if (deckExisting && viewer.value) {
      viewer.value.removeOverlay(deckExisting);
    }
  };

  // --- AI Curve Implementation ---

  const displayAICurve = (option) => {
    clearAICurve();

    const isAuxiliary = option.type === HeatMapType.Auxiliary;
    const data = isAuxiliary ? subCurveData.value : curveData.value;

    if (!data || !data.pointList) return;

    const { curveCols, curveRows, pointList, max_min_values } = data;

    // Get Image Size
    const tiledImage = viewer.value.world.getItemAt(0);
    const dziWidth = tiledImage.getContentSize().x;
    const dziHeight = tiledImage.getContentSize().y;

    const mapToDzi = (x, y) => ({
      x: (x / curveCols) * dziWidth,
      y: (y / curveRows) * dziHeight
    });

    pointList.forEach((points, index) => {
      // Convert points
      const geometryPoints = points.map(([x, y]) => {
        const p = mapToDzi(x, y);
        return [p.x, p.y];
      });

      // Annotorious Polygon Format
      // Annotorious expects a Polygon selector to look like:
      // <svg><polygon points="x1,y1 x2,y2 ..." /></svg>

      const pointsString = geometryPoints.map(p => p.join(',')).join(' ');

      // Create Annotation
      const annotation = {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: uuid(),
        type: "Annotation",
        body: [],
        target: {
          selector: {
            type: "SvgSelector",
            value: `<svg><polygon points="${pointsString}" /></svg>`
          }
        },
        properties: {
          isAi: true,
          type: 'AI-curve'
        }
      };

      if (aiAnnotator.value) {
        aiAnnotator.value.addAnnotation(annotation);
        // Also select it if needed, or just show it. 
        // Usually just showing is enough.
      }
    });
  };

  const clearAICurve = () => {
    if (aiAnnotator.value) {
      // Clear all AI annotations
      aiAnnotator.value.clearAnnotations();
    }
  };

  return {
    initAiVisualization,
    heatMapDisplayArray,
    contourDisplayArray,
    toggleHeatmap,
    toggleContour
  };
}
