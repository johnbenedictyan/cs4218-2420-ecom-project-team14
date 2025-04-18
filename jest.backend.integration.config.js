export default {
  // display name
  displayName: "backend integration",

  // when testing backend
  testEnvironment: "node",

  transform: {},

  // which test to run
  testMatch: ["<rootDir>/integration-tests/**/*.test.js"],

  testPathIgnorePatterns: ["<rootDir>/client/", "<rootDir>/node_modules/"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "middlewares/**"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
