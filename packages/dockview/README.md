<div align="center">
<h1>dockview</h1>

<p>Zero dependency layout manager supporting tabs, grids and splitviews with ReactJS support written in TypeScript</p>

</div>

---

[![npm version](https://badge.fury.io/js/dockview.svg)](https://www.npmjs.com/package/dockview)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=coverage)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/dockview)](https://bundlephobia.com/result?p=dockview)

##

Please see the website: https://dockview.dev

Want to inspect the latest deployment? Go to https://unpkg.com/browse/dockview@latest/

## Features

-   Simple splitviews, nested splitviews (i.e. gridviews) supporting full layout managment with
    dockable and tabular views
-   Extensive API support at the component level and view level
-   Themable and customizable
-   Serialization / deserialization support
-   Tabular docking and Drag and Drop support
-   Documentation and examples

This project was inspired by many popular IDE editors. Some parts of the core resizable panelling are inspired by code found in the VSCode codebase, [splitview](https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/splitview) and [gridview](https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/grid).

## Quick start

Dockview has a peer dependency on `react >= 16.8.0` and `react-dom >= 16.8.0`. You can install dockview from [npm](https://www.npmjs.com/package/dockview). Please see the [Getting Started Guide](https://mathuo.github.io/dockview/docs/).

```
npm install --save dockview
```

Within your project you must import or reference the stylesheet at `dockview/dist/styles/dockview.css` and attach a theme.

```css
@import '~dockview/dist/styles/dockview.css';
```

You should also attach a dockview theme to an element containing your components. For example:

```html
<body classname="dockview-theme-dark"></body>
```
