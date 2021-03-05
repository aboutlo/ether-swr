module.exports = {
  preset: 'ts-jest',
  testRegex: '/test/.*\\.test\\.*',
  "collectCoverage": false,
  "collectCoverageFrom": [
    "src/**/*.ts"
  ],
  "coveragePathIgnorePatterns": [
    "./test"
  ]
};
