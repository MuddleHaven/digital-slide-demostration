import { ref } from 'vue';
import * as sliceAPI from '@/service/slice.js';
import { message } from 'ant-design-vue';
import { AllPartConditions, SlicePart } from '@/common/options.js';

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
        
        // Merge saved result values into conditions
        updateValuesInConditions(res.data);
      } else {
        resultData.value.conditions = getInitialConditions(slicePart);
        resultData.value.advice = '';
      }
      
      // Handle AI Result if needed, or merge it into resultData
      // Currently storing it in resultData if the user wants to access it
      if (aiRes.data) {
        resultData.value.aiResult = aiRes.data;
        updateAiAnalyzeInConditions(aiRes.data);
      }
    } catch (e) {
      console.error("Load result error", e);
    }
  };

  const updateValuesInConditions = (data) => {
    if (!data) return;
    resultData.value.conditions.forEach(condition => {
      const key = condition.key;
      if (data[key] !== undefined) {
        condition.value = data[key];
      }
    });
  };

  const updateAiAnalyzeInConditions = (aiData) => {
    if (!aiData) return;

    resultData.value.conditions.forEach(condition => {
      const key = condition.key;
      if (aiData[key] !== undefined) {
        condition.AiAnalyze = aiData[key];
      }
    });
  };

  const getInitialConditions = (part) => {
    // Return deep copy of conditions based on part
    const conditions = AllPartConditions[part] || AllPartConditions[SlicePart.stomach];
    // Deep copy to avoid mutating the original exported array
    return JSON.parse(JSON.stringify(conditions));
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
