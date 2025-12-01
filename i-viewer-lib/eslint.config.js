import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  rules: {
    'ts/no-namespace': 'off',
  },
})
