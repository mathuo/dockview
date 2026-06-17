<div align="center">
<h1>dockview</h1>

<p>Zero dependency layout manager supporting tabs, groups, grids and splitviews</p>

</div>

---

[![npm version](https://badge.fury.io/js/dockview.svg)](https://www.npmjs.com/package/dockview)
[![npm](https://img.shields.io/npm/dm/dockview)](https://www.npmjs.com/package/dockview)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=coverage)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/dockview)](https://bundlephobia.com/result?p=dockview)

##

![](https://github.com/mathuo/dockview/blob/HEAD/packages/docs/static/img/splashscreenv2.png?raw=true)

Please see the website: https://dockview.dev

## Features

-   Serialization / deserialization with full layout management
-   Support for split-views, grid-views and 'dockable' views
-   Themeable and customizable
-   Tab and Group docking / Drag n' Drop
-   Touch & mobile support
-   Popout Windows
-   Floating Groups
-   Edge Groups
-   Tab Groups
-   Extensive API
-   Supports Shadow DOMs
-   High test coverage
-   Documentation website with live examples
-   Transparent builds and Code Analysis
-   Security at mind - verified publishing and builds through GitHub Actions

## Quick Start

`dockview` is the vanilla JavaScript / TypeScript package. Using a framework? Install the
matching bindings instead: [`dockview-react`](https://www.npmjs.com/package/dockview-react),
[`dockview-vue`](https://www.npmjs.com/package/dockview-vue) or
[`dockview-angular`](https://www.npmjs.com/package/dockview-angular).

Install from [npm](https://www.npmjs.com/package/dockview):

```
npm install dockview
```

Import the stylesheet:

```css
@import 'dockview/dist/styles/dockview.css';
```

Create a dockview instance:

```ts
import { DockviewComponent } from 'dockview';

const element = document.getElementById('app');

const dockview = new DockviewComponent(element, {
    createComponent: (options) => {
        switch (options.name) {
            case 'my-component':
                return {
                    init: (params) => {
                        params.containerElement.textContent = 'Hello World';
                    },
                };
        }
    },
});

dockview.addPanel({
    id: 'panel_1',
    component: 'my-component',
});
```

Apply a theme by adding a theme class (e.g. `dockview-theme-dark`) to a parent element.

See the [documentation](https://dockview.dev) for full examples.

Want to verify our builds? Go [here](https://www.npmjs.com/package/dockview#Provenance).
