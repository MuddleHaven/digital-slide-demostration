import '@annotorious/openseadragon/annotorious-openseadragon.css'
import { createOSDAnnotator } from '@annotorious/openseadragon'
import { computed, onUnmounted, ref, watch } from 'vue'
import { v4 as uuid } from 'uuid'

const DEFAULT_CATEGORY_LABELS = {
  'L-S': '低级别病变（单）',
  'L-M': '低级别病变（团）',
  'H-S': '高级别病变（单）',
  'H-M': '高级别病变（团）',
  TRI: '阴道滴虫',
  FUNGI: '白色念珠菌',
  CC: '线索细胞',
  ACTINO: '放线菌',
  HSV: '单纯疱疹病毒',
  MP: '鳞状化生细胞',
  ECC: '子宫颈管上皮细胞',
  AGC: '非典型腺细胞',
  SCC: '鳞状细胞癌',
}

const COLOR_PALETTE = [
  '#f5222d',
  '#fa541c',
  '#fa8c16',
  '#fadb14',
  '#52c41a',
  '#13c2c2',
  '#1677ff',
  '#2f54eb',
  '#722ed1',
  '#eb2f96',
  '#a0d911',
  '#faad14',
  '#36cfc9',
]

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function resolveTagKey(annotation) {
  const body = annotation?.body
  if (Array.isArray(body)) {
    const tag = body.find(b => b?.purpose === 'tagging' && typeof b?.value === 'string')
    if (tag?.value) return tag.value
  }
  if (body && typeof body === 'object' && typeof body.value === 'string') {
    return body.value
  }
  if (typeof annotation?._cellTagKey === 'string') return annotation._cellTagKey
  return null
}

function buildRectAnnotation({ x, y, w, h, tagKey, score, value }) {
  const body = [{ type: 'TextualBody', purpose: 'tagging', value: tagKey }]
  if (typeof score === 'number') body.push({ type: 'TextualBody', purpose: 'describing', value: `score:${score}` })
  if (typeof value === 'number') body.push({ type: 'TextualBody', purpose: 'describing', value: `value:${value}` })

  return {
    id: uuid(),
    body,
    target: {
      selector: {
        type: 'FragmentSelector',
        conformsTo: 'http://www.w3.org/TR/media-frags/',
        value: `xywh=pixel:${Math.round(x)},${Math.round(y)},${Math.round(w)},${Math.round(h)}`,
      },
    },
    _cellTagKey: tagKey,
  }
}

function getBoxFromArray(box) {
  if (!Array.isArray(box) || box.length < 4) return null
  const [x1, y1, x2, y2] = box
  if (![x1, y1, x2, y2].every(n => Number.isFinite(n))) return null
  const x = Math.min(x1, x2)
  const y = Math.min(y1, y2)
  const w = Math.abs(x2 - x1)
  const h = Math.abs(y2 - y1)
  if (w <= 0 || h <= 0) return null
  return { x, y, w, h }
}

function createImageLoader() {
  const cache = new Map()
  return (url) => {
    if (cache.has(url)) return cache.get(url)
    const promise = new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
      .catch(() => null)
    cache.set(url, promise)
    return promise
  }
}

export function useCellResultVisualization(viewerRef, cellDataRef) {
  const annotator = ref(null)
  const enabledCategoryKeys = ref([])
  const enabledDna = ref(false)
  const flashOverlayEl = ref(null)

  const categoryLabels = computed(() => DEFAULT_CATEGORY_LABELS)

  const colorByKey = computed(() => {
    const keys = Object.keys(categoryLabels.value)
    const map = new Map()
    keys.forEach((k, idx) => map.set(k, COLOR_PALETTE[idx % COLOR_PALETTE.length]))
    map.set('DNA', '#ff4d4f')
    return map
  })

  const categories = computed(() => {
    const data = cellDataRef?.value
    return data?.categories && typeof data.categories === 'object' ? data.categories : {}
  })

  const dnaRes = computed(() => {
    const data = cellDataRef?.value
    return data?.DNARes && typeof data.DNARes === 'object' ? data.DNARes : null
  })

  const cellNum = computed(() => {
    const data = cellDataRef?.value
    return Number.isFinite(data?.cellNum) ? data.cellNum : null
  })

  const initAnnotator = () => {
    if (annotator.value || !viewerRef?.value) return
    annotator.value = createOSDAnnotator(viewerRef.value, {
      drawingEnabled: false,
      autoSave: false,
      userSelectAction: 'NONE',
      readOnly: true,
      style: (annotation) => {
        const key = resolveTagKey(annotation)
        const stroke = colorByKey.value.get(key) || '#1677ff'
        return {
          stroke,
          strokeWidth: 1,
          fill: 'rgba(0,0,0,0)',
        }
      },
    })
  }

  const clearFlashOverlay = () => {
    const viewer = viewerRef?.value
    if (!viewer || !flashOverlayEl.value) return
    try {
      viewer.removeOverlay(flashOverlayEl.value)
    } catch (_) {
    }
    flashOverlayEl.value = null
  }

  const flashBox = (box, color = '#ff4d4f') => {
    const viewer = viewerRef?.value
    if (!viewer) return
    const b = getBoxFromArray(box)
    if (!b) return

    clearFlashOverlay()

    const el = document.createElement('div')
    el.style.border = `2px solid ${color}`
    el.style.background = 'rgba(0,0,0,0)'
    el.style.boxSizing = 'border-box'
    el.style.pointerEvents = 'none'

    const rect = viewer.viewport.imageToViewportRectangle(b.x, b.y, b.w, b.h)
    viewer.addOverlay({ element: el, location: rect })
    flashOverlayEl.value = el
  }

  const goToBox = (box, { padding = 1.3, minZoom = null } = {}) => {
    const viewer = viewerRef?.value
    if (!viewer) return
    const b = getBoxFromArray(box)
    if (!b) return

    const cx = b.x + b.w / 2
    const cy = b.y + b.h / 2
    const side = Math.max(b.w, b.h) * padding
    const x = cx - side / 2
    const y = cy - side / 2

    const rect = viewer.viewport.imageToViewportRectangle(x, y, side, side)
    viewer.viewport.fitBounds(rect, true)

    if (typeof minZoom === 'number') {
      const z = viewer.viewport.getZoom()
      if (z < minZoom) {
        const center = viewer.viewport.imageToViewportCoordinates(cx, cy)
        viewer.viewport.zoomTo(minZoom, center, true)
      }
    }
  }

  const renderAnnotations = async () => {
    initAnnotator()
    if (!annotator.value) return

    annotator.value.clearAnnotations()

    const activeKeys = new Set(enabledCategoryKeys.value || [])
    const showDna = !!enabledDna.value

    const annos = []

    for (const key of activeKeys) {
      const cat = categories.value?.[key]
      const boxes = Array.isArray(cat?.boxes) ? cat.boxes : []
      const scores = Array.isArray(cat?.scores) ? cat.scores : []
      for (let i = 0; i < boxes.length; i++) {
        const b = getBoxFromArray(boxes[i])
        if (!b) continue
        const score = Number.isFinite(scores[i]) ? scores[i] : null
        annos.push(buildRectAnnotation({ ...b, tagKey: key, score }))
      }
    }

    if (showDna && dnaRes.value) {
      const bboxes = Array.isArray(dnaRes.value?.bboxes) ? dnaRes.value.bboxes : []
      for (let i = 0; i < bboxes.length; i++) {
        const item = bboxes[i]
        const b = getBoxFromArray(item?.box)
        if (!b) continue
        const value = Number.isFinite(item?.value) ? item.value : null
        annos.push(buildRectAnnotation({ ...b, tagKey: 'DNA', value }))
      }
    }

    const batchSize = 400
    for (let i = 0; i < annos.length; i++) {
      annotator.value.addAnnotation(annos[i])
      if (i > 0 && i % batchSize === 0) {
        await new Promise(r => requestAnimationFrame(r))
      }
    }
  }

  const imageLoader = createImageLoader()
  const thumbnailCache = new Map()

  const getTileUrl = (tileMeta, level, x, y) => {
    const slideName = tileMeta?.slideName
    const format = tileMeta?.tileFormat || 'jpeg'
    return `/Slices/${slideName}/${level}/${x}_${y}.${format}`
  }

  const createBoxThumbnail = async (box, { size = 96, padding = 1.5 } = {}) => {
    const data = cellDataRef?.value
    const tileMeta = data?.cellTile
    if (!tileMeta?.slideName || !Number.isFinite(tileMeta?.width) || !Number.isFinite(tileMeta?.height)) return null

    const b = getBoxFromArray(box)
    if (!b) return null

    const minLevel = typeof tileMeta.minLevel === 'number' ? tileMeta.minLevel : 0
    const maxLevel = typeof tileMeta.maxLevel === 'number' ? tileMeta.maxLevel : 0
    const level = clamp(maxLevel - 4, minLevel, maxLevel)
    const scale = 2 ** (level - maxLevel)

    const levelW = Math.ceil(tileMeta.width * scale)
    const levelH = Math.ceil(tileMeta.height * scale)

    const cx = (b.x + b.w / 2) * scale
    const cy = (b.y + b.h / 2) * scale
    const side = Math.max(b.w, b.h) * padding * scale

    const left = clamp(cx - side / 2, 0, Math.max(0, levelW - side))
    const top = clamp(cy - side / 2, 0, Math.max(0, levelH - side))

    const tileSize = tileMeta.tileSize || 256
    const tileX0 = Math.floor(left / tileSize)
    const tileY0 = Math.floor(top / tileSize)
    const tileX1 = Math.floor((left + side - 1) / tileSize)
    const tileY1 = Math.floor((top + side - 1) / tileSize)

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const destScale = size / side

    for (let ty = tileY0; ty <= tileY1; ty++) {
      for (let tx = tileX0; tx <= tileX1; tx++) {
        const url = getTileUrl(tileMeta, level, tx, ty)
        const img = await imageLoader(url)
        if (!img) continue

        const tileLeft = tx * tileSize
        const tileTop = ty * tileSize

        const srcX = clamp(left - tileLeft, 0, img.width)
        const srcY = clamp(top - tileTop, 0, img.height)
        const srcMaxX = clamp(left + side - tileLeft, 0, img.width)
        const srcMaxY = clamp(top + side - tileTop, 0, img.height)
        const srcW = srcMaxX - srcX
        const srcH = srcMaxY - srcY
        if (srcW <= 0 || srcH <= 0) continue

        const destX = ((tileLeft + srcX) - left) * destScale
        const destY = ((tileTop + srcY) - top) * destScale
        const destW = srcW * destScale
        const destH = srcH * destScale

        ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, destW, destH)
      }
    }

    return canvas.toDataURL('image/jpeg', 0.85)
  }

  const getBoxThumbnail = async (key, box, options = {}) => {
    const data = cellDataRef?.value
    const slideName = data?.cellTile?.slideName || data?.slideName || ''
    const cacheKey = `${slideName}|${key}|${box?.join?.(',') || ''}|${options?.size || 96}`
    if (thumbnailCache.has(cacheKey)) return thumbnailCache.get(cacheKey)
    const promise = createBoxThumbnail(box, options)
    thumbnailCache.set(cacheKey, promise)
    return promise
  }

  watch(
    () => [viewerRef?.value, cellDataRef?.value, enabledCategoryKeys.value, enabledDna.value],
    () => {
      if (!viewerRef?.value || !cellDataRef?.value) return
      renderAnnotations()
    },
    { deep: false }
  )

  onUnmounted(() => {
    clearFlashOverlay()
    if (annotator.value) {
      annotator.value.clearAnnotations()
      annotator.value = null
    }
  })

  return {
    categoryLabels,
    colorByKey,
    categories,
    dnaRes,
    cellNum,
    enabledCategoryKeys,
    enabledDna,
    renderAnnotations,
    goToBox,
    flashBox,
    getBoxThumbnail,
  }
}
