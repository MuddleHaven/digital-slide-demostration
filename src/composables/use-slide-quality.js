import { ref } from 'vue';
import * as sliceAPI from '@/service/slice.js';
import { message } from 'ant-design-vue';

/**
 * 质量控制数据管理 Composable
 * 负责管理每个切片的质量控制数据，避免全局状态污染
 */
export function useSlideQuality() {
  // 初始化空的质量控制数据结构
  const createEmptyQualityData = () => {
    return {
      quality: '',
      aiQuality: '',
      ranseErrors: [
        { title: "染色差异", key: "stain", options: 'YouWuOptions', value: 0, disabled: false, AIAnalyze: 0 }
      ],
      saomiaoErrors: [
        { title: "模糊不清", key: "blur", options: 'YouWuOptions', value: 0, disabled: false, AIAnalyze: 0 }
      ],
      qiepianErrors: [
        { title: "褶皱折叠", key: "fold", options: 'YouWuOptions', value: 0, disabled: false, AIAnalyze: 0 },
        { title: "组织空窗", key: "tinyHole", options: 'YouWuOptions', value: 0, disabled: false, AIAnalyze: 0 },
        { title: "封片气泡", key: "bubbleFeng", options: 'YouWuOptions', value: 0, disabled: false, AIAnalyze: 0 },
        { title: "刀痕损伤", key: "cut", options: 'YouWuOptions', value: 0, disabled: false, AIAnalyze: 0 },
        { title: "异物污染", key: "shadow", options: 'YouWuOptions', value: 0, disabled: false, AIAnalyze: 0 }, 
      ],
    };
  };

  // 本地质量控制数据存储 - 按切片ID存储
  const qualityDataMap = ref(new Map());

  // 当前切片的质量控制数据
  const qualityData = ref(createEmptyQualityData());

  // 质量控制区域数据
  const currentQualityAreas = ref([]);

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
    qualityData.value = { ...data };
  };

  const parseApiValue = (val) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    
    // Handle string numbers like "10" directly
    if (typeof val === 'string' && !val.includes('{') && !isNaN(Number(val))) {
      return Number(val);
    }

    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null && parsed.value !== undefined) {
        return parsed.value;
      }
      if (typeof parsed === 'number') return parsed;
    } catch (e) {
      // console.warn('Failed to parse API value:', val);
    }
    return 0;
  };

  // 获取质量控制结果
  const loadQuality = async (sliceId) => {
    try {
      const [aiRes, res] = await Promise.all([
        sliceAPI.getAIQCResult(sliceId),
        sliceAPI.getQCResult(sliceId)
      ]);
      const currentData = getCurrentSliceQualityData(sliceId);

      // 1. 处理医生保存的质控结果 (res)
      if (res.data && res.data.category) {
        const cat = res.data.category;
        currentData.quality = cat.totalResult;
        currentData.id = res.data.id;
        
        // 更新各项错误字段的值 (value)
        updateErrorFields(currentData, cat);
      } else {
        // 如果没有保存过，重置为默认值
        const empty = createEmptyQualityData();
        Object.assign(currentData, empty);
      }

      // 2. 处理 AI 分析结果 (aiRes)
      if (aiRes.data) {
        // 更新 AI 质量状态
        if (aiRes.data.totalResult !== undefined) {
          currentData.aiQuality = aiRes.data.totalResult;
        }

        const aiCat = aiRes.data.category || {};
        
        // 更新各项错误字段的 AI 分析值 (AIAnalyze)
        updateAIAnalyzeFields(currentData, aiCat);
      }

      // 3. 更新状态
      qualityDataMap.value.set(sliceId, currentData);
      qualityData.value = { ...currentData };

      return { success: true, id: currentData.id };

    } catch (error) {
      console.error('Failed to load quality data:', error);
      return { success: false, error };
    }
  };

  // 更新AI分析字段
  const updateAIAnalyzeFields = (data, aiData) => {
    if (!aiData) return;

    // ranseErrors: stain
    if (aiData.stain) {
      const val = parseApiValue(aiData.stain);
      data.ranseErrors[0].AIAnalyze = val;
    }

    // saomiaoErrors: blur
    if (aiData.blur) {
      const val = parseApiValue(aiData.blur);
      data.saomiaoErrors[0].AIAnalyze = val;
    }

    // qiepianErrors: fold, tinyHole, bubbleFeng, cut, shadow
    const qiepianMap = {
      '褶皱折叠': 'fold',
      '组织空窗': 'tinyHole',
      '封片气泡': 'bubbleFeng',
      '刀痕损伤': 'cut',
      '异物污染': 'shadow'
    };

    data.qiepianErrors.forEach(err => {
      const apiKey = qiepianMap[err.title];
      if (apiKey && aiData[apiKey]) {
        const val = parseApiValue(aiData[apiKey]);
        err.AIAnalyze = val;
      }
    });
  };

  const updateErrorFields = (data, catData) => {
    // ranseErrors: stain
    if (catData.stain !== undefined) {
      const val = parseApiValue(catData.stain);
      data.ranseErrors[0].value = val;
    }

    // saomiaoErrors: blur
    if (catData.blur !== undefined) {
      const val = parseApiValue(catData.blur);
      data.saomiaoErrors[0].value = val;
    }

    // qiepianErrors: fold, tinyHole, bubbleFeng, cut, shadow
    const qiepianMap = {
      '褶皱折叠': 'fold',
      '组织空窗': 'tinyHole',
      '封片气泡': 'bubbleFeng',
      '刀痕损伤': 'cut',
      '异物污染': 'shadow'
    };

    data.qiepianErrors.forEach(err => {
      const apiKey = qiepianMap[err.title];
      if (apiKey && catData[apiKey] !== undefined) {
        const val = parseApiValue(catData[apiKey]);
        err.value = val;
      }
    });
  };

  const updateQuality = (sliceId, newQuality) => {
    const data = getCurrentSliceQualityData(sliceId);
    data.quality = newQuality;
    qualityDataMap.value.set(sliceId, data);
    qualityData.value = { ...data };
  };

  const saveQuality = async (sliceId, data) => {
    try {
      const payload = {
        sliceId: sliceId,
        category: {
          type: 2, // Manual save
          totalResult: data.quality === '不合格' ? 10 : 0,
          // Map fields back
        }
      };

      // Helper to format
      const formatVal = (val) => JSON.stringify({ value: val });

      // Stain
      if (data.ranseErrors[0]) payload.category.stain = formatVal(data.ranseErrors[0].value);

      // Blur
      if (data.saomiaoErrors[0]) payload.category.blur = formatVal(data.saomiaoErrors[0].value);

      // Qiepian
      const qiepianMap = {
        '褶皱折叠': 'fold',
        '组织空窗': 'tinyHole',
        '封片气泡': 'bubbleFeng',
        '刀痕损伤': 'cut',
        '异物污染': 'shadow'
      };
      data.qiepianErrors.forEach(err => {
        const apiKey = qiepianMap[err.title];
        if (apiKey) payload.category[apiKey] = formatVal(err.value);
      });

      await sliceAPI.updateQCResult(payload);
      message.success("保存成功");
    } catch (e) {
      console.error(e);
      message.error("保存失败");
    }
  };

  const updateQualityAreas = ({ type, areas }) => {
    const existingIndex = currentQualityAreas.value.findIndex(area => area.type === type);
    if (areas.length > 0) {
      const areaData = areas.map(area => ({ ...area, type: type }));
      if (existingIndex >= 0) {
        currentQualityAreas.value.splice(existingIndex, 1, ...areaData);
      } else {
        currentQualityAreas.value.push(...areaData);
      }
    } else {
      if (existingIndex >= 0) currentQualityAreas.value.splice(existingIndex, 1);
    }
  };

  const getSliceQualityData = (sliceId) => qualityDataMap.value.get(sliceId) || createEmptyQualityData();

  const clearSliceQualityData = (sliceId) => {
    qualityDataMap.value.delete(sliceId);
    if (qualityData.value.id === sliceId) qualityData.value = createEmptyQualityData();
  };

  const clearAllQualityData = () => {
    qualityDataMap.value.clear();
    qualityData.value = createEmptyQualityData();
    currentQualityAreas.value = [];
  };

  return {
    qualityData,
    currentQualityAreas,
    switchToSlice,
    loadQuality,
    updateQuality,
    saveQuality,
    updateQualityAreas,
    getSliceQualityData,
    clearSliceQualityData,
    clearAllQualityData,
    createEmptyQualityData
  };
}
