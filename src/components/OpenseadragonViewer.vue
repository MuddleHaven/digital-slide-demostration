<template>
  <div class="osd-container">
    <!-- Main Viewer -->
    <div :id="containerId" class="opensea">


    </div>
    <!-- Konva Overlay -->
    <div id="konva-overlay-container" class="konva-overlay" :style="{ pointerEvents: activeTool ? 'auto' : 'none' }">
    </div>
    <!-- Controls Overlay (Navigator, etc.) -->
    <div class="controls-overlay">
      <div id="navigatorDiv" class="navigator"></div>
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

        <!-- Delete Annotation (Removed as per new logic) -->
        <!-- <a-tooltip v-if="activeTool === 'annotation'" title="Delete Selected" placement="top">
          <a-button shape="circle" danger @click="deleteSelected">
            <template #icon><DeleteOutlined /></template>
          </a-button>
        </a-tooltip> -->
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
  }
});

const containerId = 'openseadragon-viewer';
const { viewer, initViewer, openSlide } = useOpenseadragon(containerId);

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
  initAnnotation();
  initMeasurement();

  if (props.slideId) {
    openSlide(props.slideId);
    loadAnnotations(props.slideId);
  }
});

// Watch for slide ID changes to load new slide
watch(() => props.slideId, (newId) => {
  if (newId) {
    openSlide(newId);
    loadAnnotations(newId);
  }
});

// Watch for AI results (Placeholder for future implementation of overlays/annotations)
watch(() => props.aiResult, (newVal) => {
  if (newVal && viewer.value) {
    console.log("AI Result updated, ready to render annotations/heatmaps", newVal);
    // Logic to add overlays would go here or in a separate composable/function
  }
});
</script>

<style scoped>
.osd-container {
  width: 100%;
  height: 100%;
  position: relative;
  /* background-color removed to avoid black borders when dragging */
}

.opensea {
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
  right: 10px;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 4;
  gap: 10px;
}

.navigator {
  width: 232px;
  height: 178px;
  /* background-color: rgba(0, 0, 0, 0.5); */
  border-radius: 25px;
  border: 2px solid #FFFFFF;
  pointer-events: auto;
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
