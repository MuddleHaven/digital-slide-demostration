import Mock from 'mockjs'
import lsil from '../Slices/LSIL_2512678.json'
import slide2513763 from '../Slices/2513763.json'

const cellDetailByName = new Map([
  [lsil?.data?.slideName, lsil?.data],
  [slide2513763?.data?.slideName, slide2513763?.data],
])

const tileMetaByName = new Map([
  [lsil?.data?.slideName, { tileSize: 512, tileOverlap: 0, tileFormat: 'jpeg' }],
  [slide2513763?.data?.slideName, { tileSize: 1024, tileOverlap: 0, tileFormat: 'jpeg' }],
])

const buildCellListRecord = (detail) => {
  if (!detail?.slideName) return null
  return {
    slideName: detail.slideName,
    slideWidth: detail.slideWidth,
    slideHeight: detail.slideHeight,
    slideScale: detail.slideScale,
    slideTotalResult: detail.slideTotalResult,
    gradingPrompt: detail.gradingPrompt,
    inflaLevel: detail.inflaLevel,
    thumbnailUrl: `/Slices/${detail.slideName}/thumbnail.jpeg`,
  }
}

Mock.setup({
  timeout: '200-600',
})

Mock.mock(/\/tct\/cellSliceList(\?.*)?$/, 'get', () => {
  const records = Array.from(cellDetailByName.values())
    .map(buildCellListRecord)
    .filter(Boolean)

  return {
    code: 200,
    msg: 'ok',
    data: {
      records,
      total: records.length,
    },
  }
})

Mock.mock(/\/tct\/cellSliceDetail(\?.*)?$/, 'get', (options) => {
  const url = new URL(options.url, window.location.origin)
  const slideName = url.searchParams.get('slideName') || ''
  const detail = cellDetailByName.get(slideName) || null
  const tileMeta = tileMetaByName.get(slideName) || null

  return {
    code: 200,
    msg: 'ok',
    data: detail
      ? {
        ...detail,
        thumbnailUrl: `/Slices/${detail.slideName}/thumbnail.jpeg`,
        cellTile: {
          slideName: detail.slideName,
          width: detail.slideWidth,
          height: detail.slideHeight,
          ...tileMeta,
        },
      }
      : null,
  }
})

