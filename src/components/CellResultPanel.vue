<template>
  <div class="panel-root" :class="{ open: open }">
    <div class="panel-toggle">
      <a-button type="primary" size="small" @click="open = !open">
        {{ open ? '收起结果' : '展开结果' }}
      </a-button>
    </div>

    <div v-if="open" class="panel-body">
      <div class="panel-header">
        <div class="panel-title">细胞结果</div>
        <div class="panel-subtitle">
          <span v-if="cellNum !== null">细胞总数：{{ cellNum }}</span>
        </div>
      </div>

      <a-tabs v-model:activeKey="activeTab" size="small" class="tab-container">
        <a-tab-pane key="categories" tab="Categories">
          <div class="section">
            <div class="section-title">
              <span>颜色对应</span>
              <a-button type="link" size="small" @click="legendAll = !legendAll">
                {{ legendAll ? '只看常用' : '显示全部' }}
              </a-button>
            </div>
            <div class="legend">
              <div
                v-for="item in legendItems"
                :key="item.key"
                class="legend-item"
              >
                <a-tag :color="item.color">{{ item.key }}</a-tag>
                <span class="legend-label">{{ item.label }}</span>
                <span class="legend-count">({{ item.count }})</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span>框显示</span>
              <span class="section-hint">默认全部显示</span>
            </div>
            <div class="category-switches">
              <div v-for="c in categoryList" :key="c.key" class="category-row">
                <div class="category-left">
                  <span class="color-dot" :style="{ backgroundColor: c.color }"></span>
                  <span class="category-name">{{ c.key }}</span>
                  <span class="category-label">{{ c.label }}</span>
                </div>
                <div class="category-right">
                  <span class="category-count">{{ c.count }}</span>
                  <span class="category-pill" :style="{ backgroundColor: c.color }">显示</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span>缩略图</span>
              <span class="section-hint">点击定位对应框</span>
            </div>
            <div class="thumb-controls">
              <a-select
                v-model:value="selectedCategory"
                :options="categoryOptions"
                size="small"
                style="width: 100%"
                placeholder="选择类别"
              />
            </div>

            <div class="thumb-grid" :style="{ maxHeight: thumbGridMaxHeight + 'px' }">
              <div
                v-for="(item, idx) in selectedThumbItems"
                :key="item.key"
                class="thumb-item"
                @click="handleThumbClick(item)"
              >
                <div class="thumb-img">
                  <img v-if="thumbUrlByKey[item.key]" :src="thumbUrlByKey[item.key]" />
                  <div v-else class="thumb-placeholder"></div>
                </div>
                <div class="thumb-meta">
                  <span class="thumb-index">#{{ idx + 1 }}</span>
                  <span v-if="typeof item.score === 'number'" class="thumb-score">{{ item.score.toFixed(3) }}</span>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="dna" tab="DNARes">
          <div class="section">
            <div class="section-title">
              <span>DNA 结果</span>
            </div>
            <div class="dna-result">{{ dnaRes?.result || '-' }}</div>
          </div>

          <div class="section">
            <div class="section-title">
              <span>框显示</span>
              <span class="section-hint">默认全部显示</span>
            </div>
            <div class="dna-toggle">
              <div class="dna-left">
                <span class="color-dot" :style="{ backgroundColor: dnaColor }"></span>
                <span class="category-name">DNA</span>
              </div>
              <div class="dna-right">
                <span class="category-count">{{ dnaCount }}</span>
                <span class="category-pill" :style="{ backgroundColor: dnaColor }">显示</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span>缩略图</span>
              <span class="section-hint">点击定位对应框</span>
            </div>
            <div class="thumb-grid" :style="{ maxHeight: thumbGridMaxHeight + 'px' }">
              <div
                v-for="(item, idx) in dnaThumbItems"
                :key="item.key"
                class="thumb-item"
                @click="handleThumbClick(item)"
              >
                <div class="thumb-img">
                  <img v-if="thumbUrlByKey[item.key]" :src="thumbUrlByKey[item.key]" />
                  <div v-else class="thumb-placeholder"></div>
                </div>
                <div class="thumb-meta">
                  <span class="thumb-index">#{{ idx + 1 }}</span>
                  <span v-if="typeof item.value === 'number'" class="thumb-score">{{ item.value.toFixed(3) }}</span>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useCellResultVisualization } from '@/composables/use-cell-result-visualization'

const props = defineProps({
  viewer: { type: Object, default: null },
  cellData: { type: Object, default: null },
})

const open = ref(true)
const activeTab = ref('categories')
const legendAll = ref(false)
const selectedCategory = ref(null)
const thumbUrlByKey = ref({})
const thumbGridMaxHeight = 520
const thumbTaskId = ref(0)

const viewerRef = computed(() => props.viewer)
const cellDataRef = computed(() => props.cellData)

const {
  categoryLabels,
  colorByKey,
  categories,
  dnaRes,
  cellNum,
  enabledCategoryKeys,
  enabledDna,
  goToBox,
  flashBox,
  getBoxThumbnail,
} = useCellResultVisualization(viewerRef, cellDataRef)

const categoryList = computed(() => {
  const obj = categories.value || {}
  const list = Object.keys(obj).map((key) => {
    const boxes = Array.isArray(obj[key]?.boxes) ? obj[key].boxes : []
    return {
      key,
      label: categoryLabels.value[key] || key,
      color: colorByKey.value.get(key) || '#1677ff',
      count: boxes.length,
    }
  })
  list.sort((a, b) => b.count - a.count)
  return list
})

const legendItems = computed(() => {
  const list = categoryList.value
  if (legendAll.value) return list
  return list.slice(0, 3)
})

const categoryOptions = computed(() => categoryList.value.map(c => ({ label: `${c.key}（${c.count}）`, value: c.key })))

const dnaCount = computed(() => {
  const b = dnaRes.value?.bboxes
  return Array.isArray(b) ? b.length : 0
})

const dnaColor = computed(() => colorByKey.value.get('DNA') || '#ff4d4f')

const selectedThumbItems = computed(() => {
  const key = selectedCategory.value
  if (!key) return []
  const cat = categories.value?.[key]
  const boxes = Array.isArray(cat?.boxes) ? cat.boxes : []
  const scores = Array.isArray(cat?.scores) ? cat.scores : []
  const limit = boxes.length
  const items = []
  for (let i = 0; i < limit; i++) {
    items.push({
      key: `${key}-${i}`,
      tagKey: key,
      box: boxes[i],
      score: Number.isFinite(scores[i]) ? scores[i] : null,
      color: colorByKey.value.get(key) || '#1677ff',
    })
  }
  return items
})

const dnaThumbItems = computed(() => {
  const bboxes = Array.isArray(dnaRes.value?.bboxes) ? dnaRes.value.bboxes : []
  const limit = bboxes.length
  const items = []
  for (let i = 0; i < limit; i++) {
    items.push({
      key: `DNA-${i}`,
      tagKey: 'DNA',
      box: bboxes[i]?.box,
      value: Number.isFinite(bboxes[i]?.value) ? bboxes[i].value : null,
      color: dnaColor.value,
    })
  }
  return items
})

const handleThumbClick = (item) => {
  if (!item?.box) return
  goToBox(item.box, { padding: 2.0 })
  flashBox(item.box, item.color)
}

const ensureThumbs = async (items) => {
  const taskId = ++thumbTaskId.value
  const nextMap = { ...thumbUrlByKey.value }

  const concurrency = 4
  let cursor = 0

  const worker = async () => {
    while (cursor < items.length && taskId === thumbTaskId.value) {
      const idx = cursor++
      const it = items[idx]
      if (!it?.key || nextMap[it.key]) continue
      const url = await getBoxThumbnail(it.key, it.box, { size: 96, padding: 1.6 })
      if (taskId !== thumbTaskId.value) return
      if (url) nextMap[it.key] = url
      if (idx % 24 === 0) {
        thumbUrlByKey.value = { ...nextMap }
        await new Promise(r => requestAnimationFrame(r))
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  if (taskId === thumbTaskId.value) {
    thumbUrlByKey.value = { ...nextMap }
  }
}

watch(selectedThumbItems, (items) => {
  ensureThumbs(items)
}, { immediate: true })

watch(dnaThumbItems, (items) => {
  if (activeTab.value !== 'dna') return
  ensureThumbs(items)
}, { immediate: true })

watch(activeTab, (tab) => {
  if (tab === 'dna') {
    ensureThumbs(dnaThumbItems.value)
  } else if (tab === 'categories') {
    ensureThumbs(selectedThumbItems.value)
  }
})

const syncOverlayVisibility = () => {
  if (activeTab.value === 'dna') {
    enabledCategoryKeys.value = []
    enabledDna.value = true
  } else {
    enabledDna.value = false
    enabledCategoryKeys.value = categoryList.value.map(i => i.key)
  }
}

onMounted(() => {
  if (!selectedCategory.value && categoryList.value.length > 0) {
    selectedCategory.value = categoryList.value[0].key
  }
  syncOverlayVisibility()
})

watch(() => categoryList.value.map(i => i.key).join(','), () => {
  const list = categoryList.value
  if (!Array.isArray(list) || list.length === 0) return
  const exists = list.some(i => i.key === selectedCategory.value)
  if (!exists) {
    selectedCategory.value = list[0].key
  }
  syncOverlayVisibility()
})

watch(activeTab, () => {
  syncOverlayVisibility()
})
</script>

<style scoped>
.panel-root {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 380px;
  pointer-events: none;
  z-index: 120;
}

.panel-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  pointer-events: auto;
}

.panel-body {
  position: absolute;
  top: 52px;
  right: 12px;
  bottom: 12px;
  width: 356px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
}

.panel-body :deep(.ant-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-body :deep(.ant-tabs-content-holder) {
  flex: 1 1 auto;
  overflow: auto;
}

.panel-body :deep(.ant-tabs-content) {
  height: 100%;
}

.tab-container {
  height: 40px;
  padding: 8px 12px;
}

.panel-header {
  padding: 10px 12px 6px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
}

.panel-subtitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  margin-top: 2px;
}

.section {
  padding: 10px 12px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 8px;
}

.section-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.legend {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-label {
  color: rgba(0, 0, 0, 0.85);
}

.legend-count {
  color: rgba(0, 0, 0, 0.45);
}

.category-switches {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.category-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.category-name {
  font-weight: 600;
  font-size: 12px;
  flex: 0 0 auto;
}

.category-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.category-count {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
}

.thumb-controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.thumb-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  overflow: auto;
  padding-right: 4px;
}

.thumb-item {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
}

.thumb-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-placeholder {
  width: 60%;
  height: 60%;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.08);
}

.thumb-meta {
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.thumb-index {
  color: rgba(0, 0, 0, 0.65);
}

.thumb-score {
  color: rgba(0, 0, 0, 0.85);
  font-variant-numeric: tabular-nums;
}

.dna-result {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.dna-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dna-left, .dna-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  padding: 0 8px;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  user-select: none;
}
</style>
