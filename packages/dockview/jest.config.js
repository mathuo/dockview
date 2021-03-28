const { name } = require('./package');

const baseConfig = require('../../jest.config.base');

console.log('loaded');

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/packages/dockview'],
    modulePaths: ['<rootDir>/packages/dockview/src'],
    displayName: { name, color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/dockview/src/**/*.{js,jsx,ts,tsx}',
    ],
    setupFiles: [
        '<rootDir>/packages/dockview/src/__tests__/__mocks__/resizeObserver.js',
    ],
    coveragePathIgnorePatterns: ['/node_modules/'],
    modulePathIgnorePatterns: [
        '<rootDir>/packages/dockview/src/__tests__/__mocks__',
    ],
    coverageDirectory: '<rootDir>/packages/dockview/coverage/',
};
