export const highoptions = ['高','中','低']
export const heavyoptions = ['轻','中','重']
export const neuraloptions = ['G1','G2','G3']
export const shangpiOptions = ['低级别','高级别']
export const xirouoptions = ['炎性','胃底腺','增生性','腺瘤性']
export const yinyangOptions = ['阴性','阳性']
export const resultOptions = ['非肿瘤性','癌前状态','癌前病变','恶性肿瘤']
export const YouWuOptions = [{label: '无', value: 0}, {label: '有', value: 10}]

export const allOptions = {
  "highoptions":highoptions,
  "heavyoptions":heavyoptions,
  "neuraloptions":neuraloptions,
  "shangpiOptions":shangpiOptions,
  "xirouoptions":xirouoptions,
  "yinyangOptions":yinyangOptions,
  'resultOptions':resultOptions,
  'YouWuOptions':YouWuOptions
}

import { lungConditions, lungConditionKeys, lungOptions, lungDiagnosisOptionsMap } from "./options-lung"
import { colonConditions, colonConditionKeys, colonOptions, colonDiagnosisOptionsMap } from "./options-colon"
import { stomachConditions, stomachConditionKeys, stomachOptions, stomachDiagnosisOptionsMap } from "./options-stomach"

const ResultOptions = [{label: '非肿瘤性', value: '非肿瘤性'}, {label: '癌前状态', value: '癌前状态'}, {label: '癌前病变', value: '癌前病变'}, {label: '恶性肿瘤', value: '恶性肿瘤'},  ]
const AcOptions = [{label: '高', value: 10}, {label: '中', value: 20}, {label: '低', value: 30} ]
const MacOptions = [{label: '阳性', value: 10}]
const SrccOptions = [{label: '阳性', value: 10}]
const NensOptions = [{label: 'G1', value: 10}, { label: 'G2', value: 20}, { label: 'G3', value: 30}]
const InChangeOptions = [{label: '低级别', value: 10}, {label: '高级别', value: 20}]
const ChronicInflammationOptions = [{label: '轻', value: 10}, {label: '中', value: 20}, {label: '重', value: 30}]
const AcuteInflammationOptions = [{label: '轻', value: 10}, {label: '中', value: 20}, {label: '重', value: 30}]
const AtrophyOptions = [{label: '轻', value: 10}, {label: '中', value: 20}, {label: '重', value: 30}]
const IntestinalizationOptions = [{label: '轻', value: 10}, {label: '中', value: 20}, {label: '重', value: 30}]
const HyperplasiaOptions = [{label: '轻', value: 10}, {label: '中', value: 20}, {label: '重', value: 30}]
const PolypusOptions = [{label: '炎性', value: 10}, {label: '胃底腺', value: 20}, {label: '增生性', value: 30}, {label: '腺瘤性', value: 40}]
const HpOptions = [{label: '阴性', value: 10}, {label: '阳性', value: 20}]

const SliceCheckoutOptions = Object.freeze({
  result: ResultOptions,
  ac: AcOptions,
  mac: MacOptions,
  srcc: SrccOptions,
  nens: NensOptions,
  inChange: InChangeOptions,
  chronicInflammation: ChronicInflammationOptions,
  acuteInflammation: AcuteInflammationOptions,
  atrophy: AtrophyOptions,
  intestinalization: IntestinalizationOptions,
  hyperplasia: HyperplasiaOptions,
  polypus: PolypusOptions,
  hp: HpOptions
})


export const SlicePart = Object.freeze({
  lung: 'lung',
  colon: 'colon',
  stomach: 'stomach'
})


export const AllPartConditions = {
  [SlicePart.lung]: lungConditions,
  [SlicePart.colon]: colonConditions,
  [SlicePart.stomach]: stomachConditions
}

const AllPartConditionKeys = {
  [SlicePart.lung]: lungConditionKeys,
  [SlicePart.colon]: colonConditionKeys,
  [SlicePart.stomach]: stomachConditionKeys
}

const AllPartDiagnosisOptionsMap = {
  [SlicePart.lung]: lungDiagnosisOptionsMap,
  [SlicePart.colon]: colonDiagnosisOptionsMap,
  [SlicePart.stomach]: stomachDiagnosisOptionsMap
}

/**
 * 获取切片的条件配置
 * @param {string} options 字符串，options的key值
 * @param {SlicePart} part 切片的部位，如 stomach lung colon
 * @returns {Array} 返回对应的选项数组
 */
export function getCheckoutOptionsArray(options, part = SlicePart.stomach) {
  console.log("----- getCheckoutOptionsArray", options, part);
  if (!options || !part) {
    return []
  }
  const AllPartOptions = {
    [SlicePart.lung]: lungOptions,
    [SlicePart.colon]: colonOptions,
    [SlicePart.stomach]: stomachOptions
  }
  const optionsDic = AllPartOptions[part];
  const optionsArray = optionsDic[options]

  console.log('---- getCheckoutOptionsArray', optionsDic, options, part, optionsArray);

  if (optionsArray === undefined) {
    return []
  }
  
  return optionsArray
}

/**
 * 获取切片的条件配置
 * @param {string} key 字符串，options的key值
 * @param {string} value 选项的值
 * @param {SlicePart} part 切片的部位，如 stomach
 * @returns {string} 返回对应的选项的label
 */
export function getCheckoutOptionLabel(options, value, part = SlicePart.stomach) {
  const optionsArr = getCheckoutOptionsArray(options, part)
  
  if (value === null) {
    return '无'
  }
  if (value === undefined) {
    return '无'
  }
  if (value === 0) {
    // return options == 'mac' || options == 'srcc' ? '阴性': '无'
  }
  const option = optionsArr.find(option => option.value === value)
  if (options == 'resultOptions') {
    return option ? option.label : (value ? value: '未知')
  }
  return option ? option.label : '未知'
}
