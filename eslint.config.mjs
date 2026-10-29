import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    '.next/**',
    'coverage/**',
    'node_modules/**',
    'next-env.d.ts',
    // docs/ 是 GitHub Pages 静态站点，浏览器代码不走本项目的 TS 规则
    'docs/**',
  ]),
])
