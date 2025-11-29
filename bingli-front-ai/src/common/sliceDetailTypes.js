
import * as QColorMap from 'colormap';

//颜色梯度: 
function getHeatMapColor() {
  const colors = {}
  let n = 1
  QColorMap({
    colormap: 'jet',
    nshades: 100,
    format: 'hex',
    alpha: 1
  }).forEach((color) => {
    colors[(n++ / 100).toFixed(2).toString()] = color;
  })
  return colors;
}

export function getMedicalHeatmapGradient() {
  return {
    '0.0': '#00008B',  // 深蓝：正常组织背景
    '0.3': '#00FFFF',  // 青色：早期病变过渡区
    '0.6': '#FFFF00',  // 黄色：病变显著区域
    '0.8': '#FF8000',  // 橙色：异常核心区
    '1.0': '#FF0000'   // 红色：危急值区域
  };
}


/**
炎症热力图规范:

颜色梯度: 蓝-青渐变
数据点密度: 每平方毫米 500 个点
热力半径: 8 像素
标注优先级: 显示前 10% 高值区域
癌症热力图规范:

颜色梯度: 黄色到红色渐变
数据点密度: 每平方毫米 300 个点
热力半径: 12 像素
标注优先级: 显示前 5% 高值区域
 */

export const cancerHeatmapGradient = {
  '0.0': '#FFFF00',  // 黄色：病变显著区域
  '0.3': '#FF8000',  // 橙色：异常核心区
  '0.6': '#FF0000'   // 红色：危急值区域
};

export const inflammationHeatmapGradient = {
  '0.0': '#00008B',  // 深蓝：正常组织背景
  '0.3': '#00FFFF'   // 青色：早期病变过渡区
};

const HeatMapType = Object.freeze({
  // Cancer: 'cancer',
  // Inflammation: 'inflammation',
  Main: 'main',
  Auxiliary: 'auxiliary'
})

// 热力图分为两种，一种是癌症热力图，一种是炎症热力图
// 两者颜色不一样，通过AI分析的结果来判断，也有可能存在多个结果
// 一个主结果，然后会有一个伴随结果
class HeatMapOptions {

  // properties
  display = false
  type = HeatMapType.Main
  badge = ''
  gradient = {}
  seleceted = false
  disabled = false
  title = ''

  // The HeatMapOptions class is used to define the configuration for heatmaps.
  // It includes properties such as the type of heatmap, whether it should be displayed,
  // a badge to represent the heatmap type, and the gradient colors based on the type.
  // The constructor initializes these properties with default values or based on the provided arguments.
  constructor(type = HeatMapType.Main, display = false, title = '', style = 0) {
    // style 0~3
    this.display = display;
    this.type = type;
    this.seleceted = false;
    this.gradient = type === HeatMapType.Main ? cancerHeatmapGradient : inflammationHeatmapGradient
    this.title = title
    if (title.length > 2) {
      this.badge = title.substring(0, 2)
    } else {
      this.badge = title
    }
  }
}

export { HeatMapType, HeatMapOptions }