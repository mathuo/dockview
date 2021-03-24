<div align="center">
<h1>dockview</h1>

<p>Zero dependency layout manager supporting tabs, grids and splitviews with ReactJS support</p>

</div>

---

![stability-experimental](https://img.shields.io/badge/stability-experimental-orange.svg)
[![npm version](https://badge.fury.io/js/dockview.svg)](https://www.npmjs.com/package/dockview)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![codecov](https://codecov.io/gh/mathuo/dockview/branch/master/graph/badge.svg?token=BF083TK64H)](https://codecov.io/gh/mathuo/dockview/branch/master)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status)](https://sonarcloud.io/dashboard?id=mathuo_dockview)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/dockview)](https://bundlephobia.com/result?p=dockview)

##

A zero dependency layout manager based on the layering of split-view components with ReactJS support.
- View the live demo [here](https://mathuo.github.io/dockview/). 
- Storybook demo [here](https://mathuo.github.io/dockview/output/storybook-static).
- Code examples [here](https://github.com/mathuo/dockview/tree/master/packages/splitview-demo/src/stories).
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

