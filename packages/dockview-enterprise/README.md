# dockview-enterprise

Separable feature modules for [dockview](https://github.com/mathuo/dockview).

These modules plug into `dockview-core`'s module system. You normally don't
install this package directly — the `dockview` package depends on it and
registers its modules for you, so importing `dockview` gives you the full
feature set out of the box.

```ts
// dockview (the batteries-included entry) does this for you:
import { registerModules } from 'dockview-core';
import { Modules } from 'dockview-enterprise';

registerModules(Modules);
```

If you depend on `dockview-core` directly and want these features, register
them yourself with `registerModules(Modules)` before constructing a
`DockviewComponent`.
