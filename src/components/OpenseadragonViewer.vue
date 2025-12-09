<template>
  <div class="osd-container">
    <!-- Main Viewer -->
    <div :id="containerId" class="openseadragon">

    </div>
    <!-- Konva Overlay -->
    <div id="konva-overlay-container" class="konva-overlay" :style="{ pointerEvents: activeTool ? 'auto' : 'none' }">
    </div>
    <!-- Quality Overlay (Konva) -->
    <div id="quality-overlay-container" class="konva-overlay" style="pointer-events: none; z-index: 100;">
    </div>
    <!-- Controls Overlay (Navigator, etc.) -->
    <div class="controls-overlay">
      <div id="navigatorDiv" class="navigator"></div>
    </div>

    <!-- Bottom Right AI Controls -->
    <div class="ai-controls-overlay">
      <div class="algorithm-btn" v-if="contourDisplayArray.length > 0 ||
        heatMapDisplayArray.length > 0">
        <div class="control-row">
          <!-- Contours -->
          <div class="control-group" v-if="contourDisplayArray.length > 0">
            <div v-for="data in contourDisplayArray.filter(e => e.display)" :key="data.type" class="control-item">
              <a-badge v-if="data.badge" :count="data.badge" :offset="[-6, 4]" :title="data.title">
                <a-button class="primary-btn" :disabled="data.disabled" :type="data.selected ? 'primary' : 'default'"
                  style="width: 101px;" @click="() => toggleContour(data)">
                  <span>轮廓线</span>
                </a-button>
              </a-badge>
              <a-button v-else class="primary-btn" :disabled="data.disabled"
                :type="data.selected ? 'primary' : 'default'" style="width: 101px;" @click="() => toggleContour(data)">
                <span>轮廓线</span>
              </a-button>
            </div>
          </div>

          <!-- Heatmaps -->
          <div class="control-group" v-if="heatMapDisplayArray.length > 0">
            <div v-for="data in heatMapDisplayArray.filter(e => e.display)" :key="data.type" class="control-item">
              <a-badge v-if="data.badge" :count="data.badge" :offset="[-6, 4]" :title="data.title">
                <a-button class="primary-btn" :disabled="data.disabled" :type="data.selected ? 'primary' : 'default'"
                  style="width: 101px;" @click="() => toggleHeatmap(data)">
                  <span>热力图</span>
                </a-button>
              </a-badge>
              <a-button v-else class="primary-btn" :disabled="data.disabled"
                :type="data.selected ? 'primary' : 'default'" style="width: 101px;" @click="() => toggleHeatmap(data)">
                <span>热力图</span>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Toolbar -->
    <div class="bottom-toolbar">
      <div class="toolbar-group">
        <!-- Measurement Tool -->
        <a-tooltip title="Measurement" placement="top">
          <a-button shape="circle" :type="activeTool === 'measure' ? 'primary' : 'default'" @click="toggleMeasure">
            <template #icon>
              <LineChartOutlined />
            </template>
          </a-button>
        </a-tooltip>

        <!-- Annotation Tool -->
        <a-button-group>
          <a-tooltip title="Annotation" placement="top">
            <a-button :type="activeTool === 'annotation' ? 'primary' : 'default'" @click="toggleAnnotation">
              <template #icon>
                <EditOutlined />
              </template>
            </a-button>
          </a-tooltip>
          <a-dropdown :trigger="['click']">
            <a-button :type="activeTool === 'annotation' ? 'primary' : 'default'">
              <template #icon>
                <DownOutlined />
              </template>
            </a-button>
            <template #overlay>
              <a-menu @click="handleAnnoMenuClick" v-model:selectedKeys="selectedAnnoKeys">
                <a-menu-item key="rectangle">
                  <template #icon>
                    <BorderOutlined />
                  </template>
                  Rectangle
                </a-menu-item>
                <a-menu-item key="polygon">
                  <template #icon>
                    <GatewayOutlined />
                  </template>
                  Polygon
                </a-menu-item>
                <a-menu-item key="ellipse">
                  <template #icon><loading-3-quarters-outlined /></template>
                  Ellipse
                </a-menu-item>
                <a-menu-item key="triangle">
                  <template #icon><caret-up-outlined /></template>
                  Triangle
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-button-group>
      </div>

      <!-- Current Tool Indicator -->
      <div v-if="activeTool === 'annotation'" class="tool-indicator">
        Current: {{ currentAnnoTool }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, defineProps, ref, computed } from 'vue';
import { useOpenseadragon } from '@/composables/use-openseadragon';
import { useOsdKonva } from '@/composables/use-osd-konva';
import { useMeasurement } from '@/composables/use-measurement';
import { useAnnotation } from '@/composables/use-annotation';
import { useAiVisualization } from '@/composables/use-ai-visualization';
import { useQualityVisualization } from '@/composables/use-quality-visualization';
import {
  LineChartOutlined,
  EditOutlined,
  DragOutlined,
  BorderOutlined,
  GatewayOutlined,
  DeleteOutlined,
  Loading3QuartersOutlined,
  CaretUpOutlined,
  ArrowRightOutlined,
  MinusOutlined,
  DownOutlined
} from '@ant-design/icons-vue';

const props = defineProps({
  slideId: {
    type: [String, Number],
    default: null
  },
  aiResult: {
    type: Object,
    default: null
  },
  currentQualityAreas: {
    type: Array,
    default: () => []
  },
  isQuality: {
    type: Boolean,
    default: false
  },
  rightSidebarWidth: {
    type: [Number, String],
    default: 0
  },
  leftSidebarWidth: {
    type: [Number, String],
    default: 0
  }
});

const containerId = 'openseadragon-viewer';
const { viewer, initViewer, openSlide } = useOpenseadragon(containerId);
import { getSingleSliceData, getQualitySingleSliceData } from '@/service/slice.js';

// Konva Integration
const { stage, layer, initKonva } = useOsdKonva(viewer, 'konva-overlay-container');
const { activateMeasurement, deactivateMeasurement, initMeasurement } = useMeasurement(stage, layer, viewer);
const {
  initAnnotation,
  activateAnnotation,
  deactivateAnnotation,
  setTool: setAnnoTool,
  deleteSelected,
  currentTool: currentAnnoTool,
  loadAnnotations
} = useAnnotation(stage, layer, viewer);

// AI Visualization Hook
const {
  initAiVisualization,
  heatMapDisplayArray,
  contourDisplayArray,
  toggleHeatmap,
  toggleContour
} = useAiVisualization(viewer, null);

// Quality Visualization
const { initQualityKonva, drawQualityContours } = useQualityVisualization(viewer, 'quality-overlay-container');

// Watch for changes in currentQualityAreas to update contours
watch(() => props.currentQualityAreas, (newAreas) => {
  console.log('useSlideQuality currentQualityAreas changed:', newAreas);
  drawQualityContours(newAreas);
}, { deep: true });

const activeTool = ref(null); // null, 'measure', 'annotation'
const selectedAnnoKeys = ref(['rectangle']); // Default

const toggleMeasure = () => {
  if (activeTool.value === 'measure') {
    activeTool.value = null;
    deactivateMeasurement();
  } else {
    // Deactivate others
    if (activeTool.value === 'annotation') deactivateAnnotation();

    activeTool.value = 'measure';
    activateMeasurement();
  }
};

const toggleAnnotation = () => {
  if (activeTool.value === 'annotation') {
    activeTool.value = null;
    deactivateAnnotation();
  } else {
    // Deactivate others
    if (activeTool.value === 'measure') deactivateMeasurement();

    activeTool.value = 'annotation';
    activateAnnotation();
    // Ensure current tool is set
    setAnnoTool(selectedAnnoKeys.value[0]);
  }
};

const handleAnnoMenuClick = ({ key }) => {
  selectedAnnoKeys.value = [key];
  if (activeTool.value === 'annotation') {
    setAnnoTool(key);
  }
};

onMounted(() => {
  initViewer({
    // Custom options override if needed
    // navigatorId: "navigatorDiv" (already default in hook)
  });

  // Initialize Konva Overlay
  initKonva();
  initQualityKonva();
  initAnnotation();
  initMeasurement();

  if (props.slideId) {
    openSlide(props.slideId, props.isQuality ? getQualitySingleSliceData : getSingleSliceData);
    if (!props.isQuality) {
      loadAnnotations(props.slideId);
    }
    if (props.aiResult) {
      initAiVisualization(props.slideId, props.aiResult);
    }
  }
});

// Watch for slide ID changes to load new slide
watch(() => props.slideId, (newId) => {
  if (newId) {
    openSlide(newId, props.isQuality ? getQualitySingleSliceData : getSingleSliceData);
    if (!props.isQuality) {
      loadAnnotations(newId);
    }
    // Re-init AI logic if aiResult exists
    if (props.aiResult) {
      initAiVisualization(newId, props.aiResult);
    }
  }
});

// Watch for AI results (Placeholder for future implementation of overlays/annotations)
watch(() => props.aiResult, (newVal) => {
  if (newVal && viewer.value && props.slideId) {
    console.log("AI Result updated, initializing visualization", newVal);
    initAiVisualization(props.slideId, newVal);
  }
});

</script>

<style scoped>
.osd-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #FFFFFF;
  /* background-color removed to avoid black borders when dragging */
}

.openseadragon {
  width: 100%;
  height: 100%;
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
}

.konva-overlay {
  width: 100%;
  height: 100%;
  z-index: 3;
  /* Above OSD, Below Controls */
  position: absolute;
  top: 0;
  left: 0;
}

.controls-overlay {
  position: absolute;
  top: 10px;
  left: calc(100px + v-bind('leftSidebarWidth + "px"')); /* Dynamic Left Position */
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Align to start */
  z-index: 4;
  gap: 10px;
  transition: left 0.3s ease;
}

.navigator {
  width: 232px;
  height: 178px;
  /* background-color: rgba(0, 0, 0, 0.5); */
  border-radius: 25px;
  border: 2px solid #FFFFFF;
  pointer-events: auto;
}

.ai-controls-overlay {
  position: absolute;
  top: 30px;
  right: calc(40px + v-bind('rightSidebarWidth + "px"')); /* Dynamic Right Position */
  z-index: 5;
  transition: right 0.3s ease;
}

.algorithm-btn {
  background: rgba(255, 255, 255, 0.8);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-row {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item {
  width: 101px;
}

.primary-btn {
  font-size: 12px;
}

.bottom-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 20px;
  border-radius: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 5;
  display: flex;
  gap: 15px;
  align-items: center;
}

.toolbar-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tool-indicator {
  margin-left: 10px;
  font-size: 12px;
  color: #666;
  text-transform: capitalize;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}
</style>
