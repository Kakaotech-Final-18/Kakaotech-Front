import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginImport from 'eslint-plugin-import';
import configAirbnb from 'eslint-config-airbnb';
import configPrettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

export default [
  {
    files: ['**/*.{js,mjs,cjs,jsx}'], // 검사할 파일 확장자
  },
  {
    languageOptions: {
      ecmaVersion: 2021, // 최신 ECMAScript 문법 사용
      sourceType: 'module', // ES6 모듈 사용
      globals: globals.browser, // 브라우저 환경
      ecmaFeatures: {
        jsx: true, // JSX 사용
      },
    },
  },
  {
    plugins: {
      react: pluginReact,
      'jsx-a11y': pluginJsxA11y,
      import: pluginImport,
      prettier: pluginPrettier, // Prettier 플러그인 추가
    },
    rules: {
      'react/jsx-filename-extension': [1, { extensions: ['.jsx', '.js'] }], // JSX 확장자 설정
      'react/react-in-jsx-scope': 'off', // React 17+에서는 React import 필요 없음
      'import/prefer-default-export': 'off', // named export를 선호
      'react/prop-types': 'off', // prop-types 사용 강제하지 않음
      'react/jsx-props-no-spreading': 'off', // props spreading 허용
      'prettier/prettier': 'error', // Prettier 규칙을 ESLint에서 에러로 처리
    },
  },
  configAirbnb, // Airbnb 스타일 가이드 적용
  configPrettier, // Prettier와 충돌하는 규칙 비활성화
];
