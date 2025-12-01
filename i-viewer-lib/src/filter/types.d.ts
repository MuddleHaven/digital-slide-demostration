export interface FilterParams {
  // 伽马值 (0.2-5.0)
  gamma: number
  // 亮度 (-100-100)
  brightness: number
  // 对比度 (-50-100)
  contrast: number
  // 饱和度 (-100-100)
  saturation: number
  // 锐化 (0-10)
  sharpness: number
  // 图像均衡化 (0.0-1.0)
  equalization: number
  // 红色平衡 (-100-100)
  redBalance: number
  // 绿色平衡 (-100-100)
  greenBalance: number
  // 蓝色平衡 (-100-100)
  blueBalance: number
}
