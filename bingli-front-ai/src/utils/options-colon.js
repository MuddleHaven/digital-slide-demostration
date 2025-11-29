// 肠组织特定选项
export const adenocarcinomaOptions = [
  { label: '腺瘤样腺癌', value: 10 },
  { label: '黏液腺癌', value: 20 },
  { label: '其他腺癌', value: 30 }
];

export const neuroIntestineOptions = [
  { label: 'G1', value: 10 },
  { label: 'G2', value: 20 },
  { label: 'G3', value: 30 }
];

export const gistOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
];

export const lymphomaOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
];

// 腺瘤类型选项
export const adenomaTypeOptions = [
  { label: '管状腺瘤', value: 10 },
  { label: '绒毛状腺瘤', value: 20 },
  { label: '管状绒毛状腺瘤', value: 30 }
];

// 锯齿状病变选项
export const serratedLesionOptions = [
  { label: '增生性息肉', value: 10 },
  { label: '传统锯齿状腺瘤', value: 20 },
  { label: '广基锯齿状病变', value: 30 },
  { label: '广基锯齿状病变(伴异型增生)', value: 40 }
];

// 炎症相关选项
export const nonSpecificColitisOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
];

export const ibdOptions = [
  { label: '溃疡性结肠炎', value: 10 },
  { label: '克罗恩病', value: 20 }
];

const colonResultOptions = [
  { label: '非肿瘤性', value: '非肿瘤性' },
  { label: '癌前病变', value: '癌前病变' },
  { label: '恶性肿瘤', value: '恶性肿瘤' }
];

// 肠组织疾病条件配置
export const colonConditions = [
  { key: 'result', text: "整体结果", componentType: 'SingleRadio', options: 'resultOptions', value: null, disabled: false },
  { key: 'ac', text: "腺癌", componentType: 'SingleRadio', options: 'adenocarcinomaOptions', value: 0, disabled: false },
  { key: 'nens', text: "神经内分泌肿瘤", componentType: 'SingleRadio', options: 'neuroIntestineOptions', value: 0, disabled: false },
  { key: 'stromal_tumor', text: "胃肠道间质瘤", componentType: 'CheckBox', options: 'gistOptions', value: 0, disabled: false },
  { key: 'lymphoma', text: "淋巴瘤", componentType: 'CheckBox', options: 'lymphomaOptions', value: 0, disabled: false },
  { key: 'ordinary_adenoma', text: "普通腺瘤", componentType: 'SingleRadio', options: 'adenomaTypeOptions', value: 0, disabled: false },
  { key: 'serrated_lesions', text: "锯齿状病变", componentType: 'SingleRadio', options: 'serratedLesionOptions', value: 0, disabled: false },
  { key: 'non_specific_pneumonia', text: "非特异性肠炎", componentType: 'CheckBox', options: 'nonSpecificColitisOptions', value: 0, disabled: false },
  { key: 'inflammatory_bowel_disease', text: "炎症性肠病", componentType: 'SingleRadio', options: 'ibdOptions', value: 0, disabled: false },
];

// 肠组织条件映射
export const colonConditionKeys = [
  { key: 'result', index: 0, text: "整体结果", options: 'resultOptions', defaultValue: null },
  { key: 'ac', index: 1, text: "腺癌", options: 'adenocarcinomaOptions', defaultValue: 0 },
  { key: 'nens', index: 2, text: "神经内分泌肿瘤", options: 'neuroIntestineOptions', defaultValue: 0 },
  { key: 'stromal_tumor', index: 3, text: "胃肠道间质瘤", options: 'gistOptions', defaultValue: 0 },
  { key: 'lymphoma', index: 4, text: "淋巴瘤", options: 'lymphomaOptions', defaultValue: 0 },
  { key: 'ordinary_adenoma', index: 5, text: "普通腺瘤", options: 'adenomaTypeOptions', defaultValue: 0 },
  { key: 'serrated_lesions', index: 6, text: "锯齿状病变", options: 'serratedLesionOptions', defaultValue: 0 },
  { key: 'non_specific_pneumonia', index: 7, text: "非特异性肠炎", options: 'nonSpecificColitisOptions', defaultValue: 0 },
  { key: 'inflammatory_bowel_disease', index: 8, text: "炎症性肠病", options: 'ibdOptions', defaultValue: 0 },
];

// 肠组织诊断类型允许的选项映射
export const colonDiagnosisOptionsMap = {
  "恶性肿瘤": ["整体结果",'腺癌', '神经内分泌肿瘤', '胃肠道间质瘤', '淋巴瘤'],
  "癌前病变": ["整体结果",'普通腺瘤', '锯齿状病变'],
  "非肿瘤性": ["整体结果",'非特异性肠炎', '炎症性肠病'],
};

export const colonOptions = {
  resultOptions: colonResultOptions,
  adenocarcinomaOptions,
  neuroIntestineOptions,
  gistOptions,
  lymphomaOptions,
  adenomaTypeOptions,
  serratedLesionOptions,
  nonSpecificColitisOptions,
  ibdOptions,
};