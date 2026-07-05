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

// Defaults to the published `dockview` version, but can be overridden via the
// DOCKVIEW_VERSION env var to build the live examples against a specific
// (e.g. experimental/prerelease) build for testing — without committing a
// version that would break the normal docs build.
const DOCKVIEW_VERSION = process.env.DOCKVIEW_VERSION || version;
const USE_LOCAL_CDN = argv.slice(2).includes('--local');

console.log(`[buildTemplates] using dockview version: ${DOCKVIEW_VERSION}`);

const local = 'http://localhost:1111';

const BOILERPLATE_PATH_PREFIX = '/example-runner/';

const FRAMEWORK_BOILERPLATE = {
    react: 'dockview-react-boilerplate',
    typescript: 'dockview-typescript-boilerplate',
    vue: 'dockview-vue-boilerplate',
    angular: 'dockview-angular-boilerplate',
};

const DOCKVIEW_CDN = {
    react: {
        remote: {
            'dockview-core': `https://cdn.jsdelivr.net/npm/dockview-core@${DOCKVIEW_VERSION}`,
            dockview: `https://cdn.jsdelivr.net/npm/dockview@${DOCKVIEW_VERSION}`,
            'dockview-enterprise': `https://cdn.jsdelivr.net/npm/dockview-enterprise@${DOCKVIEW_VERSION}`,
            'dockview-react': `https://cdn.jsdelivr.net/npm/dockview-react@${DOCKVIEW_VERSION}`,
        },
        local: {
            'dockview-core': `${local}/dockview-core`,
            dockview: `${local}/dockview`,
            'dockview-enterprise': `${local}/dockview-enterprise`,
            'dockview-react': `${local}/dockview-react`,
        },
    },
    vue: {
        remote: {
            // dockview-core is resolved transitively (dockview-vue -> dockview
            // -> dockview-core); it is not imported directly by user code.
            'dockview-core': `https://cdn.jsdelivr.net/npm/dockview-core@${DOCKVIEW_VERSION}`,
            dockview: `https://cdn.jsdelivr.net/npm/dockview@${DOCKVIEW_VERSION}`,
            'dockview-enterprise': `https://cdn.jsdelivr.net/npm/dockview-enterprise@${DOCKVIEW_VERSION}`,
            'dockview-vue': `https://cdn.jsdelivr.net/npm/dockview-vue@${DOCKVIEW_VERSION}`,
        },
        local: {
            'dockview-core': `${local}/dockview-core`,
            dockview: `${local}/dockview`,
            'dockview-enterprise': `${local}/dockview-enterprise`,
            'dockview-vue': `${local}/dockview-vue`,
        },
    },
    typescript: {
        remote: {
            // dockview-core is resolved transitively (dockview -> dockview-core);
            // it is not imported directly by user code.
            'dockview-core': `https://cdn.jsdelivr.net/npm/dockview-core@${DOCKVIEW_VERSION}`,
            dockview: `https://cdn.jsdelivr.net/npm/dockview@${DOCKVIEW_VERSION}`,
            'dockview-enterprise': `https://cdn.jsdelivr.net/npm/dockview-enterprise@${DOCKVIEW_VERSION}`,
        },
        local: {
            'dockview-core': `${local}/dockview-core`,
            dockview: `${local}/dockview`,
            'dockview-enterprise': `${local}/dockview-enterprise`,
        },
    },
    angular: {
        remote: {
            // dockview-core is resolved transitively (dockview-angular ->
            // dockview -> dockview-core); it is not imported directly by user code.
            'dockview-core': `https://cdn.jsdelivr.net/npm/dockview-core@${DOCKVIEW_VERSION}`,
            dockview: `https://cdn.jsdelivr.net/npm/dockview@${DOCKVIEW_VERSION}`,
            'dockview-enterprise': `https://cdn.jsdelivr.net/npm/dockview-enterprise@${DOCKVIEW_VERSION}`,
            'dockview-angular': `https://cdn.jsdelivr.net/npm/dockview-angular@${DOCKVIEW_VERSION}`,
        },
        local: {
            'dockview-core': `${local}/dockview-core`,
            dockview: `${local}/dockview`,
            'dockview-enterprise': `${local}/dockview-enterprise`,
            'dockview-angular': `${local}/dockview-angular`,
        },
    },
};

const START_FILE = {
    react: 'app/index.tsx',
    typescript: 'app/index.ts',
    vue: 'app/index.ts',
    angular: 'app/index.ts',
};

const template = fs
    .readFileSync(path.join(__dirname, './template.html'))
    .toString();

function createIndexHTML(options) {
    return template
        .replace('{{title}}', options.title)
        .replace('{{appLocation}}', options.appLocation)
        .replace(/\{\{boilerplatePath\}\}/g, options.boilerplatePath)
        .replace('{{startFile}}', options.startFile)
        .replace('{{systemJsMap}}', JSON.stringify(options.systemJsMap))
        .replace('{{appElement}}', options.appElement || '')
        .replace('{{componentSelector}}', options.componentSelector)
        .replace('{{githubLink}}', options.githubUrl)
        .replace('{{codeSandboxLink}}', options.codeSandboxUrl);
}

const input_dir = path.join(__dirname, '../templates');
const output = path.join(__dirname, '../static/templates');

const COMPONENTS = ['dockview', 'splitview', 'gridview', 'paneview'];
const FRAMEWORKS = ['react', 'vue', 'typescript', 'angular'];

const COMPONENT_SELECTORS = {
    dockview: '.dv-dockview',
    splitview: '.dv-split-view-container',
    gridview: '.dv-grid-view',
    paneview: '.dv-pane-container',
};

const list = [];

const githubUrl =
    'https://github.com/mathuo/dockview/tree/master/packages/docs/templates';
const codeSandboxUrl =
    'https://codesandbox.io/p/sandbox/github/mathuo/dockview/tree/gh-pages/templates';

async function buildTemplates() {
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
                const srcPath = path.join(
                    componentDir,
                    folder,
                    framework,
                    'src'
                );
                const destPath = path.join(
                    output,
                    component,
                    folder,
                    framework,
                    'src'
                );

                // Copy all frameworks as-is (no special Angular transpilation)
                fs.copySync(srcPath, destPath);

                const templateGithubUrl = `${githubUrl}/${component}/${folder}/${framework}/src`;
                const templateCodeSandboxUrl = `${codeSandboxUrl}/${component}/${folder}/${framework}`;

                const boilerplateName = FRAMEWORK_BOILERPLATE[framework];
                const boilerplatePath = `${BOILERPLATE_PATH_PREFIX}${boilerplateName}/`;

                const systemJsMap =
                    DOCKVIEW_CDN[framework][USE_LOCAL_CDN ? 'local' : 'remote'];

                const html = createIndexHTML({
                    title: `Dockview | ${folder} ${framework}`,
                    appLocation: './src',
                    boilerplatePath: boilerplatePath,
                    startFile: START_FILE[framework],
                    systemJsMap: systemJsMap,
                    appElement:
                        framework === 'angular' ? '<app-root></app-root>' : '',
                    componentSelector: COMPONENT_SELECTORS[component],
                    githubUrl: templateGithubUrl,
                    codeSandboxUrl: templateCodeSandboxUrl,
                });
                fs.writeFileSync(
                    path.join(
                        output,
                        component,
                        folder,
                        framework,
                        'index.html'
                    ),
                    html
                );

                list.push({
                    name: `${component}/${framework}/${folder}`,
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
}

// Run the build
buildTemplates().catch(console.error);
