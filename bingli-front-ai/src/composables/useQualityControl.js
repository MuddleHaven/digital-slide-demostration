import { ref } from 'vue';
import * as sliceAPI from '../api/slice.js';

/**
 * 质量控制数据管理 Composable
 * 负责管理每个切片的质量控制数据，避免全局状态污染
 */
export function useQualityControl() {
  // 本地质量控制数据存储 - 按切片ID存储
  const qualityDataMap = ref(new Map());
  
  // 当前切片的质量控制数据
  const currentQualityData = ref({
    AllQuality: '',
    AIQuality: '',
    ranseError: [],
    qiepianError: [],
    makepianError: [],
    saomiaoError: []
  });

  // 质量控制区域数据
  const currentQualityAreas = ref([]);

  // AI质量控制轮廓数据
  const currentAIQualityData = ref([]);

  // 初始化空的质量控制数据结构
  const createEmptyQualityData = () => {
    return {
      AllQuality: '',
      AIQuality: '',
      ranseError: [
        { title: "染色差异", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" }
      ],
      qiepianError: [
        { title: "折叠", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" },
        { title: "裂痕（划痕）", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" },
        { title: "组织缺失", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" },
        { title: "厚薄不均", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" },
        { title: "切片污染", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" },
        { title: "阴影", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" },
        { title: "气泡", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" }
      ],
      makepianError: [
        { title: "裱贴位置不当", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" },
        { title: "标签不端正", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" }
      ],
      saomiaoError: [
        { title: "拼接错误", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" },
        { title: "扫描模糊不清", options: 'YouWuOptions', value: "", disabled: false, AIAnalyze: "" }
      ]
    };
  };

  // 获取当前切片的质量控制数据
  const getCurrentSliceQualityData = (sliceId) => {
    if (!sliceId) return createEmptyQualityData();
    
    if (!qualityDataMap.value.has(sliceId)) {
      qualityDataMap.value.set(sliceId, createEmptyQualityData());
    }
    
    return qualityDataMap.value.get(sliceId);
  };

  // 更新当前显示的质量控制数据
  const switchToSlice = (sliceId) => {
    const data = getCurrentSliceQualityData(sliceId);
    currentQualityData.value = { ...data };
  };

  // 获取质量控制结果
  const loadQualityData = async (sliceId) => {
    // 先检查本地缓存
    if (qualityDataMap.value.has(sliceId)) {
      const cachedData = qualityDataMap.value.get(sliceId);
      currentQualityData.value = { ...cachedData };
      return { success: true, id: cachedData.id };
    }
    
    try {
      // 从服务器获取
      const res = await sliceAPI.getQCResult(sliceId);
      if (res.data != null) {
        // 获取当前质量数据（可能已有AI分析数据）或创建新的
        const qualityData = getCurrentSliceQualityData(sliceId);
        qualityData.AllQuality = res.data.overallQuality || '';
        qualityData.id = res.data.id;
        
        // 更新各个错误项的值（但保留AI分析数据）
        updateErrorFields(qualityData, res.data);
        
        // 缓存到本地
        qualityDataMap.value.set(sliceId, qualityData);
        currentQualityData.value = { ...qualityData };
        
        return { success: true, id: res.data.id };
      } else {
        // 没有数据时，获取现有数据或创建空数据（保留可能的AI分析）
        const qualityData = getCurrentSliceQualityData(sliceId);
        qualityDataMap.value.set(sliceId, qualityData);
        currentQualityData.value = { ...qualityData };
        return { success: true, id: null };
      }
    } catch (error) {
      console.error('Failed to load quality data:', error);
      return { success: false, error };
    }
  };

  // 获取AI质量控制结果
  const loadAIQualityData = async (sliceId) => {
    try {
      const res = await sliceAPI.getAIQCResult(sliceId);
      const resData = res.data || {};
      
      // 如果没有真实数据，使用模拟数据
      const aiData = resData.overallQuality ? resData : {
        overallQuality: '良',
        stainingDiff: 10,      // 染色差异
        folding: 0,           // 折叠
        cracks: 0,            // 裂痕（划痕）
        tissueLoss: 0,        // 组织缺失
        thicknessVar: 10,      // 厚薄不均
        sliceContam: 0,       // 切片污染
        shadows: 10,           // 阴影
        bubbles: 10,           // 气泡
        wrongPosition: 0,     // 裱贴位置不当
        labelMisaligned: 10,   // 标签不端正
        stitchingError: 10,    // 拼接错误
        scanBlur: 10,          // 扫描模糊不清
      };

      if (aiData != null) {
        // 获取当前质量控制数据
        const qualityData = getCurrentSliceQualityData(sliceId);
        qualityData.AIQuality = aiData.overallQuality || '';

        // 更新AI分析结果
        updateAIAnalyzeFields(qualityData, aiData);

        // 更新缓存和当前数据
        qualityDataMap.value.set(sliceId, qualityData);
        // 直接赋值而不是解构，确保响应式更新
        Object.assign(currentQualityData.value, qualityData);
        
        // 保存完整的AI数据，用于坐标转换
        currentAIQualityData.value = aiData;
        
        console.log('AI数据更新完成，当前质量数据:', currentQualityData.value);
        
        return { success: true };
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to load AI quality data:', error);
      return { success: false, error };
    }
  };

  // 更新错误字段的值
  const updateErrorFields = (qualityData, serverData) => {
    // 更新染色差异
    if (serverData.stainingDiff !== undefined) {
      qualityData.ranseError[0].value = serverData.stainingDiff;
    }
    
    // 更新切片异常错误项
    const qiepianFields = ['folding', 'cracks', 'tissueLoss', 'thicknessVar', 'sliceContam', 'shadows', 'bubbles'];
    qiepianFields.forEach((field, index) => {
      if (serverData[field] !== undefined && qualityData.qiepianError[index]) {
        qualityData.qiepianError[index].value = serverData[field];
      }
    });
    
    // 更新制片不规范错误项
    const makepianFields = ['wrongPosition', 'labelMisaligned'];
    makepianFields.forEach((field, index) => {
      if (serverData[field] !== undefined && qualityData.makepianError[index]) {
        qualityData.makepianError[index].value = serverData[field];
      }
    });
    
    // 更新扫描异常错误项
    const saomiaoFields = ['stitchingError', 'scanBlur'];
    saomiaoFields.forEach((field, index) => {
      if (serverData[field] !== undefined && qualityData.saomiaoError[index]) {
        qualityData.saomiaoError[index].value = serverData[field];
      }
    });
  };

  // 更新AI分析字段
  const updateAIAnalyzeFields = (qualityData, serverData) => {
    console.log('更新AI分析字段，服务器数据:', serverData);
    
    // 更新染色差异AI分析
    if (serverData.stainingDiff !== undefined) {
      qualityData.ranseError[0].AIAnalyze = serverData.stainingDiff;
      console.log(`染色差异 AI分析设置为: ${serverData.stainingDiff}`);
    }
    
    // 更新切片异常AI分析结果
    const qiepianFields = ['folding', 'cracks', 'tissueLoss', 'thicknessVar', 'sliceContam', 'shadows', 'bubbles'];
    qiepianFields.forEach((field, index) => {
      if (serverData[field] !== undefined && qualityData.qiepianError[index]) {
        qualityData.qiepianError[index].AIAnalyze = serverData[field];
        console.log(`${qualityData.qiepianError[index].title} AI分析设置为: ${serverData[field]}`);
      }
    });
    
    // 更新制片不规范AI分析结果
    const makepianFields = ['wrongPosition', 'labelMisaligned'];
    makepianFields.forEach((field, index) => {
      if (serverData[field] !== undefined && qualityData.makepianError[index]) {
        qualityData.makepianError[index].AIAnalyze = serverData[field];
      }
    });
    
    // 更新扫描异常AI分析结果
    const saomiaoFields = ['stitchingError', 'scanBlur'];
    saomiaoFields.forEach((field, index) => {
      if (serverData[field] !== undefined && qualityData.saomiaoError[index]) {
        qualityData.saomiaoError[index].AIAnalyze = serverData[field];
      }
    });
  };

  // 处理质量控制变更
  const updateQuality = (sliceId, newQuality) => {
    const qualityData = getCurrentSliceQualityData(sliceId);
    qualityData.AllQuality = newQuality;
    
    // 更新缓存和当前显示数据
    qualityDataMap.value.set(sliceId, qualityData);
    currentQualityData.value = { ...qualityData };
  };

  // 处理质量控制区域更新
  const updateQualityAreas = ({ type, areas }) => {
    const existingIndex = currentQualityAreas.value.findIndex(area => area.type === type);
    
    if (areas.length > 0) {
      const areaData = areas.map(area => ({
        ...area,
        type: type
      }));
      
      if (existingIndex >= 0) {
        currentQualityAreas.value.splice(existingIndex, 1, ...areaData);
      } else {
        currentQualityAreas.value.push(...areaData);
      }
    } else {
      // 移除对应类型的区域
      if (existingIndex >= 0) {
        currentQualityAreas.value.splice(existingIndex, 1);
      }
    }
  };

  // 获取指定切片的质量控制数据
  const getSliceQualityData = (sliceId) => {
    return qualityDataMap.value.get(sliceId) || createEmptyQualityData();
  };

  // 清除指定切片的质量控制数据
  const clearSliceQualityData = (sliceId) => {
    qualityDataMap.value.delete(sliceId);
    if (currentQualityData.value.id === sliceId) {
      currentQualityData.value = createEmptyQualityData();
    }
  };

  // 清除所有质量控制数据
  const clearAllQualityData = () => {
    qualityDataMap.value.clear();
    currentQualityData.value = createEmptyQualityData();
    currentQualityAreas.value = [];
  };

  return {
    // 响应式数据
    currentQualityData,
    currentQualityAreas,
    currentAIQualityData,
    
    // 核心方法
    switchToSlice,
    loadQualityData,
    loadAIQualityData,
    updateQuality,
    updateQualityAreas,
    
    // 工具方法
    getSliceQualityData,
    clearSliceQualityData,
    clearAllQualityData,
    createEmptyQualityData
  };
}
