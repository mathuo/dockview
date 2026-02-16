<div align="center">
<h1>dockview</h1>

<p>Zero dependency layout manager supporting tabs, groups, grids and splitviews. Supports React, Vue, Angular and Vanilla TypeScript</p>

</div>

---

[![npm version](https://badge.fury.io/js/dockview-core.svg)](https://www.npmjs.com/package/dockview-core)
[![npm](https://img.shields.io/npm/dm/dockview-core)](https://www.npmjs.com/package/dockview-core)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=coverage)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/dockview-core)](https://bundlephobia.com/result?p=dockview-core)

##

![](packages/docs/static/img/splashscreen.gif)

Please see the website: https://dockview.dev

## Features

-   Serialization / deserialization with full layout management
-   Support for split-views, grid-views and 'dockable' views
-   Themeable and customizable
-   Tab and Group docking / Drag n' Drop
-   Popout Windows
-   Floating Groups
-   Extensive API
-   Supports Shadow DOMs
-   High test coverage
-   Documentation website with live examples
-   Transparent builds and Code Analysis
-   Security at mind - verified publishing and builds through GitHub Actions

## Packages

| Package | Description | Version |
| --- | --- | --- |
| [`dockview-core`](https://www.npmjs.com/package/dockview-core) | Core layout engine — zero dependencies, vanilla TypeScript | [![npm version](https://badge.fury.io/js/dockview-core.svg)](https://www.npmjs.com/package/dockview-core) |
| [`dockview`](https://www.npmjs.com/package/dockview) | React bindings (peer: `react` ≥16.8) | [![npm version](https://badge.fury.io/js/dockview.svg)](https://www.npmjs.com/package/dockview) |
| [`dockview-vue`](https://www.npmjs.com/package/dockview-vue) | Vue 3 bindings (peer: `vue` ≥3.4) | [![npm version](https://badge.fury.io/js/dockview-vue.svg)](https://www.npmjs.com/package/dockview-vue) |
| [`dockview-angular`](https://www.npmjs.com/package/dockview-angular) | Angular bindings (peer: `@angular/core` ≥21) | [![npm version](https://badge.fury.io/js/dockview-angular.svg)](https://www.npmjs.com/package/dockview-angular) |
| [`dockview-react`](https://www.npmjs.com/package/dockview-react) | Re-export of `dockview` for migration convenience | [![npm version](https://badge.fury.io/js/dockview-react.svg)](https://www.npmjs.com/package/dockview-react) |

## Installation

```bash
npm install dockview          # React
npm install dockview-vue      # Vue
npm install dockview-angular  # Angular
npm install dockview-core     # Vanilla TypeScript
```

## Quick Start (React)

```tsx
import { DockviewReact } from 'dockview';
import 'dockview/dist/styles/dockview.css';

const components = {
    default: (props) => <div>Hello {props.params.title}</div>,
};

function App() {
    const onReady = (event) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: { title: 'World' },
        });
    };

    return (
        <DockviewReact
            className="dockview-theme-dark"
            onReady={onReady}
            components={components}
        />
    );
}
```

For Vue and Angular examples see the [documentation](https://dockview.dev).

## Development

This project is an [NX](https://nx.dev) monorepo using [Yarn v1](https://classic.yarnpkg.com) workspaces.

```bash
yarn install    # Install dependencies
yarn build      # Build all packages
yarn test       # Run tests
yarn lint       # Run ESLint
yarn format     # Run Prettier
```

Build order is managed automatically by NX:

```
dockview-core → dockview → dockview-react
dockview-core → dockview-vue
dockview-core → dockview-angular
```

## Contributing

Contributions are welcome! Please open an [issue](https://github.com/mathuo/dockview/issues) or submit a pull request.

## License

MIT — see [LICENSE](./LICENSE) for details.

---

Want to verify our builds? Go [here](https://www.npmjs.com/package/dockview#user-content-provenance).
