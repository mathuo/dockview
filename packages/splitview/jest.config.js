const { name } = require('./package');

const baseConfig = require('../../jest.config.base');

console.log('loaded');

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/packages/splitview'],
    modulePaths: ['<rootDir>/packages/splitview/src'],
    displayName: { name, color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/splitview/src/**/*.{js,jsx,ts,tsx}',
    ],
    setupFiles: [
        '<rootDir>/packages/splitview/src/__tests__/__mocks__/resizeObserver.js',
    ],
    coveragePathIgnorePatterns: ['/node_modules/'],
    modulePathIgnorePatterns: [
        '<rootDir>/packages/splitview/src/__tests__/__mocks__',
    ],
    coverageDirectory: 'coverage',
};
