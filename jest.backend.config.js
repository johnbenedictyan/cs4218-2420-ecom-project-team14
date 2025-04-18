export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  transform: {},

  // which test to run
  testMatch: ["<rootDir>/**/*.test.js"],

  testPathIgnorePatterns: [
    "<rootDir>/client/",
    "<rootDir>/node_modules/",
    "<rootDir>/integration-tests/",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "middlewares/**", "helpers/**"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
