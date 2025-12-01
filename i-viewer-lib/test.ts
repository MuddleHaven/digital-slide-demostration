/* eslint-disable no-alert */

import type { DrawMode, LabelOptions } from './src/index'
import { Constants, FilterManager, OsdManager, OverlayManager, ScreenShotManager } from './src/index'

const iMapInfo = {
  uuid: 1752112165112012,
  createTime: 1744626384968,
  path: 'E:\\TMAP\\SLICEID-20250324112235.TMAP',
  name: 'SLICEID-20250324112235.TMAP',
  width: 264413,
  height: 120675,
  scale: 40,
  macroExist: true,
  relativePath: 'E:\\TMAP',
  labelInfo: null,
  size: 2016141323,
  type: 'tmap',
  state: 'unknown',
  version: '6.1',
  focusNums: 0,
  saveScale: 59,
  slideType: 0,
  pixelSize: 0.0069199996,
  tileSize: 256,
}

const shapeAttr = [
  {
    x: 36918.04150943396,
    y: 81290.98301886793,
    radius: 21834.853352803886,
    stroke: 'red',
    strokeWidth: 4,
    strokeScaleEnabled: false,
    draggable: true,
    id: 'XRcmiqAbp7dodmyi7FxoS',
    measurement: {
      shapeType: 'circle',
      labelTag: '标记',
      description: '22222222222',
      realRadius: 151111.01646666153,
      realCircumference: 949458.5184163003,
      realArea: 71736820905.40881,
    },
  },
  {
    x: 78625.45056603775,
    y: 59738.829056603776,
    width: 24146.39471698113,
    height: 12771.64679245284,
    draggable: true,
    stroke: '#000',
    strokeWidth: 4,
    strokeScaleEnabled: false,
    id: 'LI1z0HzS5rmjaiqMVetCe',
    measurement: {
      shapeType: 'rect',
      labelTag: '标记',
      description: '22222222222',
      realWidth: 167120.72178135152,
      realHeight: 88407.470693515,
      realArea: 14774720313.163908,
      realPerimeter: 511056.38494973304,
    },
  },
  {
    x: 70044.5003773585,
    y: 32798.636603773586,
    radiusX: 15765.001509433965,
    radiusY: 7782.722264150942,
    stroke: '#000',
    strokeWidth: 4,
    strokeScaleEnabled: false,
    draggable: true,
    id: 'YwJ3p6kow86fVWiKuSHkT',
    measurement: {
      shapeType: 'ellipse',
      labelTag: '标记',
      description: '22222222222',
      realRadiusX: 109107.6441384824,
      realRadiusY: 53870.27495403568,
      realArea: 18465209672.85758,
      realPerimeter: 540618.4327458321,
    },
  },
  {
    points: [
      103170.95924528303,
      97654.65547169812,
      140089.000754717,
      73707.81773584906,
    ],
    pointerLength: 4123.399610136452,
    pointerWidth: 4123.399610136452,
    fill: '#000',
    stroke: '#000',
    strokeWidth: 4,
    hitStrokeWidth: 20,
    strokeScaleEnabled: false,
    draggable: true,
    id: 'dD2tSsgYpSDG9I_5WC20q',
    measurement: {
      shapeType: 'arrow',
      labelTag: '标记',
      description: '22222222222',
    },
  },
  {
    points: [
      179601.28301886795,
      44173.38452830189,
      161242.040754717,
      73109.14679245284,
      186186.66339622645,
      81690.09698113208,
      207339.70339622642,
      73707.81773584906,
      200754.32301886796,
      54949.46150943397,
    ],
    stroke: '#000',
    strokeWidth: 4,
    strokeScaleEnabled: false,
    draggable: true,
    closed: true,
    id: 'Z1vFijaLvNuDx2H6JUBAL',
    measurement: {
      shapeType: 'polygon',
      labelTag: '标记',
      description: '22222222222',
      realArea: 7097573612.444223,
      realPerimeter: 877991.6568615331,
    },
  },
  {
    points: [
      190776.47396226416,
      46368.511320754726,
      251840.91018867926,
      45570.28339622641,
    ],
    pointerAtBeginning: true,
    pointerLength: 0,
    pointerWidth: 4123.399610136452,
    fill: '#000',
    stroke: '#000',
    strokeWidth: 4,
    hitStrokeWidth: 20,
    strokeScaleEnabled: false,
    draggable: true,
    id: 'GcIEeYAV8LrdmyeLj9rx-',
    measurement: {
      shapeType: 'ruler',
      labelTag: '标记',
      description: '22222222222',
      realLength: 422601.9755745619,
    },
  },
]

const osd = [new OsdManager({
  id: 'inner1',
  tileSources: {
    width: 264413,
    height: 120675,
    tileSize: 256,
    getTileUrl: (level: number, col: number, row: number) => {
      return `/api/iviewerservice/oceanview/previewocean/${iMapInfo.uuid}/0/${level}/${col}_${row}.jpg`
    },
  },
}), new OsdManager({
  id: 'inner2',
  tileSources: {
    width: 264413,
    height: 120675,
    tileSize: 256,
    getTileUrl: (level: number, col: number, row: number) => {
      return `/api/iviewerservice/oceanview/previewocean/${iMapInfo.uuid}/0/${level}/${col}_${row}.jpg`
    },
  },
})]

const overlay = new OverlayManager(osd[0], {
  shapeOptions: {
    strokeWidth: 4,
    stroke: '#000',
    drawComplete: () => {

    },
    dragComplete: () => {

    },
  },
  labelOptions: {
    fontSize: 12,
    pixelSize: iMapInfo.pixelSize,
    editDescriptionEvent: (description: string, cb: (value: string) => void) => {
      const newDescription = window.prompt('请输入描述', description)
      if (newDescription) {
        cb(newDescription)
      }
    },
  },
})

const filter = new FilterManager(osd[0])

const screenShotManager = new ScreenShotManager(osd, overlay, {
  containOverlay: true,
  createActionButton: (container) => {
    const dom = document.createElement('div')
    dom.style.backgroundColor = '#000'
    dom.style.width = '128px'
    dom.style.height = '48px'
    container.appendChild(dom)
  },
  container: '#app',
})

$('#toolbar').on('click', (e) => {
  overlay.setDrawMode(e.target.getAttribute('type') as DrawMode)
})

$('#change-shape').on('click', (e) => {
  if (e.target.getAttribute('target') === 'label') {
    if (e.target.getAttribute('type') === 'alwaysVisible') {
      overlay.setLabelOptions({
        alwaysVisible: e.target.getAttribute('data') === '1',
      })
    }
    else if (e.target.getAttribute('type') === 'measurement') {
      overlay.setLabelOptions({
        [`${Constants.LABEL_TYPE.MEASUREMENT}Visible`]: e.target.getAttribute('data') === '1',
      })
    }
    else if (e.target.getAttribute('type') === 'tag') {
      overlay.setLabelOptions({
        [`${Constants.LABEL_TYPE.TAG}Visible`]: e.target.getAttribute('data') === '1',
      })
    }
    else if (e.target.getAttribute('type') === 'description') {
      overlay.setLabelOptions({
        [`${Constants.LABEL_TYPE.DESCRIPTION}Visible`]: e.target.getAttribute('data') === '1',
      })
    }
  }
  if (e.target.getAttribute('target') === 'shape') {
    overlay.setShapeOptions({
      [e.target.getAttribute('type') as keyof LabelOptions]: e.target.getAttribute('data') === '1',
    })
  }
})

$('#screenshot').on('click', () => {
  screenShotManager.takeScreenshot()
})

$('#shapesAttr').on('click', (e) => {
  if (e.target.getAttribute('type') === 'get') {
    overlay.getShapesAttr()
  }
  if (e.target.getAttribute('type') === 'set') {
    overlay.setShapesAttr(shapeAttr)
  }
})

$('#filter').on('click', (e) => {
  if (e.target.getAttribute('type') === 'gamma') {
    filter.setParams({ gamma: 2.5 })
  }
})

$('#action').on('click', (e) => {
  if (e.target.getAttribute('type') === 'remove') {
    overlay.destroyShape(shapeAttr[0])
  }
})

let rotation = 0
$('#osd-action').on('click', (e) => {
  if (e.target.getAttribute('type') === 'rotation') {
    osd[0].getViewer().viewport.setRotation(rotation += 10)
  }
})
