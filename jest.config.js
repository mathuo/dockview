const baseConfig = require("./jest.config.base");

module.exports = {
    ...baseConfig,
    displayName: { name: "root", color: "blue" },
    projects: ["<rootDir>/packages/*/jest.config.js"],
    collectCoverage: true,
    collectCoverageFrom:[
        "<rootDir>/packages/*/src/**/*.{js,jsx,ts,tsx}",
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "<rootDir>packages/*/src/__tests__/",
    ],
    coverageDirectory: "coverage"
};
