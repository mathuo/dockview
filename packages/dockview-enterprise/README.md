# dockview-enterprise

Enterprise feature modules and licensing for [dockview](https://github.com/mathuo/dockview).

`dockview-enterprise` is a drop-in **superset** of the free `dockview` package:
it re-exports the entire `dockview` API and adds the enterprise feature modules
(pinned tabs, smart guides, drop guide, auto-hide edge groups, multi-row tabs,
context menu, tab-group chips, keyboard docking, layout history) plus the license
gate. Importing the package self-registers all of them.

## Install

```sh
npm install dockview-enterprise
```

It depends on `dockview`; use it **instead of** `dockview` (not alongside) —
everything `dockview` exports is re-exported here.

## Usage

```ts
import { DockviewComponent, LicenseManager } from 'dockview-enterprise';

// Optional: set your license key. Without a valid key, dockview keeps working
// but shows a small corner watermark (suppressed on localhost).
LicenseManager.setLicenseKey('your-license-key');
```

Merely importing `dockview-enterprise` registers the enterprise modules and the
license check, so the feature options (`pinnedTabs`, `smartGuides`, …) become
available on every `DockviewComponent` — no explicit `registerModules` call is
needed.

Using a framework binding (`dockview-react` / `dockview-vue` /
`dockview-angular`)? Keep importing your components from the binding and add a
one-line side-effect import to activate the enterprise features:

```ts
import 'dockview-enterprise';
```

## License

Enterprise features are governed by a license key set via
`LicenseManager.setLicenseKey(...)`. Without a valid key, dockview keeps working
but shows a small corner watermark (suppressed on localhost). See
<https://dockview.dev/enterprise>.
