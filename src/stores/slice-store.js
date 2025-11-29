import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSliceStore = defineStore('slice', () => {
  const detailIds = ref([]);

  // Initialize from storage
  const storedIds = sessionStorage.getItem('slice_detail_ids');
  if (storedIds) {
    try {
      detailIds.value = JSON.parse(storedIds);
    } catch (e) {
      console.error('Failed to parse stored detail ids', e);
    }
  }

  const setDetailIds = (ids) => {
    detailIds.value = ids;
    sessionStorage.setItem('slice_detail_ids', JSON.stringify(ids));
  };

  const clearDetailIds = () => {
    detailIds.value = [];
    sessionStorage.removeItem('slice_detail_ids');
  };

  return {
    detailIds,
    setDetailIds,
    clearDetailIds
  };
});
