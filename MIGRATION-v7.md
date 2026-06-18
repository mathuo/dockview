# Migrating to v7

v7 realigns the package names so that `dockview` is the framework-agnostic
JavaScript package and each framework has a matching `dockview-<framework>`
package.

| Package | v6 | v7 |
|---|---|---|
| `dockview-core` | Vanilla core (public) | Vanilla core — **internal implementation detail** |
| `dockview` | **React bindings** | Vanilla JS / TypeScript (re-export of `dockview-core`) — **recommended for vanilla** |
| `dockview-react` | Re-export of `dockview` | **React bindings** |
| `dockview-vue` | Vue bindings | Vue bindings (now consumes `dockview`) |
| `dockview-angular` | Angular bindings | Angular bindings (now consumes `dockview`) |

## React users — action required (breaking)

The React bindings moved from `dockview` to `dockview-react`.

```diff
- npm install dockview
+ npm install dockview-react
```

```diff
- import { DockviewReact } from 'dockview';
+ import { DockviewReact } from 'dockview-react';
```

```diff
- @import 'dockview/dist/styles/dockview.css';
+ @import 'dockview-react/dist/styles/dockview.css';
```

A one-shot codemod for a source tree:

```sh
# update imports
grep -rl "from 'dockview'" src | xargs sed -i '' "s/from 'dockview'/from 'dockview-react'/g"
```

## Vanilla JavaScript / TypeScript users — recommended

`dockview-core` is now considered an internal implementation detail. Install the
`dockview` package instead — it re-exports the entire core API.

```diff
- npm install dockview-core
+ npm install dockview
```

```diff
- import { DockviewComponent } from 'dockview-core';
+ import { DockviewComponent } from 'dockview';
```

```diff
- import 'dockview-core/dist/styles/dockview.css';
+ import 'dockview/dist/styles/dockview.css';
```

`dockview-core` continues to be published and will keep working, but new code
should depend on `dockview`.

### `dockview-core` no longer bundles every feature (behaviour change)

In v6, `dockview-core` shipped with all built-in features registered. In v7 a
set of feature modules is no longer part of bare `dockview-core`:

- **tab group chips** (chip rendering + the `onDid*TabGroup` events)
- **context menus** (the built-in tab / chip right-click menus)
- **advanced drag-and-drop** (`onWillDragPanel` / `onWillDragGroup` /
  `onWillDrop` hooks, custom drag ghost / drop overlay)
- **keyboard accessibility** (keyboard navigation / docking / live-region
  announcements)

These now live in the `dockview` package. **`dockview-core` is an internal
package — use `dockview`** (or a framework package — `dockview-react` / `-vue` /
`-angular`, which all consume `dockview`). Nothing throws if you stay on bare
`dockview-core` — the affected features simply do nothing — so a one-time
`console.warn` is emitted when a component is constructed on bare `dockview-core`
steering you to `dockview`.

## Vue / Angular users

No source changes required — keep installing `dockview-vue` / `dockview-angular`
and importing from them. Internally these now depend on `dockview` rather than
`dockview-core`; this is transparent to consumers.

## CDN / UMD users

The React global moved from the `dockview` UMD bundle to the `dockview-react`
bundle:

```diff
- https://cdn.jsdelivr.net/npm/dockview@7/dist/dockview.js
+ https://cdn.jsdelivr.net/npm/dockview-react@7/dist/dockview-react.js
```

The `dockview` UMD bundle now contains the vanilla API only.
