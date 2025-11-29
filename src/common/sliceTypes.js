// project options

// Slice status enum
export const SliceStatusEnum = Object.freeze({
  // Upload states
  UPLOADING: '1',
  UPLOAD_SUCCESS: '3',
  UPLOAD_FAILED: '5',

  // Parsing states
  PARSING: '11',
  PARSE_SUCCESS: '13',
  PARSE_FAILED: '15',

  // Processing states
  PROCESSING: '21',
  PROCESS_SUCCESS: '23',
  PROCESS_FAILED: '25',

  // Review states
  // REVIEWING: '31',
  REVIEWED: '41',
});

// Mapping from enum values to display text
export const sliceStatusEnumDic = {
  [SliceStatusEnum.UPLOADING]: '上传中',
  [SliceStatusEnum.UPLOAD_SUCCESS]: '上传成功',
  [SliceStatusEnum.UPLOAD_FAILED]: '上传失败',
  [SliceStatusEnum.PARSING]: '解析中',
  [SliceStatusEnum.PARSE_SUCCESS]: '未处理',
  [SliceStatusEnum.PARSE_FAILED]: '解析失败',
  [SliceStatusEnum.PROCESSING]: '处理中',
  [SliceStatusEnum.PROCESS_SUCCESS]: '待复核',
  [SliceStatusEnum.PROCESS_FAILED]: '处理失败',
  // [SliceStatusEnum.REVIEWING]: '复核中',
  [SliceStatusEnum.REVIEWED]: '已复核',
};

// slice quality options
export const sliceQualityOptions = [
  { value: '优', label: '优', },
  { value: '良', label: '良', },
  { value: '中', label: '中', },
  { value: '差', label: '差', },
]

// slice result options
export const sliceResultOptions = [
  { value: '非肿瘤性', label: '非肿瘤性', },
  { value: '癌前状态', label: '癌前状态', },
  { value: '癌前病变', label: '癌前病变', },
  { value: '恶性肿瘤', label: '恶性肿瘤', }
]

// Helper function to get status display text
export function getSliceStatusText(statusCode) {
  return sliceStatusEnumDic[statusCode] || '未知状态';
}

// slice status options
export const sliceStatusOptions = [
  SliceStatusEnum.PROCESSING,
  SliceStatusEnum.PROCESS_FAILED,
  SliceStatusEnum.PROCESS_SUCCESS,
  SliceStatusEnum.REVIEWED].map((value) => ({ value, label: getSliceStatusText(value), }));


// Helper function to check if slice is in a failure state
export function isSliceInFailureState(statusCode) {
  return [
    SliceStatusEnum.UPLOAD_FAILED,
    SliceStatusEnum.PARSE_FAILED,
  ].includes(statusCode);
}

export function isSliceParseProcessing(statusCode) {
  return [
    SliceStatusEnum.UPLOAD_SUCCESS,
    SliceStatusEnum.PARSING,
  ].includes(statusCode);
}

export function isSliceProcessing(statusCode) {
  return [
    SliceStatusEnum.UPLOAD_SUCCESS,
    SliceStatusEnum.PARSING,
    SliceStatusEnum.PARSE_SUCCESS,
    SliceStatusEnum.PROCESSING,
  ].includes(statusCode);
}

export function isSliceProcessed(statusCode) {
  return [
    SliceStatusEnum.PROCESS_SUCCESS,
    SliceStatusEnum.REVIEWED,
  ].includes(statusCode);
}
