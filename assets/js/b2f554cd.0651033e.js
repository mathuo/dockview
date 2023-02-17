"use strict";(self.webpackChunkdockview_docs=self.webpackChunkdockview_docs||[]).push([[1477],{10:e=>{e.exports=JSON.parse('{"blogPosts":[{"id":"dockview-1.5.2-release","metadata":{"permalink":"/blog/dockview-1.5.2-release","editUrl":"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/blog/2022-10-04-dockview-1.5.2.mdx","source":"@site/blog/2022-10-04-dockview-1.5.2.mdx","title":"Dockview 1.5.2","description":"\ud83d\ude80 Features","date":"2022-10-04T00:00:00.000Z","formattedDate":"October 4, 2022","tags":[{"label":"release","permalink":"/blog/tags/release"}],"readingTime":0.14,"hasTruncateMarker":false,"authors":[],"frontMatter":{"slug":"dockview-1.5.2-release","title":"Dockview 1.5.2","tags":["release"]},"nextItem":{"title":"Dockview 1.5.1","permalink":"/blog/dockview-1.5.1-release"}},"content":"import Link from \'@docusaurus/Link\';\\n\\n\\n## \ud83d\ude80 Features\\n\\n## \ud83d\udee0 Miscs\\n\\n-   Fix resizing panels via api methods [#157](https://github.com/mathuo/dockview/pull/157)\\n-   Various doc enhancements @ [dockview.dev](https://dockview.dev)\\n\\n## \ud83d\udd25 Breaking changes"},{"id":"dockview-1.5.1-release","metadata":{"permalink":"/blog/dockview-1.5.1-release","editUrl":"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/blog/2022-07-23-dockview-1.5.1.mdx","source":"@site/blog/2022-07-23-dockview-1.5.1.mdx","title":"Dockview 1.5.1","description":"\ud83d\ude80 Features","date":"2022-07-23T00:00:00.000Z","formattedDate":"July 23, 2022","tags":[{"label":"release","permalink":"/blog/tags/release"}],"readingTime":0.425,"hasTruncateMarker":false,"authors":[],"frontMatter":{"slug":"dockview-1.5.1-release","title":"Dockview 1.5.1","tags":["release"]},"prevItem":{"title":"Dockview 1.5.2","permalink":"/blog/dockview-1.5.2-release"},"nextItem":{"title":"Dockview 1.5.0","permalink":"/blog/dockview-1.5.0-release"}},"content":"import Link from \'@docusaurus/Link\';\\n\\n\\n## \ud83d\ude80 Features\\n\\n## \ud83d\udee0 Miscs\\n\\n-   Fix `.params` method on dockview panels to return the user provided panel params [#144](https://github.com/mathuo/dockview/pull/144)\\n-   Various doc enhancements @ [dockview.dev](https://dockview.dev)\\n\\n## \ud83d\udd25 Breaking changes\\n\\n-   Remove `onTabContextMenu` from `DockviewReact` to simplify library. As an alternative provide onContextMenu listeners in a custom tab. [#127](https://github.com/mathuo/dockview/pull/127)\\n-   Remove `suppressClosable` flag for `DockviewReact` panels to simplify library. As an alternative manage the features of a tab such as it\'s ability to be closed using a custom tab [#146](https://github.com/mathuo/dockview/pull/146)"},{"id":"dockview-1.5.0-release","metadata":{"permalink":"/blog/dockview-1.5.0-release","editUrl":"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/blog/2022-06-12-dockview-1.5.0.mdx","source":"@site/blog/2022-06-12-dockview-1.5.0.mdx","title":"Dockview 1.5.0","description":"\ud83d\ude80 Features","date":"2022-06-12T00:00:00.000Z","formattedDate":"June 12, 2022","tags":[{"label":"release","permalink":"/blog/tags/release"}],"readingTime":0.685,"hasTruncateMarker":false,"authors":[],"frontMatter":{"slug":"dockview-1.5.0-release","title":"Dockview 1.5.0","tags":["release"]},"prevItem":{"title":"Dockview 1.5.1","permalink":"/blog/dockview-1.5.1-release"},"nextItem":{"title":"Dockview 1.4.3","permalink":"/blog/dockview-1.4.3-release"}},"content":"import Link from \'@docusaurus/Link\';\\n\\n\\n## \ud83d\ude80 Features\\n\\n-   Additional Themes [commit](https://github.com/mathuo/dockview/commit/1921e170e0b8275e8a10255f616119d36cff80cf)\\n    -   `dockview-theme-abyss` and `dockview-theme-dracula`\\n-   SVG Icons [#132](https://github.com/mathuo/dockview/pull/132)\\n    -   Use inline SVG icons for the close and chevon icons to allow for easier customization and theming\\n-   Dnd improvements [#136](https://github.com/mathuo/dockview/pull/136)\\n    -   Components always behaviour independant of one another by default, there is no cross component dnd behaviour unless manually set by user through `onDidDrop` and `showDndOverlay` props.\\n-   Default tab [#136](https://github.com/mathuo/dockview/pull/136)\\n    -   Provide a default React tab implementation to allow for simple changes to tab renderer without rewritting the entire tab\\n    -   Override the default tab in `ReactDockview` with the `defaultTabComponent` prop\\n-   Group controls renderer [#138](https://github.com/mathuo/dockview/pull/138)\\n    -   Provide the `groupControlComponent` prop in `ReactDockview` to create custom control components for groups. <Link to=\\"../../docs/components/dockview/#group-controls-panel\\">Go</Link>\\n\\n## \ud83d\udee0 Miscs\\n\\n-   Various doc enhancements @ [dockview.dev](https://dockview.dev)\\n\\n## \ud83d\udd25 Breaking changes"},{"id":"dockview-1.4.3-release","metadata":{"permalink":"/blog/dockview-1.4.3-release","editUrl":"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/blog/2022-05-26-dockview-1.4.3.mdx","source":"@site/blog/2022-05-26-dockview-1.4.3.mdx","title":"Dockview 1.4.3","description":"\ud83d\ude80 Features","date":"2022-05-26T00:00:00.000Z","formattedDate":"May 26, 2022","tags":[{"label":"release","permalink":"/blog/tags/release"}],"readingTime":0.515,"hasTruncateMarker":false,"authors":[],"frontMatter":{"slug":"dockview-1.4.3-release","title":"Dockview 1.4.3","tags":["release"]},"prevItem":{"title":"Dockview 1.5.0","permalink":"/blog/dockview-1.5.0-release"},"nextItem":{"title":"Dockview 1.4.2","permalink":"/blog/dockview-1.4.2-release"}},"content":"## \ud83d\ude80 Features\\n\\n-   Small adjusted to behaviours of default paneview header componnet [#116](https://github.com/mathuo/dockview/pull/116) [#120](https://github.com/mathuo/dockview/pull/120)\\n-   Improved support for external dnd events in the dockview component. `showDndOverlay` prop on `DockviewReact` exposes more parameters to interact with [#110](https://github.com/mathuo/dockview/pull/110)\\n-   Improved to underlying events exposes through all components [#114](https://github.com/mathuo/dockview/pull/114)\\n-   Add .clear() to the component APIs providing an easy way to clear a layout [#119](https://github.com/mathuo/dockview/pull/119)\\n-   Udate orientation via componnet APIs is now working correctly [#119](https://github.com/mathuo/dockview/pull/119)\\n\\n## \ud83d\udee0 Miscs\\n\\n-   Documentation enhancements [#101](https://github.com/mathuo/dockview/pull/101)\\n-   Move documentation to [dockview.dev](https://dockview.dev)\\n\\n## \ud83d\udd25 Breaking changes\\n\\n-   Fix typo by renaming `onDidLayoutfromJSON` to `onDidLayoutFromJSON` in dockview component api [#112](https://github.com/mathuo/dockview/pull/112/files)"},{"id":"dockview-1.4.2-release","metadata":{"permalink":"/blog/dockview-1.4.2-release","editUrl":"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/blog/2022-05-16-dockview-1.4.2.mdx","source":"@site/blog/2022-05-16-dockview-1.4.2.mdx","title":"Dockview 1.4.2","description":"\ud83d\ude80 Features","date":"2022-05-16T00:00:00.000Z","formattedDate":"May 16, 2022","tags":[{"label":"release","permalink":"/blog/tags/release"}],"readingTime":0.19,"hasTruncateMarker":false,"authors":[],"frontMatter":{"slug":"dockview-1.4.2-release","title":"Dockview 1.4.2","tags":["release"]},"prevItem":{"title":"Dockview 1.4.3","permalink":"/blog/dockview-1.4.3-release"},"nextItem":{"title":"Dockview 1.4.1","permalink":"/blog/dockview-1.4.1-release"}},"content":"## \ud83d\ude80 Features\\n\\n-   Fix deserialization issue where previously active panel wasn\'t display correctly after deserialization [#108](https://github.com/mathuo/dockview/pull/108)\\n\\n## \ud83d\udd25 Breaking changes\\n\\n-   Rename `onDidAddGroup` to `onDidAddPanel`, `onDidRemoveGroup` to `onDidRemovePanel` and `onDidActiveGroupChange` to `onDidActivePanelChange` on the Gridview API [#106](https://github.com/mathuo/dockview/pull/106)"},{"id":"dockview-1.4.1-release","metadata":{"permalink":"/blog/dockview-1.4.1-release","editUrl":"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/blog/2022-05-11-dockview-1.4.1.mdx","source":"@site/blog/2022-05-11-dockview-1.4.1.mdx","title":"Dockview 1.4.1","description":"\ud83d\ude80 Features","date":"2022-05-11T00:00:00.000Z","formattedDate":"May 11, 2022","tags":[{"label":"release","permalink":"/blog/tags/release"}],"readingTime":0.635,"hasTruncateMarker":false,"authors":[],"frontMatter":{"slug":"dockview-1.4.1-release","title":"Dockview 1.4.1","tags":["release"]},"prevItem":{"title":"Dockview 1.4.2","permalink":"/blog/dockview-1.4.2-release"}},"content":"## \ud83d\ude80 Features\\n\\n-   Fix Drag and Drop issues in Dockview on Firefox [#103](https://github.com/mathuo/dockview/pull/103)\\n\\n## \ud83d\udee0 Miscs\\n\\n-   Documentation enhancements https://mathuo.github.io/dockview/docs/\\n\\n## \ud83d\udd25 Breaking changes\\n\\nAll breaking changes here are designed to simplify the library with only one way to do something.\\n\\n-   Remove `setVisible` and `setActive` from the Splitview API. You can still achieve the same behaviors through calling `setVisible` and `setActive` on the Splitview Panel API. [#105](https://github.com/mathuo/dockview/pull/105)\\n-   Remove `setVisible`, `setActive` and `toggleVisiblity` from Gridview API. You can still achieve the same behaviors through calling `setVisible` and `setActive` on the Gridview Panel API [#105](https://github.com/mathuo/dockview/pull/105)\\n-   Remove `onFocusEvent` from Panel API as this was not intended to be a public method. You can use `onDidFocusChange` instead [#105](https://github.com/mathuo/dockview/pull/105)\\n-   Remove HOC `<DockviewComponents.Panel\\\\>`, `<DockviewComponents.Content>`, `<DockviewComponents.Tab>` and `<DockviewComponents.Actions>` [#105](https://github.com/mathuo/dockview/pull/105)"}]}')}}]);