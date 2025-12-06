import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSliceStore = defineStore('slice', () => {
  const detailIds = ref([]);
  const slideListData = ref([]);

  // Initialize from storage
  const storedIds = sessionStorage.getItem('slice_detail_ids');
  if (storedIds) {
    try {
      detailIds.value = JSON.parse(storedIds);
    } catch (e) {
      console.error('Failed to parse stored detail ids', e);
    }
  }

  const storedList = sessionStorage.getItem('slice_list_data');
  if (storedList) {
    try {
      slideListData.value = JSON.parse(storedList);
    } catch (e) {
      console.error('Failed to parse stored slide list', e);
    }
  }

  const setDetailIds = (ids) => {
    detailIds.value = ids;
    sessionStorage.setItem('slice_detail_ids', JSON.stringify(ids));
  };

  const setSlideListData = (list) => {
    slideListData.value = list;
    sessionStorage.setItem('slice_list_data', JSON.stringify(list));
  };

  const clearDetailIds = () => {
    detailIds.value = [];
    slideListData.value = [];
    sessionStorage.removeItem('slice_detail_ids');
    sessionStorage.removeItem('slice_list_data');
  };

  return {
    detailIds,
    slideListData,
    setDetailIds,
    setSlideListData,
    clearDetailIds
  };
});
