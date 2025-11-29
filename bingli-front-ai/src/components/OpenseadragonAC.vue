<template>
  <a-row :gutter="16" :class="{ 'full': isfull }">
    <div class="opensea" id="openseadragonId" ref="openseadragonContainer">
      <!-- <canvas id="heatmap-layer" ref="heatMapCanvas" class="heatmap-canvas"></canvas> -->
    </div>
    <!-- 标注的输入框 -->
    <a-card class="labelCard" v-show="commentVisible">
      <a-input v-model:value="commentValue" placeholder="请输入标注信息" />
      <div class="label-btn">
        <a-button @click="deleteAnnotation">删除</a-button>
        <a-button type="primary" style="margin-left: 20px;" @click="saveAnno">保存</a-button>
      </div>
    </a-card>
    <a-col class="center-card" :class="{ 'center-card-height': route.path != '/fullScreen' }">
      <!-- 标注选择 -->
      <div class="navigator" id="navigatorDiv"></div>
      <div class="toolbox">
        <div class="label" @click="changeShape('rectangle')">
          <img src="../assets/icon/选框多选框active.png" alt="" v-if="curShape == 'rectangle'">
          <img src="../assets/icon/标注／矩形／none.png" alt="" v-else>
          <p>矩形</p>
        </div>
        <div class="label" @click="changeShape('ellipse')">
          <img src="../assets/icon/标注圆形active.png" alt="" v-if="curShape == 'ellipse'">
          <img src="../assets/icon/标注圆形none.png" alt="" v-else>
          <p>圆形</p>
        </div>
        <div class="label" @click="changeShape('polygon')">
          <img src="../assets/icon/标注六边形active.png" alt="" v-if="curShape == 'polygon'">
          <img src="../assets/icon/标注六边形none.png" alt="" v-else>
          <p>六边形</p>
        </div>
        <div class="label">
          <a-tooltip color="white">
            <template #title>
              <div class="tip_text">截图</div>
            </template>
            <img src="../assets/icon/icon报告.png" alt="" style="width:29.18px;height:29.18px ;" id="screen-shot">
          </a-tooltip>
          <a-tooltip color="white">
            <template #title>
              <div class="tip_text">测量</div>
            </template>
            <img src="../assets/icon/Subtract.png" alt="" style="width:29.18px;height:29.18px ;" @click="toggleMeasure">
          </a-tooltip>
        </div>
      </div>

      <div class="measure-box" v-show="isMeasure">
        <a-col :span="8" :offset="2">
          <span class="demonstration">标注颜色</span>
          <el-color-picker v-model="colorRef" />
        </a-col>
        <a-col :span="14">
          <a-tooltip title="撤销">
            <a-button shape="circle" type="primary" @click="measurePlugin.undo()">Z</a-button>
          </a-tooltip>
          <a-tooltip title="导出csv">
            <a-button shape="circle" type="primary" style="margin-left: 5px;"
              @click="measurePlugin.exportCSV()">S</a-button>
          </a-tooltip>
          <a-tooltip title="重置所有测量值">
            <a-button shape="circle" type="primary" style="margin-left: 5px;" @click="measureClear">R</a-button>
          </a-tooltip>
        </a-col>
      </div>
      <div class="slide-control">
        <img src="../assets/icon/Group 2505.png" alt="" @click="increaseFocus()" style="cursor: pointer;">
        <a-slider v-model:value=focusValue vertical style="height: 130px; margin-top: 10px;" :max="40" :min="1"
          @change="onChange" :step="0.01" />
        <img src="../assets/icon/Rectangle 321.png" alt="" @click="decreseFocus()" style="cursor: pointer;">
      </div>
      <div class="focus-choose">
        <!-- 放大倍速选择 -->
        <div class="box">
          <div class="text" :class="{ 'focus': focus === 'auto' }">{{ '(' + focusValue + ')' }}</div>
          <div v-for="(zoom, index) in zoomLevels" :key="index" class="text"
            :class="{ 'focus': focusValue === zoom.value }" @click="quickfocus(zoom.label, zoom.value)">
            {{ zoom.label }}
          </div>
        </div>
        <img src="../assets/icon/Group 2443.png" alt="" class="expand-img" @click="fullScreen" v-if="!isfull">
        <img src="../assets/icon/Group2511.png" alt="" class="expand-img" @click="fullScreen" v-else>
      </div>
      <div class="algorithm-btn" v-if="AIDetect">
        <a-row :gutter="[0, 8]" style="width: 101px; margin-left: 10px;">
          <a-col v-for="data in contourDisplayArray.filter(e => e.display)" :key="data.type" :span="24">
            <a-badge v-if="data.badge.length > 0" :count="data.badge" :offset="[-6, 4]" :title="data.title">
              <a-button class="primary-btn" :disabled="data.disabled" :type="data.seleceted ? 'primary' : 'default'"
                style="width: 101px;" @click="() => debounceToggleCurve(data)">
                <span>轮廓线</span>
              </a-button>
            </a-badge>
            <a-button v-else class="primary-btn" :type="data.seleceted ? 'primary' : 'default'" style="width: 101px;"
              @click="() => debounceToggleCurve(data)">
              <span>轮廓线</span>
            </a-button>
          </a-col>
        </a-row>
        <a-row :gutter="[0, 8]" style="width: 101px; margin-left: 10px;">
          <a-col v-for="data in heatMapDisplayArray.filter(e => e.display)" :key="data.type" :span="24">
            <a-badge v-if="data.badge.length > 0" :count="data.badge" :offset="[-6, 4]" :title="data.title">
              <a-button class="primary-btn" :disabled="data.disabled" :type="data.seleceted ? 'primary' : 'default'"
                style="width: 101px;" @click="() => debounceToggleHeatMap(data)">
                <span>热力图</span>
              </a-button>
            </a-badge>
            <a-button v-else class="primary-btn" :type="data.seleceted ? 'primary' : 'default'" style="width: 101px;"
              @click="() => debounceToggleHeatMap(data)">
              <span>热力图</span>
            </a-button>
          </a-col>
        </a-row>
      </div>
    </a-col>
  </a-row>
</template>

<script setup>

import OpenSeadragon from 'openseadragon';
import '../assets/js/canvas-toBlob.js'
import '../assets/js/FileSaver.js'
import extendOpenSeadragonWithScreenshot from '../assets/js/openseadragonScreenshot.js'
import extendOpenseadragonwithfabric from '../assets/js/openseadragon-fabricjs-overlay.js'
import { HeatMapType, HeatMapOptions } from '../common/sliceDetailTypes.js'
// import OSDMeasure from '../assets/js/OSDMeasure.js'
import { computed, onMounted, ref, watch, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message, Modal, px2remTransformer, Tooltip } from 'ant-design-vue';
import { useLayoutStore } from '../stores/LayoutStore.js';
import { mapState, storeToRefs } from 'pinia';
import { useSliceDataStore } from '../stores/SiceDataStore.js'

import { debounce } from '../utils/utils.js';
// 在import部分添加
import OSDMeasurement from '../utils/osdMeasurement.js';

const zoomLevels = [
  { label: '1x', value: 1 },
  { label: '10x', value: 10 },
  { label: '20x', value: 20 },
  { label: '40x', value: 40 }
];

// const isDebugMode = import.meta.env.MODE === 'development';
const isDebugMode = false;

const zoomLevelArray = zoomLevels.map((item) => item.value);

extendOpenSeadragonWithScreenshot(OpenSeadragon)
extendOpenseadragonwithfabric(OpenSeadragon)

//数据
const SliceDataStore = useSliceDataStore()
const { curIndex } = storeToRefs(SliceDataStore)
const { getSliceList } = SliceDataStore
const sliceList = getSliceList();

//布局
const LayoutStore = useLayoutStore()
const { isLeftCard, isRightCard, AIDetect } = storeToRefs(LayoutStore)
const { changeLeftCard, getLeftSpan, getCenterSpan, getRightSpan, changeRightCard } = LayoutStore

const isfull = ref(true)

//数据
const router = useRouter()
const route = useRoute()
const openseadragonContainer = ref(null);

// viewer extends Openseadragon
/**
 * @type {OpenSeadragon.Viewer}
 */
let viewer = null;
const annoRef = ref(null)
const selectedAnno = ref('')
const selectedElement = ref(null);//选择的元素
const commentVisible = ref(false) //评论框是否显示

const heatMapDisplayArray = ref([])
const contourDisplayArray = ref([])

// HeatMapType.Main HeatMapType.Auxiliary null
const activeOption = ref(null)

// slice ai result 
const props = defineProps(['aiResult'])
const aiResult = ref(props.aiResult)
if (aiResult.value != null) {
  setupHeatmapButtons()
}
watch(() => props.aiResult, (val) => {
  // console.log('watch aiResult', val);
  if (val != null) {
    aiResult.value = val
  }
  setupHeatmapButtons()
})

function setupHeatmapButtons() {
  const val = aiResult.value
  // console.log('setupHeatmapButtons aiResult', val);
  if (val.length == 0) return

  const mainLabel = val.mainLabel
  const subLabel = val.subLabel
  const mainStyle = val.mainHeatmapStyle
  const subStyle = val.subHeatmapStyle
  let arr = []

  let curveArr = []

  if (subLabel != null && subStyle != null && subLabel.length > 0 && subStyle >= 0) {
    arr.push(new HeatMapOptions(HeatMapType.Auxiliary, true, subLabel, subStyle))
    curveArr.push(new HeatMapOptions(HeatMapType.Auxiliary, true, subLabel, subStyle))
  }
  if (mainLabel != null && mainStyle != null && mainLabel.length > 0 && mainStyle >= 0) {
    arr.push(new HeatMapOptions(HeatMapType.Main, true, mainLabel, mainStyle))
    curveArr.push(new HeatMapOptions(HeatMapType.Main, true, mainLabel, mainStyle))
  }
  if (arr.length > 0) {
    heatMapDisplayArray.value = Array.from(arr)
  } else {
    // heatMapDisplayArray.value = [new HeatMapOptions(HeatMapType.Main, true)]
  }
  // console.log('HeatMapOptionsArray', heatMapDisplayArray);
  if (curveArr.length > 0) {
    contourDisplayArray.value = Array.from(curveArr)
  } else {
    // contourDisplayArray.value = [new HeatMapOptions(HeatMapType.Main, true)]
  }

  // const count = val.mainCurveNumContours
  // const subCount = val.subCurveNumContours
}

onMounted(() => {
  initOpenSeaDragonViewer()
  getDetailSliceData(1)
  // getDetailSliceData(sliceList.value[curIndex.value].id)
  if (localStorage.getItem('color')) { colorRef.value = localStorage.getItem('color') }

  // 监听esc键 退出标注模式 测量模式
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (shapeMode.value) {
        curShape.value = ''
        // drawAnnoRectangle(curShape.value, viewer, annoRef)
      }
      if (isMeasure.value) {
        toggleMeasure()
      }
    }
  })

  // isFull need request aiResult
  if (isfull.value) {
    // console.log('isfull', isfull.value);
    // console.log('aiResult', props.aiResult);
    // sliceAPI.getAIResult(sliceList.value[curIndex.value].id).then((res) => {
    //   // console.log('aiResult', res.data);
    //   aiResult.value = res.data
    //   setupHeatmapButtons()
    // })
  }
})

onUnmounted(() => {
  // hiddenHeatMap(viewer)
  viewer.destroy()
  viewer = null
  window.removeEventListener('keydown', () => { })
})


/**
 * @type {OpenSeadragon.Options}
 */
const options = {
  id: "openseadragonId",
  showNavigator: true,
  navigatorId: "navigatorDiv",
  zoomOutButton: "zoom-out",
  defaultZoomLevel: 1,
  minZoomLevel: 1,
  maxZoomLevel: 40,
  zoomPerClick: false,
  sequenceMode: false,
  // useCanvas: true,
  drawer: 'canvas',
  preventDefault: true,
  crossOriginPolicy: "Anonymous",//截图异步
  // dev  environment debugMode: true
  debugMode: isDebugMode,
  gestureSettingsMouse: {
    clickToZoom: false,
    dblClickToZoom: false
  },
}

const initOpenSeaDragonViewer = () => {
  if (viewer) { return }
  viewer = OpenSeadragon(options);

  viewer.addHandler('zoom', function (event) {
    let currentZoom = viewer.viewport.getZoom();
    focusValue.value = Number(Number(currentZoom).toFixed(2));
    if (zoomLevelArray.indexOf(focusValue.value) > -1) {
      focus.value = String(focusValue.value);
    } else {
      focus.value = 'auto';
    }
  });

  // initHeatmap()

  // viewer.addHandler('pan', function (event) {
  //   if (measurePlugin.value) {
  //     // measurePlugin.value.update();
  //   }
  // });

  // viewer.addHandler('canvas-drag', function (event) {
  //   if (measurePlugin.value) {
  //     // measurePlugin.value.update();
  //   }
  // });

  // viewer.addHandler('canvas-release', function (event) {
  //   if (measurePlugin.value) {
  //     // measurePlugin.value.update();
  //   }
  // });

  //初始化截图
  viewer.screenshot({
    showOptions: true, // Default is false
    keyboardShortcut: 'x', // Default is null
    showScreenshotControl: true, // Default is true
    toggleButton: "screen-shot"
  });
  viewer.addHandler("open", () => {
    // const canvas = heatMapCanvas.value;
    // canvas.width = viewer.container.clientWidth;
    // canvas.height = viewer.container.clientHeight;

    // // 把 canvas 作为 overlay 添加
    // this.viewer.addOverlay({
    //   element: canvas,
    //   location: this.viewer.viewport.getBounds()
    // });
  });
  // initOpenSeadragonAnnotation(viewer)
  //初始化标注
  // initAnno(annoRef, selectedAnno, selectedElement, commentVisible, commentValue, viewer)
}

//右上角按钮
const curShape = ref('')

const shapeMode = computed(() => curShape.value != '')

const changeShape = (shape) => {
  if (isMeasure.value) {
    message.info("测量状态下无法使用标注")
    return
  }
  // 如果已经选择了标注，再次点击取消选择
  curShape.value = shape == curShape.value ? '' : shape;
  // drawAnnoRectangle(curShape.value, viewer, annoRef)
}

//放大倍数
const focus = ref('auto');
const focusValue = ref(1);
const quickfocus = (s, n) => {
  focus.value = s;
  focusValue.value = n;
  // modification
  // console.log('focusValue', focusValue.value);
  viewer.viewport.zoomTo(focusValue.value);
};

const increaseFocus = () => {
  focusValue.value = Number(focusValue.value) + 0.01;
  viewer.viewport.zoomTo(focusValue.value);
};

const decreseFocus = () => {
  focusValue.value = Math.max(Number(1), Number(focusValue.value) - 0.01);
  viewer.viewport.zoomTo(Math.max(Number(1), Number(focusValue.value)));
};


const onChange = () => {
  focus.value = 'auto'
  viewer.viewport.zoomTo(focusValue.value);
}

const getDetailSliceData = async (id) => {
  viewer.open({
    Image: {
      xmlns: "http://schemas.microsoft.com/deepzoom/2009",
      Url: '/deepzoom_file/007_202504301406360004_files/',
      Overlap: '0',
      TileSize: '1024',
      Format: 'jpeg',
      Size: {
        Height: "26880",
        Width: "69888",
      },
    }
  });

  // let res = await sliceAPI.getSingleSliceData(id);
  // const data = res.data
  // SliceData.value = data
  // viewer.open({
  //   Image: {
  //     xmlns: "http://schemas.microsoft.com/deepzoom/2009",
  //     Url: data.slice.deepzoomFilePath,
  //     Overlap: data.overlap,
  //     TileSize: data.tileSize,
  //     Format: data.format,
  //     Size: {
  //       Height: data.height,
  //       Width: data.width,
  //     },
  //   },
  // });
  viewer.tileSources = [id]
  //获取数据直接展示标注
  toggleUserCurve()
}

//将方法暴露给父组件
defineExpose({
  getDetailSliceData
})

//绘图
const deleteAnnotation = async () => {
  // deleteAnno(annoRef, selectedAnno)
}

const saveAnno = () => {
  // curShape.value = ''
  // drawAnnoRectangle(curShape.value, viewer, annoRef)
  // SaveUserAnnotation(annoRef, commentValue, selectedAnno, sliceList.value[curIndex.value].id, commentVisible)
}

//标注
const commentValue = ref(null)

//全屏控制
const fullScreen = () => {
  if (isfull.value == true) router.push("/sliceDetailList")
  else router.push("/fullScreen")
}

//测量距离————————————————————————————————————————————————————————————————————————
const colorRef = ref('#000000')
const isMeasure = ref(false)
const measurePlugin = ref()

watch(colorRef, (val) => {
  // measurePlugin.value type is OSDMeasure
  if (measurePlugin.value) {
    /** @type OsdMeasurement */
    const measure = measurePlugin.value
    measure.setMeasurementColor(val);
    localStorage.setItem('color', val);
  }
})

/// 这里初始化测量参数，pxTomm为接口有px转化为mm,px为像素，zoom为放缩倍率
/// pxTomm 不起作用的， OSDMeasure 里面并没有这个方法 conversionFactor 代替了 pxTomm 
// @params {float} conversionFactor
const toggleMeasure = () => {
  isMeasure.value = !isMeasure.value
  if (isMeasure.value) {
    message.info("已开启测量模式, 点击并拖动测量距离");
    curShape.value = ''
    // drawAnnoRectangle(curShape.value, viewer, annoRef);
    if (!measurePlugin.value) {
      measurePlugin.value = new OSDMeasurement(viewer, {
        color: colorRef.value,
        units: "μm",
        conversionFactor: 1,
        strokeWidth: 2,
        labelFontSize: 14
      });
    }
    measurePlugin.value.enableMeasurement();
    const color = localStorage.getItem('color') || colorRef.value;
    measurePlugin.value.setMeasurementColor(color);
  } else {
    message.info("已关闭测量模式");
    if (measurePlugin.value) {
      measurePlugin.value.disableMeasurement();
    }
    // initAnno(annoRef, selectedAnno, selectedElement, commentVisible, commentValue, viewer);
  }
}

const measureClear = () => {
  Modal.confirm({
    title: '提示',
    content: '是否清除所有测量值？',
    centered: true,
    onOk() {
      if (measurePlugin.value) {
        measurePlugin.value.clear();
      }
    },
    onCancel() {
      // console.log('Cancel');
    },
  });
}

//初始化标注直尺

///轮廓线————————————————————————————————————————————————————————————————————————————
const loadingData = ref("None")
// Keep the computed property for other uses if needed
const loadingText = computed(() => getLoadingText(loadingData.value))

const getLoadingText = (status) => {
  if (status === "Slice")
    return "正在获取切片数据"
  else if (status === "Curve")
    return "正在获取轮廓线数据"
  else if (status === "HeatMap")
    return "正在获取热力图数据"
  else
    return "正在加载数据"
}

// Replace the watch with a function that shows the message directly
const setLoadingStatus = (status) => {
  // loadingData.value = status
  // if (status === "None") {
  //   // Hide any existing loading messages
  //   message.destroy()
  // } else {
  //   // Show the loading message
  //   message.loading(getLoadingText(status))
  // }
}

//是否需要请求新的热力图数据，如果在同一个页面重复查看热力图，是不需要重复像后端请求热力图数据的
const needNewHeatMap = ref(true);
//热力图是否展示
// const heatMapVisible = ref(false);
// 轮廓线可用
const usercurveVisible = ref(false)
//AI轮廓线可用
// const curveVisible = ref(false)
//* data in display js file */
// const heatMapData = ref(undefined);//热力图数据
// const curveData = ref(undefined)

const SliceData = ref()

watch(curIndex, () => {
  needNewHeatMap.value = true
  // curveVisible.value = false
  // deselected all heatMap selected
  heatMapDisplayArray.value.forEach((item) => {
    item.seleceted = false
  })
  contourDisplayArray.value.forEach((item) => {
    item.seleceted = false
  })
  // curveData.value = undefined
  // heatMapData.value = undefined
})

const toggleUserCurve = async () => {
  //用户自由标注的轮廓线展示按钮
  // setLoadingStatus("Curve")
  usercurveVisible.value = true
  // displayUserCurve(usercurveVisible, annoRef);
  //展示用户标注轮廓线
  // setLoadingStatus("None");
}

/// AI轮廓线————————————————————————————————————————————————————————————————————————————
const toggleCurve = async (displayData) => {
  // setLoadingStatus("Curve")
  // curveVisible.value = !curveVisible.value
  displayData.seleceted = !displayData.seleceted
  contourDisplayArray.value.forEach((item) => {
    if (item.type != displayData.type) {
      item.seleceted = false
    }
  })
  updateButtonsDisabled()
  const curveVisible = displayData.seleceted
  // 是否显示轮廓图
  if (!curveVisible) {
    toggleUserCurve()
  } else {
    const displayCount = heatMapDisplayArray.value.filter(e => e.display).length
    let other = displayCount > 1 ? true : false
    if (displayCount > 1) {
      other = displayData.type == HeatMapType.Auxiliary
    }
    //展示AI分析后的标注轮廓线
    // displayAICurve(curveVisible, annoRef, SliceData, { other: other, displayObjc: displayData });
  }
  // setLoadingStatus("None");
}

///热力图————————————————————————————————————————————————————————————————————————————
const toggleHeatMap = (displayData) => {
  setLoadingStatus("HeatMap")
  displayData.seleceted = !displayData.seleceted
  // only display one heatMap
  heatMapDisplayArray.value.forEach((item) => {
    if (item.type != displayData.type) {
      item.seleceted = false
      item.disabled = true
    } else {
      item.disabled = false
    }
  })
  updateButtonsDisabled()
  const heatMapVisible = displayData.seleceted
  if (heatMapVisible) {
    //展示热力图
    // if (needNewHeatMap.value) {
    //回到初始的放大倍率
    viewer.viewport.goHome(true);
    // }

    const displayCount = heatMapDisplayArray.value.filter(e => e.display).length
    let other = displayCount > 1 ? true : false
    if (displayCount > 1) {
      other = displayData.type == HeatMapType.Auxiliary
    }
    // needNewHeatMap.value = displayHeatMap(viewer, heatMapVisible, needNewHeatMap, SliceData);
    // needNewHeatMap.value = displayFilteredHeatMap(viewer, heatMapVisible, needNewHeatMap, SliceData, { other: other, displayObjc: displayData });
    // needNewHeatMap.value = displayDeckGLHeatMap(viewer, heatMapVisible, needNewHeatMap, { other: other, displayObjc: displayData })
  } else {
    //关闭热力图
    // hiddenHeatMap(viewer);
  }
  setLoadingStatus("None")
}

// update buttons disabled status
const updateButtonsDisabled = () => {
  // if button selected, disable other buttons
  const heatMapSelected = heatMapDisplayArray.value.filter(e => e.seleceted).length > 0
  const curveSelected = contourDisplayArray.value.filter(e => e.seleceted).length > 0

  if (!heatMapSelected && !curveSelected) {
    heatMapDisplayArray.value.forEach((item) => {
      item.disabled = false
    })
    contourDisplayArray.value.forEach((item) => {
      item.disabled = false
    })
    return
  }
  let selectedType = null;

  if (heatMapSelected) { selectedType = heatMapDisplayArray.value.filter(e => e.seleceted)[0].type }
  if (curveSelected) { selectedType = contourDisplayArray.value.filter(e => e.seleceted)[0].type }

  heatMapDisplayArray.value.forEach((item) => {
    if (item.type != selectedType) {
      item.disabled = true
    } else {
      item.disabled = false
    }
  })

  contourDisplayArray.value.forEach((item) => {
    if (item.type != selectedType) {
      item.disabled = true
    } else {
      item.disabled = false
    }
  })

}

const debounceToggleCurve = debounce(toggleCurve, 100, true)
const debounceToggleHeatMap = debounce(toggleHeatMap, 100, true)

</script>

<style src="../assets/styles/openSeaDragon.scss" lang="sass" scoped></style>