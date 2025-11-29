import { ref } from 'vue';
import * as sliceAPI from '@/service/slice.js';
import { message } from 'ant-design-vue';

export function useSlideQuality() {
  const qualityData = ref({
    quality: '',
    aiQuality: '',
    ranseErrors: [],
    qiepianErrors: [],
    makepianErrors: [],
    saomiaoErrors: []
  });
  const qualityVisible = ref(false);

  const loadQuality = async (sliceId) => {
    if (!sliceId) return;
    try {
      // Load AI Quality
      const aiRes = await sliceAPI.getAIQCResult(sliceId);
      const aiQ = aiRes.data ? aiRes.data.overallQuality : '';

      // Load Manual Quality
      const res = await sliceAPI.getQCResult(sliceId);
      
      // Initialize structure (simplified)
      qualityData.value = {
        quality: res.data ? res.data.overallQuality : '',
        aiQuality: aiQ,
        ranseErrors: [{ title: "染色差异", value: res.data?.stainingDiff || '无' }],
        qiepianErrors: [
            { title: "折叠", value: res.data?.folding || '无' },
            { title: "裂痕", value: res.data?.cracks || '无' }
            // ... others
        ],
        makepianErrors: [{ title: "标签不端正", value: res.data?.labelMisaligned || '无' }],
        saomiaoErrors: [{ title: "扫描模糊", value: res.data?.scanBlur || '无' }]
      };
      
    } catch (e) {
      console.error("Load quality error", e);
    }
  };

  const saveQuality = async (sliceId, data) => {
    try {
      await sliceAPI.updateQCResult({ ...data, sliceId });
      message.success("保存成功");
      qualityVisible.value = false;
    } catch (e) {
      message.error("保存失败");
    }
  };

  return {
    qualityData,
    qualityVisible,
    loadQuality,
    saveQuality
  };
}
