import fs from 'fs-extra';
import * as path from 'path';
import { argv } from 'process';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { version } = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, '..', '..', 'dockview', 'package.json')
    )
);

const REACT_VERSION = '18.2.0';
const VUE_VERSION = '3.4.21';
const ANGULAR_VERSION = '17.0.0';
const DOCKVIEW_VERSION = version; //'latest';;
const USE_LOCAL_CDN = argv.slice(2).includes('--local');

const local = 'http://localhost:1111';

const DOCKVIEW_CDN = {
    react: {
        remote: {
            dockview: `https://cdn.jsdelivr.net/npm/dockview@${DOCKVIEW_VERSION}/dist/dockview.esm.js`,
            'dockview/': `https://cdn.jsdelivr.net/npm/dockview@${DOCKVIEW_VERSION}/`,
        },
        local: {
            dockview: `${local}/dockview/dist/dockview.esm.js`,
            'dockview/': `${local}/dockview/`,
        },
    },
    vue: {
        remote: {
            'dockview-core': `https://cdn.jsdelivr.net/npm/dockview-core@${DOCKVIEW_VERSION}/dist/dockview-core.esm.js`,
            'dockview-core/': `https://cdn.jsdelivr.net/npm/dockview-core@${DOCKVIEW_VERSION}/`,
            'dockview-vue': `https://cdn.jsdelivr.net/npm/dockview-vue@${DOCKVIEW_VERSION}/dist/dockview-vue.es.js`,
            'dockview-vue/': `https://cdn.jsdelivr.net/npm/dockview-vue@${DOCKVIEW_VERSION}/`,
        },
        local: {
            'dockview-core': `${local}/dockview-core/dist/dockview-core.esm.js`,
            'dockview-core/': `${local}/dockview-core/`,
            'dockview-vue': `${local}/dockview-vue/dist/dockview-vue.es.js`,
            'dockview-vue/': `${local}/dockview-vue/`,
        },
    },
    typescript: {
        remote: {
            'dockview-core': `https://cdn.jsdelivr.net/npm/dockview-core@${DOCKVIEW_VERSION}/dist/dockview-core.esm.js`,
            'dockview-core/': `https://cdn.jsdelivr.net/npm/dockview-core@${DOCKVIEW_VERSION}/`,
        },
        local: {
            'dockview-core': `${local}/dockview-core/dist/dockview-core.esm.js`,
            'dockview-core/': `${local}/dockview-core/`,
        },
    },
    angular: {
        remote: {
            'dockview-core': `https://cdn.jsdelivr.net/npm/dockview-core@${DOCKVIEW_VERSION}/dist/dockview-core.esm.js`,
            'dockview-core/': `https://cdn.jsdelivr.net/npm/dockview-core@${DOCKVIEW_VERSION}/`,
            'dockview-angular': `https://cdn.jsdelivr.net/npm/dockview-angular@${DOCKVIEW_VERSION}/dist/dockview-angular.esm.js`,
            'dockview-angular/': `https://cdn.jsdelivr.net/npm/dockview-angular@${DOCKVIEW_VERSION}/`,
        },
        local: {
            'dockview-core': `${local}/dockview-core/dist/dockview-core.esm.js`,
            'dockview-core/': `${local}/dockview-core/`,
            'dockview-angular': `${local}/dockview-angular/dist/dockview-angular.esm.js`,
            'dockview-angular/': `${local}/dockview-angular/`,
        },
    },
};

const IMPORTS_PATHS = {
    react: {
        react: `https://esm.sh/react@${REACT_VERSION}`,
        'react-dom': `https://esm.sh/react-dom@${REACT_VERSION}`,
        'react-dom/client': `https://esm.sh/react-dom@${REACT_VERSION}`,
    },
    vue: {
        vue: `https://cdn.jsdelivr.net/npm/vue@${VUE_VERSION}/dist/vue.esm-browser.js`,
        '@vue/reactivity': `https://esm.sh/@vue/reactivity@${VUE_VERSION}`,
        'vue-sfc-loader': `https://cdn.jsdelivr.net/npm/vue3-sfc-loader@0.9.5/dist/vue3-sfc-loader.js`,
    },
    typescript: {},
    angular: {
        '@angular/core': `https://esm.sh/@angular/core@${ANGULAR_VERSION}`,
        '@angular/common': `https://esm.sh/@angular/common@${ANGULAR_VERSION}`,
        '@angular/platform-browser-dynamic': `https://esm.sh/@angular/platform-browser-dynamic@${ANGULAR_VERSION}`,
        '@angular/platform-browser': `https://esm.sh/@angular/platform-browser@${ANGULAR_VERSION}`,
        'rxjs': `https://esm.sh/rxjs@7.8.1`,
        'zone.js': `https://esm.sh/zone.js@0.14.3`,
    },
};

const template = fs
    .readFileSync(path.join(__dirname, './template.html'))
    .toString();

function createIndexHTML(options) {
    return template
        .replace('{{title}}', options.title)
        .replace(
            '{{importPaths}}',
            `${Object.entries(options.importPaths)
                .map(([key, value]) => `"${key}": "${value}"`)
                .join(',\n')}`
        )
        .replace('{{app}}', options.app)
        .replace('{{githubLink}}', options.githubUrl)
        .replace('{{codeSandboxLink}}', options.codeSandboxUrl)
}

const input_dir = path.join(__dirname, '../templates');
const output = path.join(__dirname, '../static/templates');

const COMPONENTS = ['dockview'];
const FRAMEWORKS = ['react', 'vue', 'typescript', 'angular'];

const list = [];

const githubUrl = "https://github.com/mathuo/dockview/tree/master/packages/docs/templates"
const codeSandboxUrl = "https://codesandbox.io/p/sandbox/github/mathuo/dockview/tree/gh-pages/templates"

for (const component of COMPONENTS) {
    const componentDir = path.join(input_dir, component);

    const templates = fs.readdirSync(componentDir);

    for (const folder of templates) {
        for (const framework of FRAMEWORKS) {
            if (
                !fs.existsSync(
                    path.join(componentDir, folder, framework, 'src')
                )
            ) {
                continue;
            }
            fs.copySync(
                path.join(componentDir, folder, framework, 'src'),
                path.join(output, component, folder, framework, 'src')
            );

            const templateGithubUrl = `${githubUrl}/${component}/${folder}/${framework}/src`
            const templateCodeSandboxUrl = `${codeSandboxUrl}/${component}/${folder}/${framework}`

            const template = createIndexHTML({
                title: `Dockview | ${folder} ${framework}`,
                app:
                    framework === 'react'
                        ? './src/index.tsx'
                        : framework === 'angular'
                        ? './src/index.ts'
                        : './src/index.ts',
                importPaths: {
                    ...IMPORTS_PATHS[framework],
                    ...DOCKVIEW_CDN[framework][
                        USE_LOCAL_CDN ? 'local' : 'remote'
                    ],
                },
                githubUrl: templateGithubUrl,
                codeSandboxUrl: templateCodeSandboxUrl
            });
            fs.writeFileSync(
                path.join(output, component, folder, framework, 'index.html'),
                template
            );

            list.push({
                name: `${framework}/${folder}`,
                path: path.join(component, folder, framework, 'index.html'),
            });
        }
    }
}

const index = `<div>${list
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => {
        return `<div><a href=${`/templates/${item.path}`}>${
            item.name
        }</a></div>`;
    })
    .join('\n')}</div>`;

fs.writeFileSync(path.join(output, 'index.html'), index);
