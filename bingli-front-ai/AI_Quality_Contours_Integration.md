# AI质量控制轮廓显示功能集成说明

## 功能概述
在OpenSeadragon病理切片查看器中添加了AI质量控制轮廓显示功能，可以在切片图像上覆盖显示AI检测到的质量问题区域。

## 集成组件

### 1. OSDQualityOverlay 工具类 (`src/utils/osdQualityOverlay.js`)
- 基于d3.js创建SVG覆盖层
- 支持多种质量类型的颜色映射
- 显示轮廓线和类型标签
- 不阻挡鼠标事件
- 自动适应OpenSeadragon的缩放和平移

### 2. useQualityControl Composable 更新 (`src/composables/useQualityControl.js`)
- 新增 `currentAIQualityContours` 响应式数据
- 修改 `loadAIQualityData` 函数同时处理质量数据和轮廓数据
- AI质量控制结果中的 `curveList` 字段包含轮廓数据

### 3. Openseadragon 组件更新 (`src/components/Openseadragon.vue`)
- 新增 `aiQualityContours` prop接收轮廓数据
- 初始化质量覆盖层实例
- 监听轮廓数据变化并更新显示
- 添加切换显示的按钮和函数

### 4. SliceDetailList 主页面更新 (`src/views/Slice/SliceDetailList.vue`)
- 传递 `currentAIQualityContours` 到 Openseadragon 组件
- 在 `getAIQuality` 中一次性加载质量数据和轮廓数据

## 数据格式

### AI质量控制结果格式 (从后端API返回)
```javascript
{
  overallQuality: '良',
  stainingDiff: 10,      // 染色差异
  folding: 0,            // 折叠
  // ... 其他质量指标
  curveList: [           // 轮廓数据
    {
      id: 1,
      type: 1,           // 质量类型 (1=染色差异, 2=折叠, ...)
      points: "[[x1, y1], [x2, y2], ...]"  // JSON字符串格式的坐标点数组
    }
  ]
}
```

### 质量类型颜色映射
```javascript
{
  1: '#ff4d4f',    // 染色差异 - 红色
  2: '#ff7a45',    // 折叠 - 橙红色  
  3: '#ffa940',    // 裂痕 - 橙色
  4: '#ffec3d',    // 组织缺失 - 黄色
  5: '#bae637',    // 厚薄不均 - 黄绿色
  6: '#52c41a',    // 切片污染 - 绿色
  7: '#13c2c2',    // 阴影 - 青色
  8: '#1890ff',    // 气泡 - 蓝色
  9: '#722ed1',    // 裱贴位置不当 - 紫色
  10: '#eb2f96',   // 标签不端正 - 品红色
  11: '#f759ab',   // 拼接错误 - 粉色
  12: '#faad14'    // 扫描模糊不清 - 金色
}
```

## 使用方式

1. **自动显示**: 当加载AI质量控制数据时，如果有 `curveList`，轮廓会自动传递给组件
2. **手动切换**: 在OpenSeadragon界面右侧，当有AI质量轮廓数据时会显示"质量轮廓"按钮
3. **响应式更新**: 轮廓会随着OpenSeadragon的缩放、平移自动更新位置

## 技术特点

- **非阻塞**: 轮廓覆盖层不会阻挡鼠标事件，可以正常进行测量、标注等操作
- **响应式**: 轮廓位置会随viewer缩放平移实时更新
- **颜色编码**: 不同类型的质量问题用不同颜色区分
- **标签显示**: 在轮廓中心显示质量问题类型名称
- **内存管理**: 组件卸载时会正确清理覆盖层资源

## 测试数据

为了便于测试，composable中包含了模拟数据：
```javascript
const mockContours = [
  {
    id: 1,
    type: 1, // 染色差异
    points: "[[100, 100], [200, 100], [200, 200], [100, 200]]"
  },
  {
    id: 2,
    type: 2, // 折叠
    points: "[[300, 300], [400, 300], [400, 400], [300, 400]]"
  }
];
```

## 后续扩展

1. 可以添加轮廓类型过滤功能
2. 支持轮廓透明度调节
3. 添加轮廓详细信息悬浮提示
4. 支持轮廓点击事件处理
