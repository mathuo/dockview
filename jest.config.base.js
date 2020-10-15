const {join, normalize} = require("path");

const tsConfig = normalize(join(__dirname, "tsconfig.build.json"))

module.exports = {
    displayName: { name: "root" },
    preset: "ts-jest",
    projects: ["<rootDir>/packages/*/jest.config.js"],
    transform: {
        "^.+\\.tsx?$":"ts-jest"
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    globals: {
        "ts-jest": {
            tsConfig,
            experimental: true,
            compilerHost: true
        }
    }
}