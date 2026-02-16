<div align="center">
<h1>dockview-core</h1>

<p>Framework-agnostic core layout engine — zero dependencies, vanilla TypeScript. Supports tabs, groups, grids and splitviews</p>

</div>

---

[![npm version](https://badge.fury.io/js/dockview-core.svg)](https://www.npmjs.com/package/dockview-core)
[![npm](https://img.shields.io/npm/dm/dockview-core)](https://www.npmjs.com/package/dockview-core)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=coverage)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/dockview-core)](https://bundlephobia.com/result?p=dockview-core)

##

![](https://github.com/mathuo/dockview/blob/HEAD/packages/docs/static/img/splashscreen.gif?raw=true)

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

## Quick Start

Install from [npm](https://www.npmjs.com/package/dockview-core):

```
npm install dockview-core
```

Import the stylesheet:

```css
@import 'dockview-core/dist/styles/dockview.css';
```

Create a dockview instance:

```ts
import { DockviewComponent } from 'dockview-core';

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

Apply a theme to a parent element:

```html
<div id="app" class="dockview-theme-dark" style="height: 400px;"></div>
```

See the [documentation](https://dockview.dev) for full examples.

Want to verify our builds? Go [here](https://www.npmjs.com/package/dockview-core#Provenance).
