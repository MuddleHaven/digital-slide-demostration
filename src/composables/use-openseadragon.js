import OpenSeadragon from 'openseadragon';
import { ref, onUnmounted, watch } from 'vue';
import { getTileUrl } from '@/utils';
import * as sliceAPI from '@/service/slice.js';

export function useOpenseadragon(containerId) {
  const viewer = ref(null);
  const isReady = ref(false);
  const currentSlideData = ref(null);

  /**
   * Default options for OpenSeadragon viewer
   * @type {OpenSeadragon.Options}
   */
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

  // Initialize Viewer
  const initViewer = (options = {}) => {
    if (viewer.value) return;

    const mergedOptions = { ...defaultOptions, ...options };
    // Ensure the ID matches if passed in options, though we use the argument
    mergedOptions.id = containerId;

    try {
      viewer.value = OpenSeadragon(mergedOptions);
      isReady.value = true;

      // Add basic handlers if needed
      viewer.value.addHandler('open', () => {
        console.log('Slide opened successfully');
      });

      viewer.value.addHandler('open-failed', (event) => {
        console.error('Slide open failed', event);
      });

    } catch (error) {
      console.error("Failed to initialize OpenSeadragon", error);
    }
  };

  // Open Slide
  const openSlide = async (slideId) => {
    if (!viewer.value) {
      console.warn("Viewer not initialized");
      return;
    }
    if (!slideId) return;

    try {
      // Fetch detailed slide data for DZI/DeepZoom
      // The API returns data structure needed for OSD
      const res = await sliceAPI.getSingleSliceData(slideId);
      const data = res.data;

      if (!data || !data.slice) {
        console.error("Invalid slide data received");
        return;
      }

      currentSlideData.value = data;

      let fileUrl = data.slice.deepzoomFilePath;
      // tileUrl
      const tileUrl = getTileUrl(fileUrl);

      viewer.value.open({
        Image: {
          xmlns: "http://schemas.microsoft.com/deepzoom/2009",
          Url: tileUrl,
          Overlap: data.overlap,
          TileSize: data.tileSize,
          Format: data.format,
          Size: {
            Height: data.height,
            Width: data.width,
          },
        },
      });
    } catch (error) {
      console.error("Failed to open slide", error);
    }
  };

  /**
   * Cleanup OpenSeadragon viewer on component unmount
   */
  onUnmounted(() => {
    if (viewer.value) {
      viewer.value.destroy();
      viewer.value = null;
    }
  });

  return {
    viewer,
    isReady,
    initViewer,
    openSlide
  };
}
