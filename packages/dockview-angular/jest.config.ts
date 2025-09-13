import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'jest-preset-angular',
    roots: ['<rootDir>/packages/dockview-angular'],
    modulePaths: ['<rootDir>/packages/dockview-angular/src'],
    displayName: { name: 'dockview-angular', color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/dockview-angular/src/**/*.{js,jsx,ts,tsx}',
        '!<rootDir>/packages/dockview-angular/src/**/__tests__/**',
        '!<rootDir>/packages/dockview-angular/src/**/index.ts',
        '!<rootDir>/packages/dockview-angular/src/public-api.ts',
    ],
    setupFilesAfterEnv: [
        '<rootDir>/packages/dockview-angular/src/__tests__/setup-jest.ts'
    ],
    coveragePathIgnorePatterns: ['/node_modules/'],
    modulePathIgnorePatterns: [
        '<rootDir>/packages/dockview-angular/src/__tests__/__mocks__',
        '<rootDir>/packages/dockview-angular/src/__tests__/__test_utils__',
    ],
    coverageDirectory: '<rootDir>/packages/dockview-angular/coverage/',
    testResultsProcessor: 'jest-sonar-reporter',
    testEnvironment: 'jsdom',
    testMatch: [
        '<rootDir>/packages/dockview-angular/src/**/*.spec.ts',
        '<rootDir>/packages/dockview-angular/src/**/*.test.ts'
    ],
    transformIgnorePatterns: [
        'node_modules/(?!(.*\\.mjs$|@angular|rxjs))'
    ],
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.spec.json',
            stringifyContentPathRegex: '\\.(html|svg)$',
        },
    },
};

export default config;
