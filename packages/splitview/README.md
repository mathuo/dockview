<div align="center">
<h1>dockview</h1>

<p>Zero dependency layout manager supporting tabs, grids and splitviews with ReactJS support</p>

</div>

---

![stability-experimental](https://img.shields.io/badge/stability-experimental-orange.svg)
[![npm version](https://badge.fury.io/js/dockview.svg)](https://www.npmjs.com/package/dockview)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![codecov](https://codecov.io/gh/mathuo/dockview/branch/master/graph/badge.svg?token=BF083TK64H)](https://codecov.io/gh/mathuo/dockview/branch/master)

##

A zero dependency layout manager based on the layering of split-view components with ReactJS support. View the live demo [here](https://mathuo.github.io/dockview/). Automatically generated TypeDocs can be found [here](https://mathuo.github.io/dockview/output/docs/index.html).

## Installation
You can install the project from [npm](https://www.npmjs.com/package/dockview). The project comes with TypeScript typings.

```bash
npm install --save dockview
```

## Configuration

You must import the core css stylesheet but you are free to supply your own theming in addition to the core stylesheet. The location to reference for the stylesheet is

```
dockview/dist/styles.css
```

By default the seperator between panels is `transparent` but this can be set through the CSS varibable `--separator-border`. Alternatively, or if you require the `DockviewReact` you should attach the classname of an included theme; either `dockview-theme-dark` or `dockview-theme-light`.


### Sandbox examples
- [Dockview](https://codesandbox.io/s/simple-dockview-t6491)
- [Gridview](https://codesandbox.io/s/simple-gridview-jrp0n)
- [Splitview](https://codesandbox.io/s/simple-splitview-l53nn)
- [Paneview](https://codesandbox.io/s/simple-paneview-v8qvb)

## React

### Splitview

```javascript
import { 
    ISplitviewPanelProps, 
    Orientation, 
    SplitviewReact,
    SplitviewReadyEvent
} from "dockview";

const components = {
    "my-component": (props: ISplitviewPanelProps) => {
        return (
            <div>
                <span>This is a panel</span>
                <span>{props.arbitraryProp}</span>
            </div>
        )
    }
}

const Example = () => {
    const onReady = (event: SplitviewReadyEvent) => {
        event.addPanel({
            id: "panel-1",
            component: "my-component",
            params: {
                arbitraryProp: "Hello World"
            }
        });
        event.addPanel({
            id: "panel-2",
            component: "my-component",
            params: {
                arbitraryProp: "World Hello"
            }
        });
    }

    return (
        <SplitviewReact
            components={components}
            onReady={onReady}
            orientation={Orientation.VERTICAL}
        />
    )
}
```

## Run the demo locally