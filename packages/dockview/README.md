<div align="center">
<h1>dockview</h1>

<p>Zero dependency layout manager supporting tabs, grids and splitviews with ReactJS support</p>

</div>

---

![stability-experimental](https://img.shields.io/badge/stability-experimental-orange.svg)
[![npm version](https://badge.fury.io/js/dockview.svg)](https://www.npmjs.com/package/dockview)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=coverage)](https://sonarcloud.io/dashboard?id=mathuo_dockview)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status)](https://sonarcloud.io/dashboard?id=mathuo_dockview)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/dockview)](https://bundlephobia.com/result?p=dockview)

##

A zero dependency layout manager based on the layering of split-view components with ReactJS support.
- View the live demo [here](https://mathuo.github.io/dockview/).
- Storybook demo [here](https://mathuo.github.io/dockview/output/storybook-static).
- Code examples [here](https://github.com/mathuo/dockview/tree/master/packages/dockview-demo/src/stories).
- Generated TypeDocs can be found [here](https://mathuo.github.io/dockview/output/docs/index.html).

Want to inspect the deployed package? Go to https://unpkg.com/browse/dockview@latest/

### Features
- Simple splitviews, nested splitviews (i.e. gridviews) supporting full layout managment with
dockable and tabular views
- Extensive API support at the component level and at the indivdual view level
- Themable and customizable
- Serialization / deserialization
- Tabular views with Drag and Drop support
- Documentation and examples

Largly inspired by code IDE editors such as VSCode. Parts of the core resizable panelling is based upon an implementation found in the VSCode sources of a [splitview](https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/splitview) and [gridview](https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/grid).

## Installation
You can install the project from [npm](https://www.npmjs.com/package/dockview). The project comes with TypeScript typings.

```
npm install --save dockview
```

## Setup

You must import or reference the stylesheet at `dockview/dist/styles/dockview.css`. For example:

```css
@import '~dockview/dist/styles/dockview.css';
```

You should also attach a dockview theme to an element containing your components. For example:

```html
<body classname="dockview-theme-light">
</body>
```

dockview has a peer dependency on `react >= 16.8.0` and `react-dom >= 16.8.0` which is the version that introduced [React Hooks](https://reactjs.org/docs/hooks-intro.html).

## FAQ
### Can I use this library without React?
In theory, yes. The library is written in plain-old JS and the parts written in ReactJS are merely wrappers around the plain-old JS components. Currently everything is published as one package though so maybe that's something to change in the future.

### Can I use this library with AngularJS/Vue.js or any other arbitrarily named JavaScript library/framework?
Yes but with some extra work. Dockview is written in plain-old JS so you can either interact directly with the plain-old JS components or create a wrapper using your prefered library/framework. The React wrapper may give some ideas on how this wrapper implementation could be done for other libraries/frameworks. Maybe that's something to change in the future.
## Sandbox examples
- [Dockview](https://codesandbox.io/s/simple-dockview-t6491)
- [Gridview](https://codesandbox.io/s/simple-gridview-jrp0n)
- [Splitview](https://codesandbox.io/s/simple-splitview-l53nn)
- [Paneview](https://codesandbox.io/s/simple-paneview-v8qvb)

# API Documentation
### Splitview
[Component Api](https://mathuo.github.io/dockview/output/docs/classes/splitviewapi.html)
[Panel Api]()

### Gridview
[Component Api](https://mathuo.github.io/dockview/output/docs/classes/gridviewapi.html)
[Panel Api]()
### Dockview
[Component Api](https://mathuo.github.io/dockview/output/docs/classes/dockviewapi.html)
[Panel Api]()
### Paneview
[Component Api](https://mathuo.github.io/dockview/output/docs/classes/paneviewapi.html)
[Panel Api]()

## Serialization / De-serialization
All view components support the methods `toJSON()`, `fromJSON(...)` and `onDidLayoutChange()`.

See example [here](https://codesandbox.io/s/workspace-saving-example-euo5d).

## Theming

The theme can be customized using the below set of CSS properties. You can find the built in themes [here](https://github.com/mathuo/dockview/blob/master/packages/dockview/src/theme.scss) which could be used as an example to extend upon or build your own theme.


| CSS Property | Description |
| ------------ | ----------- |
| **General** |
| --dv-active-sash-color | The background color a dividing sash during an interaction |
| --dv-separator-border | The color of the seperator between panels |
| **Paneview** |
| --dv-paneview-header-border-color | - |
| --dv-paneview-active-outline-color | The primary accent color, used for example to highlight the active panel in Paneviews |
| **Dockview -> Dragging** |
| --dv-drag-over-background-color | The overlay color applied to a group when a moving tab is dragged over |
| **Dockview -> Tabs container** |
| --dv-tabs-and-actions-container-font-size | - |
| --dv-tabs-and-actions-container-height | Default tab height |
| --dv-tabs-and-actions-container-background-color | - |
| --dv-tabs-container-scrollbar-color | - |
| --dv-group-view-background-color | - |
| **Dockview -> Tabs** (see [dockviewComponent.scss](https://github.com/mathuo/dockview/blob/master/packages/dockview/src/dockview/dockviewComponent.scss))
| --dv-activegroup-visiblepanel-tab-background-color | The background color of the tab for the visible panel in the active group |
| --dv-activegroup-hiddenpanel-tab-background-color | The background color of the tab for the hidden panel/s in the active group |
| --dv-inactivegroup-visiblepanel-tab-background-color | The background color of the tab for the visible panel in groups other than the active group |
| --dv-inactivegroup-hiddenpanel-tab-background-color | The background color of the tab for the hidden panel/s in groups other than the active group |
| --dv-activegroup-visiblepanel-tab-color | The color of the tab for the visible panel in the active group |
| --dv-activegroup-hiddenpanel-tab-color | The color of the tab for the hidden panel/s in the active group |
| --dv-inactivegroup-visiblepanel-tab-color | The color of the tab for the visible panel in groups other than the active group |
| --dv-inactivegroup-hiddenpanel-tab-color | The color of the tab for the hidden panel/s in groups other than the active group |
| --dv-tab-divider-color | - |
| --dv-tab-close-icon | Default tab close icon |
| --dv-tab-dirty-icon | Default tab dirty icon |
