# Migrating to v7

The v7 migration guide now lives in the documentation site and is the canonical
reference:

👉 **https://dockview.dev/docs/overview/migrating-to-v7**

In short, v7 realigns the package names:

- `dockview` is now the framework-agnostic JavaScript package (a re-export of
  `dockview-core`).
- The **React bindings moved to `dockview-react`** — React users must install
  and import from `dockview-react`.
- `dockview-vue` / `dockview-angular` are unchanged for consumers.

There are also two breaking API changes (the removal of `rootOverlayModel` and a
new `onDidActivePanelChange` payload). See the guide above for full details and
codemods.
