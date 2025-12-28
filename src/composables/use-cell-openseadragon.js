import OpenSeadragon from 'openseadragon';
import { ref, onUnmounted } from 'vue';
import { getCellSliceDetail } from '@/service/cell-slice.js';

export function useCellOpenseadragon(containerId) {
  const viewer = ref(null);
  const isReady = ref(false);
  const currentCellSlideData = ref(null);
  /** @type {OpenSeadragon.Options} */
  const defaultOptions = {
    id: containerId,
    showNavigator: true,
    navigatorId: "navigatorDiv",
    zoomOutButton: "zoom-out",
    defaultZoomLevel: 1,
    minZoomLevel: 1,
    maxZoomLevel: 40,
    zoomPerClick: false,
    sequenceMode: false,
    drawer: 'canvas',
    preventDefault: true,
    crossOriginPolicy: "Anonymous",
    debugMode: false,
    gestureSettingsMouse: {
      clickToZoom: false,
      dblClickToZoom: false
    },
    visibilityRatio: 0.8,
    constrainDuringPan: true,
  };

  const initViewer = (options = {}) => {
    if (viewer.value) return;

    const mergedOptions = { ...defaultOptions, ...options };
    mergedOptions.id = containerId;

    try {
      viewer.value = OpenSeadragon(mergedOptions);
      isReady.value = true;
    } catch (error) {
      console.error("Failed to initialize OpenSeadragon", error);
    }
  };

  const openCellSlide = async (slideName, fetcher = getCellSliceDetail) => {
    if (!viewer.value) {
      console.warn("Viewer not initialized");
      return;
    }
    if (!slideName) return;

    try {
      const res = await fetcher(slideName);
      const data = res.data;
      currentCellSlideData.value = data;

      const tileMeta = data?.cellTile;
      if (!tileMeta?.slideName || !tileMeta?.width || !tileMeta?.height) {
        console.error("Invalid cell slide data received");
        return;
      }
      console.log('tileMeta:', tileMeta);
      const tileFormat = tileMeta.tileFormat || 'jpeg';
      const tileSource = {
        width: tileMeta.width,
        height: tileMeta.height,
        tileSize: tileMeta.tileSize || 256,
        tileOverlap: tileMeta.tileOverlap || 0,
        minLevel: tileMeta.minLevel || 0,
        maxLevel: tileMeta.maxLevel || 0,
        getTileUrl(level, x, y) {
          return `/Slices/${tileMeta.slideName}/${level}/${x}_${y}.${tileFormat}`;
        },
      };

      viewer.value.open(tileSource);
    } catch (error) {
      console.error("Failed to open cell slide", error);
    }
  };

  onUnmounted(() => {
    if (viewer.value) {
      viewer.value.destroy();
      viewer.value = null;
    }
  });

  return {
    viewer,
    isReady,
    currentCellSlideData,
    initViewer,
    openCellSlide,
  };
}

