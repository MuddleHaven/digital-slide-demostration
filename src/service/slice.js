import request from './request.js'
import requestQuality from './request-quality.js'

export function getProcessInfo() { //获取任务数量
  return request({
    url: '/slice/getProcessInfo',
    method: 'get',
  })
}

export function getSliceList(current, size) { //获取切片的分页数据
  return request({
    url: '/slice/getSliceList',
    method: 'get',
    params: { current, size }
  })
}

export function upload(formData) { //上传切片
  return request({
    url: '/slice/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function uploadQuality(formData) { //上传质控切片
  return requestQuality({
    url: '/slice/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function reUpload(sliceId) { //重新上传
  return request({
    url: '/slice/reUpload',
    method: 'post',
    params: { sliceId }
  })
}

export function cancelUpload(sliceId) { //取消上传
  return request({
    url: '/slice/cancelUpload',
    method: 'post',
    params: { sliceId }
  })
}

export function cancelUploads() { //批量取消上传
  return request({
    url: '/slice/cancelUploads',
    method: 'post',
  })
}

export function deleteSlices(sliceIds) { //删除切片
  return request({
    url: '/slice/deleteSlices',
    method: 'post',
    data: Array.isArray(sliceIds) ? sliceIds : [sliceIds]
  })
}

export function deleteQualitySlices(sliceIds) { //删除质控切片
  return requestQuality({
    url: '/slice/deleteSlices',
    method: 'post',
    data: Array.isArray(sliceIds) ? sliceIds : [sliceIds]
  })
}

export function setSliceStatusChulizhong(sliceIds) { //修改切片状态为“处理中”
  return request({
    url: '/slice/setSliceStatusChulizhong',
    method: 'post',
    data: Array.isArray(sliceIds) ? sliceIds : [sliceIds]
  })
}

export function querySlideData(params) { //条件查询切片列表
  return request({
    url: '/slice/querySlideData',
    method: 'get',
    params: params
  })
}

export function queryQualitySlideData(params) { //条件查询质控切片列表
  return requestQuality({
    url: '/slice/querySlideData',
    method: 'get',
    params: params
  })
}

export function getAIProcessProgress() { //获取AI处理进度
  return request({
    url: '/slice/getAIProcessProgress',
    method: 'get',
  })
}

export function getSliceFileNames() { //查询切片的名称
  return request({
    url: '/slice/getSliceFileNames',
    method: 'get',
  })
}

export function getQualitySliceFileNames() { //查询质控切片的名称
  return requestQuality({
    url: '/slice/getSliceFileNames',
    method: 'get',
  })
}


// Date uploadStartTime
// Date processStartTime
// Date processEndTime
// String status
// String sliceNo

export function getUploadProgress() { //查询上传进度
  return request({
    url: '/slice/getUploadProgress',
    method: 'get',
  })
}

export function getQualityUploadProgress() { //查询质控上传进度
  return requestQuality({
    url: '/slice/getUploadProgress',
    method: 'get',
  })
}

export function getSingleSliceData(sliceId) { //根据id获取切片数据
  return request({
    url: '/slice/getSingleSliceData',
    method: 'get',
    params: { sliceId }
  })
}

export function getQualitySingleSliceData(sliceId) { //根据id获取质控切片数据
  return requestQuality({
    url: '/slice/getSingleSliceData',
    method: 'get',
    params: { sliceId }
  })
}

// /diagnosis/getHeatmapCurve
/*
{
    "code": 200,
    "msg": "ok",
    "data": {
        "mainLabel": "中-低分化腺癌",
        "subLabel": "印戒细胞癌",
        "mainHeatmapStyle": 3,
        "subHeatmapStyle": 3,
        "heatmapRows": 96,
        "heatmapCols": 264,
        "mainHeatmap": {
            "id": 7,
            "insertTime": "2025-03-18 14:50:17",
            "lastUpdateTime": "2025-03-18 14:50:17",
            "sliceId": 3,
            "diagnosisId": 7,
            "type": 1,
            "data": "[{\"x\": 212, \"y\": 12, \"value\": 0.10391037527511633}, ]"
        },
        "subHeatmap": {
            "id": 8,
            "insertTime": "2025-03-18 14:50:17",
            "lastUpdateTime": "2025-03-18 14:50:17",
            "sliceId": 3,
            "diagnosisId": 7,
            "type": 2,
            "data": "[{\"x\": 212, \"y\": 13, \"value\": 0.05346167970903306,}]""
        },
        "curveList": [
            {
                "id": 98,
                "insertTime": "2025-03-18 14:50:17",
                "lastUpdateTime": "2025-03-18 14:50:17",
                "sliceId": 3,
                "diagnosisId": 7,
                "minX": 93607.07451908517,
                "minY": 6607.999999999999,
                "maxX": 96655.99999999999,
                "maxY": 11740.041235145822,
                "points": "[ [ 94625.00795120644, 6734.992048793543 ],]"
            }
        ],
        "curveNumContours": 14,
        "curveRows": 43008,
        "curveCols": 118272
    }
}
*/
export function getHeatmapCurve(sliceId) {
  //获取热力图和轮廓线数据
  return request({
    url: '/diagnosis/getHeatmapCurve',
    method: 'get',
    params: { sliceId }
  }).then(res => {
    const data = res.data;
    const heatMapData = data.mainHeatmap?.data;
    const otherHeatmapData = data.subHeatmap?.data;

    const curveList = data.mainCurveList || [];
    const subCurveList = data.subCurveList || [];

    let max_min_values = []
    let pointList = []

    for (let index = 0; index < curveList.length; index++) {
      const element = curveList[index];
      const minMaxObjc = {
        minX: element.minX,
        minY: element.minY,
        maxX: element.maxX,
        maxY: element.maxY
      }
      const pointsStr = element.points
      const points = JSON.parse(pointsStr)
      pointList.push(points)
      max_min_values.push(minMaxObjc)
    }

    let sub_max_min_values = []
    let sub_pointList = []

    for (let index = 0; index < subCurveList.length; index++) {
      const element = subCurveList[index];
      const minMaxObjc = {
        minX: element.minX,
        minY: element.minY,
        maxX: element.maxX,
        maxY: element.maxY
      }
      const pointsStr = element.points
      const points = JSON.parse(pointsStr)
      sub_pointList.push(points)
      sub_max_min_values.push(minMaxObjc)
    }

    return {
      code: res.code,
      msg: res.msg,
      heatmapData: {
        data: heatMapData,
        cols: data.heatmapCols,
        rows: data.heatmapRows,
        otherData: otherHeatmapData,
      },
      curveData: {
        pointList,
        max_min_values,
        num_contours: data.mainCurveNumContours,
        curveCols: data.curveCols,
        curveRows: data.curveRows,
      },
      subCurveData: {
        pointList: sub_pointList,
        max_min_values: sub_max_min_values,
        num_contours: data.subCurveNumContours,
        curveCols: data.curveCols,
        curveRows: data.curveRows,
      }
    }
  })
}
 //获取热力图数据
export function getHeatmapResult(sliceId) {
  return request({
    url: '/slice/getHeatmapResult',
    method: 'get',
    params: { sliceId }
  })
}
// 获取轮廓线数据
export function getCurveResult(sliceId) {
  return request({
    url: '/slice/getCurveResult',
    method: 'get',
    params: { sliceId }
  })
}

export function getAIQualityContours(sliceId) { //获取AI质量轮廓线数据
  // return request({
  //   url: '/slice/getQualityContours',
  //   method: 'get',
  //   params: { sliceId }
  // })
  // 预期返回格式:
  return Promise.resolve({
    code: 200,
    data: {
      curveCols: 6457,
      curveRows: 11160,
      curveList: [
        {
          points: "[ [ 2696, 5488 ], [ 2580, 5510 ], [ 2520, 5580 ], [ 2480, 5680 ], [ 2450, 5800 ], [ 2430, 5950 ], [ 2410, 6100 ], [ 2390, 6250 ], [ 2373, 6400 ], [ 2373, 6600 ], [ 2373, 6800 ], [ 2410, 6950 ], [ 2450, 7100 ], [ 2520, 7200 ], [ 2620, 7300 ], [ 2750, 7380 ], [ 2860, 7500 ], [ 2860, 7650 ], [ 2820, 7800 ], [ 2780, 7950 ], [ 2720, 8100 ], [ 2650, 8250 ], [ 2550, 8400 ], [ 2450, 8450 ], [ 2300, 8470 ], [ 2200, 8550 ], [ 2100, 8700 ], [ 2050, 8850 ], [ 2050, 9000 ], [ 2100, 9150 ], [ 2200, 9300 ], [ 2300, 9450 ], [ 2350, 9600 ], [ 2350, 9750 ], [ 2300, 9900 ], [ 2200, 10000 ], [ 2050, 10100 ], [ 1950, 10200 ], [ 1950, 10400 ], [ 2000, 10600 ], [ 2100, 10750 ], [ 2250, 10800 ], [ 2400, 10750 ], [ 2550, 10650 ], [ 2700, 10550 ], [ 2820, 10450 ], [ 2900, 10300 ], [ 2950, 10150 ], [ 3000, 10000 ], [ 3100, 9850 ], [ 3200, 9700 ], [ 3300, 9550 ], [ 3400, 9400 ], [ 3500, 9250 ], [ 3600, 9100 ], [ 3700, 8950 ], [ 3750, 8800 ], [ 3750, 8650 ], [ 3700, 8500 ], [ 3600, 8350 ], [ 3500, 8200 ], [ 3400, 8050 ], [ 3300, 7900 ], [ 3200, 7750 ], [ 3100, 7600 ], [ 3000, 7450 ], [ 2950, 7300 ], [ 2900, 7150 ], [ 2850, 7000 ], [ 2800, 6850 ], [ 2750, 6700 ], [ 2700, 6550 ], [ 2696, 5488 ] ]",
          type: "3",
        }
      ]
    }
  });
}

//关于annotations
export function getAnnos(sliceId) { //获取批注信息
  return request({
    url: '/anno/getAnnos',
    method: 'get',
    params: sliceId
  })
}

export function getQualityAnnos(sliceId) { //获取质量批注信息
  return requestQuality({
    url: '/anno/getAnnos',
    method: 'get',
    params: sliceId
  })
}

/**
 * @typedef InsertAnnoData
 * @property {number} id - 批注ID (update 时必填)
 * @property {number} sliceId - 切片ID
 * @property {string} content - 批注内容
 * @property {number} maxX - 批注最大X坐标
 * @property {number} minX - 批注最小X坐标
 * @property {number} minY - 批注最小Y坐标
 * @property {number} maxY - 批注最大Y坐标
 * @property {string} type - 批注类型
 * @property {object} jsonData - 批注数据
 * @property {number} jsonData.x - 批注左上角X坐标
 * @property {number} jsonData.y - 批注左上角Y坐标
 * @property {number} jsonData.w - 批注宽度
 * @property {number} jsonData.h - 批注高度
 */

/**
 * insert annotation
 * @param {InsertAnnoData} data 
 */
export function insertAnno(data) {
  return request({
    url: '/anno/insertAnno',
    method: 'post',
    data: data
  })
}

/**
 * update annotation  
 * @param {InsertAnnoData} data 
 */
export function updateAnno(data) { //修改批注
  return request({
    url: '/anno/updateAnno',
    method: 'post',
    data: data
  })
}

export function deleteAnno(data) { //删除批注
  return request({
    url: '/anno/deleteAnno',
    method: 'post',
    data: data
  })
}

// quality annotation 

/**
 * insert quality annotation
 * @param {InsertAnnoData} data 
 */
export function qualityInsertAnno(data) { //新增质量批注
  return requestQuality({
    url: '/anno/insertAnno',
    method: 'post',
    data: data
  })
}

/**
 * update quality annotation  
 * @param {InsertAnnoData} data 
 */
export function qualityUpdateAnno(data) {
  return requestQuality({
    url: '/anno/updateAnno',
    method: 'post',
    data: data
  })
}

/**
 * delete quality annotation  
 * @param {InsertAnnoData} data 
 */
export function qualityDeleteAnno(data) {
  return requestQuality({
    url: '/anno/deleteAnno',
    method: 'post',
    data: data
  })
}

//关于诊断报告:

export function updateResult(params) {
  return request({
    url: '/diagnosis/updateResult',
    method: 'post',
    params: params
  })
}

export function getResult(sliceId) { //获取诊断报告
  return request({
    url: '/diagnosis/getResult',
    method: 'get',
    params: { sliceId }
  })
}

/// 获取AI处理切片结果
export function getAIResult(sliceId) {
  return request({
    url: '/diagnosis/getAIResult',
    method: 'get',
    params: { sliceId }
  })
}

export function getPrintReport(sliceId) { //获取打印时候的预览数据
  return request({
    url: '/diagnosis/getPrintReport',
    method: 'get',
    params: sliceId
  })
}

export function exportPDF(data) { //导出为pdf
  return request({
    url: '/diagnosis/exportPDF',
    method: 'post',
    data: data
  })
}

//关于质控评价:

export function updateQCResult(data) { //更新质控评价
  return requestQuality({
    url: '/qualityCheck/updateQualityCheck',
    method: 'post',
    data: data
  })
}
/// 获取质控评价 (手动/已保存)
export function getQCResult(sliceId) { 
  return requestQuality({
    url: '/qualityCheck/getQualityCheck',
    method: 'get',
    params: { sliceId, type: 2 }
  })
}

/// 获取AI处理质控切片结果
export function getAIQCResult(sliceId) {
  return requestQuality({
    url: '/qualityCheck/getQualityCheck',
    method: 'get',
    params: { sliceId, type: 1 }
  })
}

//获取打印时候的预览数据
export function getQCPrintReport(sliceId) { 
  return requestQuality({
    url: '/qualityCheck/getPrintReport',
    method: 'get',
    params: { sliceId }
  })
}

export function exportQCPDF(data) { //导出为pdf
  return requestQuality({
    url: '/qualityCheck/exportPDF',
    method: 'post',
    data: data
  })
}

// 数据看板相关:
//整体:
export function getDepartmentSliceAccount() { //[科室]获取在职医生数目、切片总数、已处理、处理中和未处理切片数量、科室每个人上传数量的数据
  return request({
    url: '/slice/getDepartmentSliceAccount',
    method: 'get',
  })
}

export function getRecentSlicesByDepartment(type) { //获取科室近期处理的切片数量【可以改变时间段,type为week或者month】
  return request({
    url: '/slice/getRecentSlicesByDepartment',
    method: 'get',
    params: { type }
  })
}

export function getDiagnosisStatisticsByDepartment() { //获取科室累计切片类型统计和诊断结果统计
  return request({
    url: '/diagnosis/getDiagnosisStatisticsByDepartment',
    method: 'get',
  })
}

//个人:
export function getUserSliceAccountByUserId(userId) { //获取在职医生数目(1)、个人的：切片总数、已处理、处理中和未处理切片数量（科室每个人上传数量的数据字段为null）
  return request({
    url: '/slice/getUserSliceAccountByUserId',
    method: 'get',
    params: { userId }
  })
}

export function getDiagnosisResultListByUserId(userId) { //根据userId获取用户的近期处理结果
  return request({
    url: '/diagnosis/getDiagnosisResultListByUserId',
    method: 'get',
    params: { userId }
  })
}

export function getDiagnosisPDFByDiagnosisId(diagnosisId) { //根据diagnosisId获取诊断报告的pdf，用于查看近期处理结果中的pdf文档，返回url
  return request({
    url: '/diagnosis/getDiagnosisPDFByDiagnosisId',
    method: 'get',
    params: { diagnosisId }
  })
}

export function getRecentSlicesByUserId(userId, type) { //根据userId获取单个用户近期处理的切片数量【可以改变时间段,type为week或者month】
  return request({
    url: '/slice/getRecentSlicesByUserId',
    method: 'get',
    params: { userId, type }
  })
}

export function getDiagnosisStatisticsByUserId(userId) { //获取个人累计切片类型统计和分析结果统计
  return request({
    url: '/diagnosis/getDiagnosisStatisticsByUserId',
    method: 'get',
    params: { userId }
  })
}

export function getAIMetrics() { //获取AI性能指标
  return request({
    url: '/diagnosis/getAIMetrics',
    method: 'get',
  })
}

export function AIAnalyze(sliceIds) { //AI处理切片
  return request({
    url: '/slice/AIAnalysis',
    method: 'post',
    data: Array.isArray(sliceIds) ? sliceIds : [sliceIds]
  })
}
