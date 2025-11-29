import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 切片质量评估面板状态管理
 */
export const usePannelStore = defineStore('pannel', () => {
  // 整体质量评估
  const AllQuality = ref('');
  const AIQuality = ref('');

  // 定义错误类型和字段映射，便于批量操作
  const errorFieldMap = [
    { category: 'ranseError', title: "染色差异", field: "stainingDiff" },
    { category: 'qiepianError', title: "折叠", field: "folding" },
    { category: 'qiepianError', title: "裂痕（划痕）", field: "cracks" },
    { category: 'qiepianError', title: "组织缺失", field: "tissueLoss" },
    { category: 'qiepianError', title: "厚薄不均", field: "thicknessVar" },
    { category: 'qiepianError', title: "切片污染", field: "sliceContam" },
    { category: 'qiepianError', title: "阴影", field: "shadows" },
    { category: 'qiepianError', title: "气泡", field: "bubbles" },
    { category: 'makepianError', title: "裱贴位置不当", field: "wrongPosition" },
    { category: 'makepianError', title: "标签不端正", field: "labelMisaligned" },
    { category: 'saomiaoError', title: "拼接错误", field: "stitchingError" },
    { category: 'saomiaoError', title: "扫描模糊不清", field: "scanBlur" }
  ];

  // 初始化各类错误评估数据
  const ranseError = ref(
    errorFieldMap
      .filter(item => item.category === 'ranseError')
      .map(item => ({
        title: item.title,
        options: 'YouWuOptions',
        value: "",
        disabled: false,
        AIAnalyze: ""
      }))
  );

  const qiepianError = ref(
    errorFieldMap
      .filter(item => item.category === 'qiepianError')
      .map(item => ({
        title: item.title,
        options: 'YouWuOptions',
        value: "",
        disabled: false,
        AIAnalyze: ""
      }))
  );

  const makepianError = ref(
    errorFieldMap
      .filter(item => item.category === 'makepianError')
      .map(item => ({
        title: item.title,
        options: 'YouWuOptions',
        value: "",
        disabled: false,
        AIAnalyze: ""
      }))
  );

  const saomiaoError = ref(
    errorFieldMap
      .filter(item => item.category === 'saomiaoError')
      .map(item => ({
        title: item.title,
        options: 'YouWuOptions',
        value: "",
        disabled: false,
        AIAnalyze: ""
      }))
  );

  /**
   * 获取所有错误评估数据的引用
   * @returns {Array} 所有错误评估数组的引用
   */
  const getAllErrorRefs = () => {
    const errorRefs = [];
    errorRefs.push(...ranseError.value);
    errorRefs.push(...qiepianError.value);
    errorRefs.push(...makepianError.value);
    errorRefs.push(...saomiaoError.value);
    return errorRefs;
  };

  /**
   * 更新整体质量评估
   * @param {string} v - 新的整体质量评估值
   */
  function changeQuality(v) {
    AllQuality.value = v;
  }

  /**
   * 更新人工评估的所有选项
   * @param {Object} data - 包含评估结果的数据对象
   */
  function updateOptions(data) {
    AllQuality.value = data.overallQuality;
    
    // 通过错误字段映射更新各评估项
    errorFieldMap.forEach(({ field, category, title }) => {
      const errorArray = getErrorArrayByCategory(category);
      const errorItem = errorArray.find(item => item.title === title);
      
      if (errorItem && data[field] !== undefined) {
        errorItem.value = data[field];
      }
    });
  }

  /**
   * 更新AI评估的所有选项
   * @param {Object} data - 包含AI评估结果的数据对象
   */
  function updateAIOptions(data) {
    AIQuality.value = data.overallQuality;
    
    // 通过错误字段映射更新各AI评估项
    errorFieldMap.forEach(({ field, category, title }) => {
      const errorArray = getErrorArrayByCategory(category);
      const errorItem = errorArray.find(item => item.title === title);
      
      if (errorItem && data[field] !== undefined) {
        errorItem.AIAnalyze = data[field];
      }
    });
  }

  /**
   * 根据分类名获取对应的错误数组
   * @param {string} category - 错误分类名
   * @returns {Array} 对应分类的错误数组
   */
  function getErrorArrayByCategory(category) {
    switch (category) {
      case 'ranseError': return ranseError.value;
      case 'qiepianError': return qiepianError.value;
      case 'makepianError': return makepianError.value;
      case 'saomiaoError': return saomiaoError.value;
      default: return [];
    }
  }

  /**
   * 清除人工评估数据
   */
  function clearOptions() {
    AllQuality.value = "";
    getAllErrorRefs().forEach(item => {
      item.value = "";
    });
  }

  /**
   * 清除AI评估数据
   */
  function clearAIOptions() {
    AIQuality.value = "";
    getAllErrorRefs().forEach(item => {
      item.AIAnalyze = "";
    });
  }

  return {
    ranseError,
    qiepianError,
    makepianError,
    saomiaoError,
    AllQuality,
    AIQuality,
    changeQuality,
    updateOptions,
    updateAIOptions,
    clearOptions,
    clearAIOptions
  };
});