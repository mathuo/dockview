<div align="center">
<h1>dockview</h1>

<p>Zero dependency layout manager supporting tabs, grids and splitviews with ReactJS support</p>

</div>

---

[![npm version](https://badge.fury.io/js/dockview.svg)](https://www.npmjs.com/package/dockview)
[![CI Build](https://github.com/mathuo/dockview/workflows/CI/badge.svg)](https://github.com/mathuo/dockview/actions?query=workflow%3ACI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=coverage)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mathuo_dockview&metric=alert_status)](https://sonarcloud.io/summary/overall?id=mathuo_dockview)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/dockview)](https://bundlephobia.com/result?p=dockview)

##

A zero dependency layout manager based on the layering of splitview with support for ReactJS components, written in TypeScript.

-   [➡️](https://mathuo.github.io/dockview/) Live demo
-   [➡️](https://mathuo.github.io/dockview/output/storybook-static) Storybook demo
-   [➡️](https://github.com/mathuo/dockview/tree/master/packages/dockview-demo/src/stories) Code examples
-   [➡️](https://mathuo.github.io/dockview/output/docs/index.html) Generated TypeDocs

Want to inspect the latest deployment? Go to https://unpkg.com/browse/dockview@latest/

## Features

-   Simple splitviews, nested splitviews (i.e. gridviews) supporting full layout managment with
    dockable and tabular views
-   Extensive API support at the component level and view level
-   Themable and customizable
-   Serialization / deserialization support
-   Tabular docking and Drag and Drop support
-   Documentation and examples

## Table of contents

-   [Quick start](#quick-start)
-   [Sandbox examples](#sandbox-examples)
-   [Serializated layouts](#serializated-layouts)
-   [Drag and drop](#drag-and-drop)
-   [Theming](#theming)
-   [Performance](#performance)
-   [FAQ](#faq)

This project was inspired by many popular IDE editors. Some parts of the core resizable panelling are inspired by code found in the VSCode codebase, [splitview](https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/splitview) and [gridview](https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/grid).

## Quick start

Dockview has a peer dependency on `react >= 16.8.0` and `react-dom >= 16.8.0`. You can install dockview from [npm](https://www.npmjs.com/package/dockview).

```
npm install --save dockview
```

Within your project you must import or reference the stylesheet at `dockview/dist/styles/dockview.css`. For example:

```css
@import '~dockview/dist/styles/dockview.css';
```

You should also attach a dockview theme to an element containing your components. For example:

```html
<body classname="dockview-theme-dark"></body>
```

Demonstrated below is a high level example of a `DockviewReact` component. You can follow a similar pattern for `GridviewReact`, `SplitviewReact` and `PaneviewReact` components too, see examples for more.

```tsx
import {
    DockviewReact,
    DockviewReadyEvent,
    PanelCollection,
    IDockviewPanelProps,
    IDockviewPanelHeaderProps,
} from 'dockview';

const components: PanelCollection<IDockviewPanelProps> = {
    default: (props: IDockviewPanelProps<{ someProps: string }>) => {
        return <div>{props.params.someProps}</div>;
    },
};

const headers: PanelCollection<IDockviewPanelHeaderProps> = {
    customTab: (props: IDockviewPanelHeaderProps) => {
        return (
            <div>
                <span>{props.api.title}</span>
                <span onClick={() => props.api.close()}>{'[x]'}</span>
            </div>
        );
    },
};

const Component = () => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel1',
            component: 'default',
            params: {
                someProps: 'Hello',
            },
        });
        event.api.addPanel({
            id: 'panel2',
            component: 'default',
            params: {
                someProps: 'World',
            },
            position: { referencePanel: 'panel1', direction: 'below' },
        });
    };

    return (
        <DockviewReact
            components={components}
            tabComponents={headers}
            onReady={onReady}
        />
    );
};
```

Specifically for `DockviewReact` there exists higher-order components to encapsulate both the tab and contents into one logical component for the user making state sharing between the two simple, which is an optional feature.

```tsx
const components: PanelCollection<IDockviewPanelProps> = {
    default: (props: IDockviewPanelProps<{ someProps: string }>) => {
        return <div>{props.params.someProps}</div>;
    },
    fancy: (props: IDockviewPanelProps) => {
        const close = () => props.api.close();
        return (
            <DockviewComponents.Panel>
                <DockviewComponents.Tab>
                    <div>
                        <span>{props.api.title}</span>
                        <span onClick={close}>{'Close'}</span>
                    </div>
                </DockviewComponents.Tab>
                <DockviewComponents.Content>
                    <div>{'Hello world'}</div>
                </DockviewComponents.Content>
            </DockviewComponents.Panel>
        );
    },
};
```

## Sandbox examples

-   [Dockview](https://codesandbox.io/s/simple-dockview-t6491)
-   [Gridview](https://codesandbox.io/s/simple-gridview-jrp0n)
-   [Splitview](https://codesandbox.io/s/simple-splitview-l53nn)
-   [Paneview](https://codesandbox.io/s/simple-paneview-v8qvb)

## Serializated layouts

All view components support the methods `toJSON()`, `fromJSON(...)` and `onDidLayoutChange()`.

See example [here](https://codesandbox.io/s/workspace-saving-example-euo5d).

## Drag and drop

Both `DockviewReact` and `PaneviewReact` support drag and drop functionality out of the box.

-   `DockviewReact` allows tabs to be repositioned using drag and drop.
-   `PaneviewReact` allows the repositioning of views using drag and drop on the header section.

You can use the utility methods `getPaneData` and `getPanelData` to manually extract the data transfer metadata associated with an active drag and drop event for either of the above components.

```tsx
import {
    getPaneData,
    getPanelData,
    PanelTransfer,
    PaneTransfer,
} from 'dockview';

const panelData: PanelTransfer | undefined = getPanelData();

if (panelData) {
    // DockviewReact: data transfer metadata associated with the active drag and drop event
    const { viewId, groupId, panelId } = panelData; // deconstructed object
}

const paneData: PaneTransfer | undefined = getPaneData();

if (paneData) {
    // PaneviewReact: data transfer metadata associated with the active drag and drop event
    const { viewId, paneId } = paneData; // deconstructed object
}
```

You can also intercept custom drag and drop events allowing dockview components to interact with and react to external drag events. `PaneviewReact` supports the method `onDidDrop` and `DockviewReact` supports the methods `onDidDrop` and `showDndOverlay`.

## Theming

The theme can be customized using the below set of CSS properties. You can find the built in themes [here](https://github.com/mathuo/dockview/blob/master/packages/dockview/src/theme.scss) which could be used as an example to extend upon or build your own theme.

| CSS Property                                         | Description                                                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **General**                                          |
| --dv-active-sash-color                               | The background color a dividing sash during an interaction                                                                           |
| --dv-separator-border                                | The color of the seperator between panels                                                                                            |
| **Paneview**                                         |
| --dv-paneview-header-border-color                    | -                                                                                                                                    |
| --dv-paneview-active-outline-color                   | The primary accent color, used for example to highlight the active panel in Paneviews                                                |
| **Dockview -> Dragging**                             |
| --dv-drag-over-background-color                      | The overlay color applied to a group when a moving tab is dragged over                                                               |
| **Dockview -> Tabs container**                       |
| --dv-tabs-and-actions-container-font-size            | -                                                                                                                                    |
| --dv-tabs-and-actions-container-height               | Default tab height                                                                                                                   |
| --dv-tabs-and-actions-container-background-color     | -                                                                                                                                    |
| --dv-tabs-container-scrollbar-color                  | -                                                                                                                                    |
| --dv-group-view-background-color                     | -                                                                                                                                    |
| **Dockview -> Tabs**                                 | (see [dockviewComponent.scss](https://github.com/mathuo/dockview/blob/master/packages/dockview/src/dockview/dockviewComponent.scss)) |
| --dv-activegroup-visiblepanel-tab-background-color   | The background color of the tab for the visible panel in the active group                                                            |
| --dv-activegroup-hiddenpanel-tab-background-color    | The background color of the tab for the hidden panel/s in the active group                                                           |
| --dv-inactivegroup-visiblepanel-tab-background-color | The background color of the tab for the visible panel in groups other than the active group                                          |
| --dv-inactivegroup-hiddenpanel-tab-background-color  | The background color of the tab for the hidden panel/s in groups other than the active group                                         |
| --dv-activegroup-visiblepanel-tab-color              | The color of the tab for the visible panel in the active group                                                                       |
| --dv-activegroup-hiddenpanel-tab-color               | The color of the tab for the hidden panel/s in the active group                                                                      |
| --dv-inactivegroup-visiblepanel-tab-color            | The color of the tab for the visible panel in groups other than the active group                                                     |
| --dv-inactivegroup-hiddenpanel-tab-color             | The color of the tab for the hidden panel/s in groups other than the active group                                                    |
| --dv-tab-divider-color                               | -                                                                                                                                    |
| --dv-tab-close-icon                                  | Default tab close icon                                                                                                               |

## Performance

Consider using React.lazy(...) to defer the importing of your panels until they are required. This has the potential to reduce the initial import cost when your application starts.

## FAQ

**Q: Can I use this library without React?**

**A:** In theory, yes. The library is written in plain-old JS and the parts written in ReactJS are merely wrappers around the plain-old JS components. Currently everything is published as one package though so maybe that's something to change in the future.

**Q: Can I use this library with AngularJS/Vue.js or any other arbitrarily named JavaScript library/framework?**

**A:** Yes but with some extra work. Dockview is written in plain-old JS so you can either interact directly with the plain-old JS components or create a wrapper using your prefered library/framework. The React wrapper may give some ideas on how this wrapper implementation could be done for other libraries/frameworks. Maybe that's something to change in the future.
