import { ref } from 'vue';
import * as sliceAPI from '@/service/slice.js';
import { message } from 'ant-design-vue';
import { getCheckoutOptionsArray } from '@/common/options.js';

export function useSlideResult() {
  const resultData = ref({
    conditions: [],
    advice: ''
  });
  const resultVisible = ref(false);

  const loadResult = async (sliceId, slicePart) => {
    if (!sliceId) return;
    try {
      const [aiRes, res] = await Promise.all([
        sliceAPI.getAIResult(sliceId),
        sliceAPI.getResult(sliceId)
      ]);

      // Initialize conditions based on slicePart

      if (res.data) {
        const defaults = getInitialConditions(slicePart);

        resultData.value.conditions = defaults;
        resultData.value.advice = res.data.recommendation || '';
        // Actual merging of values needs specific logic based on options keys
      } else {
        resultData.value.conditions = getInitialConditions(slicePart);
        resultData.value.advice = '';
      }
      
      // Handle AI Result if needed, or merge it into resultData
      // Currently storing it in resultData if the user wants to access it
      if (aiRes.data) {
        resultData.value.aiResult = aiRes.data;
      }
    } catch (e) {
      console.error("Load result error", e);
    }
  };

  const getInitialConditions = (part) => {
    // This should return the array structure like 'simplifiedIllCondition' in reference
    // We might need to export this from options.js or reconstruct it
    return [
      { text: "总体诊断", key: "overall", value: "", options: "OverallOptions", componentType: "SingleRadio" },
      { text: "Placeholder Condition 1", key: "c1", value: [], options: "YouWuOptions", componentType: "CheckBox" }
    ];
  };

  const saveResult = async (sliceId, data) => {
    try {
      await sliceAPI.updateResult({ ...data, sliceId });
      message.success("保存成功");
      resultVisible.value = false;
    } catch (e) {
      message.error("保存失败");
    }
  };

  return {
    resultData,
    resultVisible,
    loadResult,
    saveResult
  };
}
