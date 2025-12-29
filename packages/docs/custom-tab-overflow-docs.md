# Custom Tab Overflow Rendering

This feature allows you to provide your own custom component for rendering tab overflow menus instead of using the built-in dropdown.

## Overview

When there are too many tabs to display in the available space, Dockview normally shows a built-in overflow dropdown. With this feature, you can replace that with your own custom component for better styling consistency and enhanced accessibility.

## Usage

### React

```tsx
import React from 'react';
import { DockviewReact, ITabOverflowProps } from 'dockview';

const CustomTabOverflow: React.FC<ITabOverflowProps> = ({ event }) => {
    // Don't render anything if no tabs are overflowing
    if (!event.isVisible) {
        return null;
    }

    return (
        <div>
            <button>
                +{event.tabs.length} more tabs
            </button>
            {/* Your custom overflow menu here */}
            <div className="custom-overflow-menu">
                {event.tabs.map((tab) => (
                    <div
                        key={tab.id}
                        onClick={() => tab.panel.api.setActive()}
                        className={tab.isActive ? 'active' : ''}
                    >
                        {tab.title}
                    </div>
                ))}
            </div>
        </div>
    );
};

<DockviewReact
    components={components}
    tabOverflowComponent={CustomTabOverflow}
    onReady={onReady}
/>
```

### Core API (Framework Agnostic)

```typescript
import { createDockview, ITabOverflowRenderer, TabOverflowEvent } from 'dockview-core';

class CustomTabOverflowRenderer implements ITabOverflowRenderer {
    private _element: HTMLElement;

    constructor() {
        this._element = document.createElement('div');
        this._element.className = 'custom-overflow';
    }

    get element(): HTMLElement {
        return this._element;
    }

    update(event: TabOverflowEvent): void {
        if (!event.isVisible) {
            this._element.style.display = 'none';
            return;
        }

        this._element.style.display = 'block';
        
        // Render your custom overflow UI
        this._element.innerHTML = `
            <button>+${event.tabs.length} more</button>
        `;
        
        // Add event listeners, etc.
    }

    dispose(): void {
        // Clean up resources
    }
}

const api = createDockview(element, {
    createTabOverflowComponent: (group) => new CustomTabOverflowRenderer(),
    // ... other options
});
```

## TabOverflowEvent API

The `TabOverflowEvent` provides the following data:

- `tabs: OverflowTabData[]` - Array of tabs that are currently overflowing
- `isVisible: boolean` - Whether overflow tabs are currently present
- `triggerElement: HTMLElement` - The container element for positioning

### OverflowTabData

Each overflow tab provides:

- `id: string` - Unique panel identifier
- `title: string` - Panel title
- `isActive: boolean` - Whether this tab is currently active
- `panel: IDockviewPanel` - Full panel API for interactions

## Benefits

- **Custom Styling**: Match your application's design system
- **Enhanced Accessibility**: Add ARIA labels, keyboard navigation, etc.
- **Custom Behavior**: Implement features like tab search, grouping, or custom actions
- **Positioning Control**: Place the overflow UI wherever makes sense in your layout

## Notes

- The custom overflow component is only rendered when `event.isVisible` is true
- You can activate tabs by calling `tab.panel.api.setActive()`
- The component receives updates whenever the overflow state changes
- Positioning is handled by your component - use `event.triggerElement` as a reference point if needed