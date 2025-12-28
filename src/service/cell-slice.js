import request from './request.js'

export function getCellSliceList() {
  return request({
    url: '/tct/cellSliceList',
    method: 'get',
  })
}

export function getCellSliceDetail(slideName) {
  return request({
    url: '/tct/cellSliceDetail',
    method: 'get',
    params: { slideName },
  })
}

