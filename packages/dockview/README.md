<div align="center">
<h1>dockview</h1>

<p>React bindings for dockview — zero dependency layout manager supporting tabs, groups, grids and splitviews</p>

</div>

---

[![npm version](https://badge.fury.io/js/dockview.svg)](https://www.npmjs.com/package/dockview)
[![npm](https://img.shields.io/npm/dm/dockview)](https://www.npmjs.com/package/dockview)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=coverage)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/dockview)](https://bundlephobia.com/result?p=dockview)

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

Dockview has a peer dependency on `react >= 16.8.0` and `react-dom >= 16.8.0`. Install from [npm](https://www.npmjs.com/package/dockview):

```
npm install dockview
```

Import the stylesheet:

```css
@import 'dockview/dist/styles/dockview.css';
```

Apply a theme and render the component:

```tsx
import { DockviewReact } from 'dockview';

const components = {
    myComponent: (props) => <div>Hello World</div>,
};

function App() {
    return (
        <div className="dockview-theme-dark" style={{ height: '400px' }}>
            <DockviewReact
                components={components}
                onReady={(event) => {
                    event.api.addPanel({
                        id: 'panel_1',
                        component: 'myComponent',
                    });
                }}
            />
        </div>
    );
}
```

See the [documentation](https://dockview.dev) for full examples.

Want to verify our builds? Go [here](https://www.npmjs.com/package/dockview#Provenance).
