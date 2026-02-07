module.exports = {
    root: true,
    parserOptions: {
        sourceType: 'module',
        project: [
            './tsconfig.eslint.json',
            './packages/*/tsconfig.json',
            './packages/dockview-vue/tsconfig.app.json'
        ],
        tsconfigRootDir: __dirname,
    },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    ignorePatterns: [
        'packages/docs/**',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/*.spec.*',
        '**/*.test.*',
        'dist/',
        'node_modules/',
        '*.scss'
    ],
    rules: {
        'no-case-declarations': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
        }],
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        'prefer-const': 'warn',
        '@typescript-eslint/no-var-requires': 'error',
    },
};
