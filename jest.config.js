module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testEnvironment: "jsdom",
  collectCoverageFrom: ["**/*.{ts,tsx}", "!**/node_modules/**"],
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$":
      "<rootDir>/src/__tests__/__mocks__/styleMock.js",
  },
  testMatch: [
    "<rootDir>/src/__tests__/**/*.spec.ts",
    "<rootDir>/src/__tests__/**/*.spec.tsx",
  ],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setupTests.ts"],
};
