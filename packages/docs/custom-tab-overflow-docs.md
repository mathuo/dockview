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

### Vue

```vue
<template>
  <DockviewVue
    :components="components"
    :tab-overflow-component="'CustomTabOverflow'"
    @ready="onReady"
  />
</template>

<script setup>
import { DockviewVue } from 'dockview-vue';

// Custom overflow component
const CustomTabOverflow = {
  props: {
    event: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isOpen: false
    };
  },
  watch: {
    'event.isVisible'(newValue) {
      if (!newValue) {
        this.isOpen = false;
      }
    }
  },
  template: `
    <div v-if="event.isVisible" style="position: relative;">
      <button @click="isOpen = !isOpen" style="padding: 4px 8px;">
        +{{ event.tabs.length }} more
      </button>
      
      <div
        v-if="isOpen"
        style="position: absolute; top: 100%; right: 0; background: white; 
               border: 1px solid #ccc; border-radius: 4px; 
               box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 200px;"
      >
        <div
          v-for="tab in event.tabs"
          :key="tab.id"
          @click="activateTab(tab)"
          style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;"
          :style="{ backgroundColor: tab.isActive ? '#e6f3ff' : 'transparent' }"
        >
          {{ tab.title }}
          <span v-if="tab.isActive" style="margin-left: 8px; font-weight: bold;">
            (active)
          </span>
        </div>
      </div>
    </div>
  `,
  methods: {
    activateTab(tab) {
      tab.panel.api.setActive();
      this.isOpen = false;
    }
  }
};

const components = {
  CustomTabOverflow,
  // ... your other components
};

const onReady = (event) => {
  // Add multiple panels to trigger overflow
  for (let i = 1; i <= 8; i++) {
    event.api.addPanel({
      id: `panel${i}`,
      title: `Panel ${i}`,
      component: 'simple',
    });
  }
};
</script>
```

### Angular

```typescript
// custom-tab-overflow.component.ts
import { Component, Input } from '@angular/core';
import { TabOverflowEvent } from 'dockview-core';

@Component({
  selector: 'app-custom-tab-overflow',
  template: `
    <div *ngIf="event.isVisible" style="position: relative;">
      <button 
        (click)="isOpen = !isOpen"
        style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; 
               background: white; cursor: pointer;"
      >
        +{{ event.tabs.length }} more
      </button>
      
      <div
        *ngIf="isOpen"
        style="position: absolute; top: 100%; right: 0; background: white; 
               border: 1px solid #ccc; border-radius: 4px; 
               box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 200px;"
      >
        <div
          *ngFor="let tab of event.tabs"
          (click)="activateTab(tab)"
          style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;"
          [style.background-color]="tab.isActive ? '#e6f3ff' : 'transparent'"
        >
          {{ tab.title }}
          <span *ngIf="tab.isActive" style="margin-left: 8px; font-weight: bold;">
            (active)
          </span>
        </div>
      </div>
    </div>
  `
})
export class CustomTabOverflowComponent {
  @Input() event!: TabOverflowEvent;
  isOpen = false;

  activateTab(tab: any) {
    tab.panel.api.setActive();
    this.isOpen = false;
  }
}
```

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { DockviewAngularComponent } from 'dockview-angular';
import { CustomTabOverflowComponent } from './custom-tab-overflow.component';

@Component({
  selector: 'app-root',
  template: `
    <dv-dockview
      [components]="components"
      [tab-overflow-component]="tabOverflowComponent"
      (ready)="onReady($event)"
      style="height: 100vh;"
    >
    </dv-dockview>
  `,
  standalone: true,
  imports: [DockviewAngularComponent]
})
export class AppComponent {
  components = {
    // ... your panel components
  };
  
  tabOverflowComponent = CustomTabOverflowComponent;

  onReady(event: any) {
    // Add multiple panels to trigger overflow
    for (let i = 1; i <= 8; i++) {
      event.api.addPanel({
        id: `panel${i}`,
        title: `Panel ${i}`,
        component: 'simple',
      });
    }
  }
}
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