// 肺组织特定选项
export const nsclcOptions = [
  { label: '腺癌', value: 10 },
  { label: '鳞癌', value: 20 }
];

export const sclcOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
];

export const neuroLungOptions = [
  { label: '类癌', value: 10 },
  { label: '非典型类癌', value: 20 },
  { label: '小细胞癌', value: 30 },
  { label: '大细胞神经内分泌癌', value: 40 }
];

export const aahOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
];

export const adenocarcinomaOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
];

export const tuberculosisOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
];

export const pneumoniaOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
];

export const interstitialPneumoniaOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
];

// export const colonResultOptions = ['非肿瘤性','癌前病变','恶性肿瘤'];
// export const lungResultOptions = ['非肿瘤性','癌前病变','恶性肿瘤'];
const lungResultOptions = [
  { label: '非肿瘤性', value: '非肿瘤性' },
  { label: '癌前病变', value: '癌前病变' },
  { label: '恶性肿瘤', value: '恶性肿瘤' }
]

// 肺组织疾病条件配置
export const lungConditions = [
  { key: 'result', text: "整体结果", componentType: 'SingleRadio', options: 'resultOptions', value: null, disabled: false },
  { key: 'non_small_lung_cancer', text: "非小细胞肺癌", componentType: 'SingleRadio', options: 'nsclcOptions', value: 0, disabled: false },
  { key: 'small_lung_cancer', text: "小细胞肺癌", componentType: 'CheckBox', options: 'sclcOptions', value: 0, disabled: false },
  { key: 'nens', text: "神经内分泌肿瘤", componentType: 'SingleRadio', options: 'neuroLungOptions', value: 0, disabled: false },
  { key: 'hyperplasia', text: "不典型腺瘤样增生(AAH)", componentType: 'CheckBox', options: 'aahOptions', value: 0, disabled: false },
  { key: 'ac', text: "原位腺癌", componentType: 'CheckBox', options: 'adenocarcinomaOptions', value: 0, disabled: false },
  { key: 'tuberculosis', text: "结核", componentType: 'CheckBox', options: 'tuberculosisOptions', value: 0, disabled: false },
  { key: 'non_specific_pneumonia', text: "非特异肺炎", componentType: 'CheckBox', options: 'pneumoniaOptions', value: 0, disabled: false },
  { key: 'interstitial_pneumonia', text: "间质性肺炎", componentType: 'CheckBox', options: 'interstitialPneumoniaOptions', value: 0, disabled: false },
];

// 肺组织条件映射
export const lungConditionKeys = [
  { key: 'result', index: 0, text: "整体结果", options: 'resultOptions', defaultValue: null },
  { key: 'non_small_lung_cancer', index: 1, text: "非小细胞肺癌", options: 'nsclcOptions', defaultValue: 0 },
  { key: 'small_lung_cancer', index: 2, text: "小细胞肺癌", options: 'sclcOptions', defaultValue: 0 },
  { key: 'nens', index: 3, text: "神经内分泌肿瘤", options: 'neuroLungOptions', defaultValue: 0 },
  { key: 'hyperplasia', index: 4, text: "不典型腺瘤样增生(AAH)", options: 'aahOptions', defaultValue: 0 },
  { key: 'ac', index: 5, text: "原位腺癌", options: 'adenocarcinomaOptions', defaultValue: 0 },
  { key: 'tuberculosis', index: 6, text: "结核", options: 'tuberculosisOptions', defaultValue: 0 },
  { key: 'non_specific_pneumonia', index: 7, text: "非特异肺炎", options: 'pneumoniaOptions', defaultValue: 0 },
  { key: 'interstitial_pneumonia', index: 8, text: "间质性肺炎", options: 'interstitialPneumoniaOptions', defaultValue: 0 },
];

// 肺组织诊断类型允许的选项映射
export const lungDiagnosisOptionsMap = {
  "恶性肿瘤": ["整体结果",'非小细胞肺癌', '小细胞肺癌', '神经内分泌肿瘤'],
  "癌前病变": ["整体结果",'不典型腺瘤样增生(AAH)', '原位腺癌'],
  "非肿瘤性": ["整体结果",'结核', '非特异肺炎', '间质性肺炎'],
};

export const lungOptions = {
  resultOptions: lungResultOptions,
  nsclcOptions,
  sclcOptions,
  neuroLungOptions,
  aahOptions,
  adenocarcinomaOptions,
  tuberculosisOptions,
  pneumoniaOptions,
  interstitialPneumoniaOptions
};