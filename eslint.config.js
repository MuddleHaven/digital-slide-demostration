import globals from "globals";
import pluginJs from "@eslint/js";
import pluginVue from "eslint-plugin-vue";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,vue}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    rules: {
      'indent': ['warn', 2], // 设置缩进为2个空格
      'no-console': 'warn', // console 警告
      'no-debugger': 'warn', // debugger 警告
      'no-undef': 'error', // 关闭未定义变量报错
      'no-unused-vars': 'warn', // 未使用变量作为警告而不是错误
      'vue/no-unused-vars': 'warn', // 未使用变量作为警告而不是错误
      'vue/valid-v-for': 'warn', // v-for 警告
      'no-empty': 'warn', // 空代码块作为警告而不是错误
      'vue/multi-word-component-names': 'off', // 关闭多词组件名报错
      'vue/require-v-for-key': 'warn', // v-for key 警告
      'vue/no-parsing-error': 'off', // 关闭解析错误
      'no-redeclare': 'warn', // 重复声明变量警告
      'no-prototype-builtins': 'off', // 关闭原型内置方法错误
      'no-useless-escape': 'warn', // 无用的转义字符警告
      'no-func-assign': 'warn', // 函数分配警告
      'no-fallthrough': 'warn', // switch 贯通警告
      // 添加其他规则
    }
  }
];