const {join, normalize} = require("path");

const tsconfig = normalize(join(__dirname, "tsconfig.test.json"))

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
            tsconfig,
            experimental: true,
            compilerHost: true
        }
    }
}