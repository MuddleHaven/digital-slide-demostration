// /dict/getSliceDiagnosisDict

import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '../utils/request'; // Adjust the path based on your project structure

export const useDictionaryStore = defineStore('dictionary', () => {
  const dictionary = ref({})
  const loading = ref(false)
  const error = ref(null)

  async function fetchDictionary() {
    loading.value = true
    try {
      const response = await request({
        url: '/dict/getSliceDiagnosisDict',
        method: 'get',
      })
      dictionary.value = await response.json()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return {
    dictionary,
    loading,
    error,
    fetchDictionary
  }
})