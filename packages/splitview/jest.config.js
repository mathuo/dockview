const package = require("./package");

const baseConfig = require("../../jest.config.base");

console.log("loaded");

module.exports = {
    ...baseConfig,
    roots: ["<rootDir>/packages/splitview"],
    modulePaths: ["<rootDir>/packages/splitview/src"],
    displayName: {name: package.name, color: "blue"},
    rootDir: "../../",
    collectCoverage: true,
    collectCoverageFrom:[
        "<rootDir>/packages/splitview/src/**/*.{js,jsx,ts,tsx}",
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "<rootDir>packages/splitview/src/__tests__/",
    ],
    coverageDirectory: "coverage"
}
