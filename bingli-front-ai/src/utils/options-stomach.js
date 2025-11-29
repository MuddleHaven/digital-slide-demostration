// 胃组织特定选项
export const highoptions = [
  { label: '高', value: 10 },
  { label: '中', value: 20 },
  { label: '低', value: 30 }
]

export const heavyoptions = [
  { label: '轻', value: 10 },
  { label: '中', value: 20 },
  { label: '重', value: 30 }
]

export const neuraloptions = [
  { label: 'G1', value: 10 },
  { label: 'G2', value: 20 },
  { label: 'G3', value: 30 }
]

export const shangpiOptions = [
  { label: '低级别', value: 10 },
  { label: '高级别', value: 20 }
]

export const xirouoptions = [
  { label: '炎性', value: 10 },
  { label: '胃底腺', value: 20 },
  { label: '增生性', value: 30 },
  { label: '腺瘤性', value: 40 }
]

export const yinyangOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
]

export const resultOptions = [
  { label: '非肿瘤性', value: '非肿瘤性' },
  { label: '癌前状态', value: '癌前状态' },
  { label: '癌前病变', value: '癌前病变' },
  { label: '恶性肿瘤', value: '恶性肿瘤' }
]

export const stomachResultOptions = resultOptions

// 胃组织疾病条件配置
export const stomachConditions = [
  { key: 'result', text: "整体结果", componentType: 'SingleRadio', options: 'resultOptions', value: '', disabled: false, AiAnalyze: "" },
  { key: 'ac', text: "腺癌", componentType: 'SingleRadio', options: 'highoptions', value: 0, disabled: false, AiAnalyze: "" },
  { key: 'mac', text: "粘液腺癌", componentType: 'CheckBox', options: 'yinyangOptions', value: 0, disabled: false, AiAnalyze: "" },
  { key: 'srcc', text: "印戒细胞癌", componentType: 'CheckBox', options: 'yinyangOptions', value: 0, disabled: false, AiAnalyze: "" },
  { key: 'nens', text: "神经内分泌肿瘤", componentType: 'SingleRadio', options: 'neuraloptions', value: 0, disabled: false, AiAnalyze: "" },
  { key: 'inChange', text: "上皮内瘤变", componentType: 'SingleRadio', options: 'shangpiOptions', value: 0, disabled: false, AiAnalyze: "" },
  { key: 'chronicInflammation', text: "慢性炎", componentType: 'SingleRadio', options: 'heavyoptions', value: 0, disabled: false, AiAnalyze: "" },
  { key: 'acuteInflammation', text: "急性炎", componentType: 'SingleRadio', options: 'heavyoptions', value: 0, disabled: false, AiAnalyze: "" },
  { key: 'atrophy', text: "萎缩", componentType: 'SingleRadio', value: 0, options: 'heavyoptions', disabled: false, AiAnalyze: "" },
  { key: 'intestinalization', text: "肠化", componentType: 'SingleRadio', options: 'heavyoptions', value: 0, disabled: false, AiAnalyze: "" },
  { key: 'hyperplasia', text: "增生", componentType: 'SingleRadio', options: 'heavyoptions', value: 0, disabled: false, AiAnalyze: "" },
  { key: 'polypus', text: "息肉", componentType: 'SingleRadio', options: 'xirouoptions', value: 0, disabled: false, AiAnalyze: "" },
  { key: 'hp', text: "HP", componentType: 'CheckBox', options: 'yinyangOptions', value: 0, disabled: false, AiAnalyze: "" },
];

// 胃组织条件映射
export const stomachConditionKeys = [
  { key: 'result', index: 0, text: "整体结果", options: 'resultOptions', defaultValue: null },
  { key: 'ac', index: 1, text: "腺癌", options: 'highoptions', defaultValue: 0 },
  { key: 'mac', index: 2, text: "粘液腺癌", options: 'yinyangOptions', defaultValue: 0 },
  { key: 'srcc', index: 3, text: "印戒细胞癌", options: 'yinyangOptions', defaultValue: 0 },
  { key: 'nens', index: 4, text: "神经内分泌肿瘤", options: 'neuraloptions', defaultValue: 0 },
  { key: 'inChange', index: 5, text: "上皮内瘤变", options: 'shangpiOptions', defaultValue: 0 },
  { key: 'chronicInflammation', index: 6, text: "慢性炎", options: 'heavyoptions', defaultValue: 0 },
  { key: 'acuteInflammation', index: 7, text: "急性炎", options: 'heavyoptions', defaultValue: 0 },
  { key: 'atrophy', index: 8, text: "萎缩", options: 'heavyoptions', defaultValue: 0 },
  { key: 'intestinalization', index: 9, text: "肠化", options: 'heavyoptions', defaultValue: 0 },
  { key: 'hyperplasia', index: 10, text: "增生", options: 'heavyoptions', defaultValue: 0 },
  { key: 'polypus', index: 11, text: "息肉", options: 'xirouoptions', defaultValue: 0 },
  { key: 'hp', index: 12, text: "HP", options: 'yinyangOptions', defaultValue: 0 },
];

// 胃组织诊断类型允许的选项映射
export const stomachDiagnosisOptionsMap = {
  "恶性肿瘤": null, // null 表示所有选项都可用
  "癌前病变": ["整体结果","上皮内瘤变", "慢性炎", "萎缩", "肠化", "增生", "息肉", "HP", "整体结果"],
  "癌前状态": ["整体结果","慢性炎", "萎缩", "肠化", "息肉", "HP", "整体结果"],
  "非肿瘤性": ["整体结果","急性炎", "增生", "息肉", "HP", "整体结果"]
};


export const stomachOptions = {
  resultOptions: stomachResultOptions,
  highoptions,
  yinyangOptions,
  neuraloptions,
  shangpiOptions,
  heavyoptions,
  xirouoptions
};