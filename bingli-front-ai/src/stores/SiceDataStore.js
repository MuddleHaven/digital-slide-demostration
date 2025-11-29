import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

export const useSliceDataStore = defineStore('sliceData', () => {

  const DiagnosisId = ref(null)
  const QualityId = ref(null)

  //主体布局
  const sliceList = ref(null)
  //当前选择
  const curIndex = ref(0)
   
  function setSliceList(value){
    sliceList.value = value;
  }

  function getSliceList(){
    return sliceList
  }

  return{
    sliceList,
    setSliceList,
    getSliceList,
    curIndex,
    DiagnosisId,
    QualityId
  }
},
{
  persist:true
}
)
