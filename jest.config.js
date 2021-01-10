module.exports = {
  preset: 'ts-jest',
  testRegex: '/test/.*\\.test\\.*',
  "collectCoverage": true,
  "collectCoverageFrom": [
    "src/**/*.ts"
  ],
  "coveragePathIgnorePatterns": [
    "./test"
  ]
};
