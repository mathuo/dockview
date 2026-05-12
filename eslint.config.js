const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
    {
        ignores: [
            'packages/docs/**',
            '**/__mocks__/**',
            '**/dist/**',
            '**/.rollup.cache/**',
            '**/build/**',
            '**/node_modules/**',
            '**/*.scss',
            '**/*.vue',
            '**/*.timestamp-*.mjs',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                sourceType: 'module',
                project: [
                    './tsconfig.eslint.json',
                    './packages/*/tsconfig.json',
                    './packages/dockview-vue/tsconfig.app.json',
                ],
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            'no-case-declarations': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            'prefer-const': 'warn',
            // Replacements for the old @typescript-eslint/ban-types (removed
            // in v8). The previous config disabled ban-types wholesale, so
            // preserve that by turning off each split-out rule.
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-wrapper-object-types': 'off',
            // Newly part of the v8 recommended set; was effectively off
            // before. Demote to warn rather than gate CI on it.
            '@typescript-eslint/no-unused-expressions': 'warn',
            // Successor to @typescript-eslint/no-var-requires (which the
            // old config had as error). Stricter — also flags non-var
            // require() calls; demote to warn until those are cleaned up.
            '@typescript-eslint/no-require-imports': 'warn',
        },
    },
);
