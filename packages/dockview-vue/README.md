<div align="center">
<h1>dockview-vue</h1>

<p>Vue 3 bindings for dockview — zero dependency layout manager supporting tabs, groups, grids and splitviews</p>

</div>

---

[![npm version](https://badge.fury.io/js/dockview-vue.svg)](https://www.npmjs.com/package/dockview-vue)
[![npm](https://img.shields.io/npm/dm/dockview-vue)](https://www.npmjs.com/package/dockview-vue)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=coverage)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/dockview-vue)](https://bundlephobia.com/result?p=dockview-vue)

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

Dockview-vue has a peer dependency on `vue >= 3.4.0`. Install from [npm](https://www.npmjs.com/package/dockview-vue):

```
npm install dockview-vue
```

Import the stylesheet:

```css
@import 'dockview-vue/dist/styles/dockview.css';
```

Use the component in a Vue SFC:

```vue
<template>
    <div class="dockview-theme-dark" style="height: 400px">
        <DockviewVue @ready="onReady">
            <template #myComponent="{ params }">
                <div>Hello World</div>
            </template>
        </DockviewVue>
    </div>
</template>

<script setup lang="ts">
import { DockviewVue } from 'dockview-vue';
import type { DockviewReadyEvent } from 'dockview-core';

function onReady(event: DockviewReadyEvent) {
    event.api.addPanel({
        id: 'panel_1',
        component: 'myComponent',
    });
}
</script>
```

See the [documentation](https://dockview.dev) for full examples.

Want to verify our builds? Go [here](https://www.npmjs.com/package/dockview-vue#Provenance).
