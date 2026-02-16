<div align="center">
<h1>dockview-angular</h1>

<p>Angular bindings for dockview — zero dependency layout manager supporting tabs, groups, grids and splitviews</p>

</div>

---

[![npm version](https://badge.fury.io/js/dockview-angular.svg)](https://www.npmjs.com/package/dockview-angular)
[![npm](https://img.shields.io/npm/dm/dockview-angular)](https://www.npmjs.com/package/dockview-angular)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=coverage)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/dockview-angular)](https://bundlephobia.com/result?p=dockview-angular)

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

Dockview-angular has a peer dependency on `@angular/core >= 21`. Install from [npm](https://www.npmjs.com/package/dockview-angular):

```
npm install dockview-angular
```

Import the stylesheet in your `styles.css` or `angular.json`:

```css
@import 'dockview-angular/dist/dockview.css';
```

Use the component in your Angular template:

```typescript
import { Component } from '@angular/core';
import { DockviewModule } from 'dockview-angular';
import { DockviewReadyEvent } from 'dockview-core';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [DockviewModule],
    template: `
        <div class="dockview-theme-dark" style="height: 400px">
            <dockview-angular
                [components]="components"
                (ready)="onReady($event)"
            ></dockview-angular>
        </div>
    `,
})
export class AppComponent {
    components = {
        myComponent: /* your panel component */,
    };

    onReady(event: DockviewReadyEvent) {
        event.api.addPanel({
            id: 'panel_1',
            component: 'myComponent',
        });
    }
}
```

See the [documentation](https://dockview.dev) for full examples.

Want to verify our builds? Go [here](https://www.npmjs.com/package/dockview-angular#Provenance).
