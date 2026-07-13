import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    roots: ['<rootDir>/packages/dockview'],
    modulePaths: ['<rootDir>/packages/dockview/src'],
    displayName: { name: 'dockview', color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/dockview/src/**/*.{js,jsx,ts,tsx}',
    ],
    setupFiles: [],
    setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    moduleNameMapper: {
        '^dockview-core$': '<rootDir>/packages/dockview-core/src/index.ts',
        '^dockview-enterprise$':
            '<rootDir>/packages/dockview-enterprise/src/index.ts',
    },
    modulePathIgnorePatterns: [],
    coverageDirectory: '<rootDir>/packages/dockview/coverage/',
    // testResultsProcessor inherited from root config
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.tsx?$': [
            '@swc/jest',
            {
                jsc: {
                    parser: { syntax: 'typescript', tsx: true },
                    transform: { react: { runtime: 'automatic' } },
                    target: 'es2021',
                },
            },
        ],
    },
};

export default config;
