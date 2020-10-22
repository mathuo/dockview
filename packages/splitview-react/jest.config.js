const package = require("./package");

const baseConfig = require("../../jest.config.base");

console.log("loaded")

module.exports = {
    ...baseConfig,
    roots: ["<rootDir>/packages/splitview-react"],
    modulePaths: ["<rootDir>/packages/splitview-react/src"],
    displayName: {name: package.name, color: "blue"},
    rootDir: "../../",
    collectCoverageFrom:[
        "<rootDir>/packages/splitview-react/src/**/*.{js,jsx,ts,tsx}",
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "<rootDir>packages/splitview-react/src/__tests__/",
    ],
    coverageDirectory: "coverage"
}