import 'dockview-core/dist/styles/dockview.css';
import {
    createDockview,
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabOverflowRenderer,
    TabOverflowEvent,
    themeAbyss,
} from 'dockview-core';

// Simple panel component
class Panel implements IContentRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.padding = '16px';
        this._element.style.height = '100%';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        const title = parameters.api.title || parameters.api.id;
        this._element.innerHTML = `
            <h3>${title}</h3>
            <p>This is a sample panel. Try resizing the window to see the custom overflow behavior.</p>
        `;
    }

    dispose(): void {
        // cleanup
    }
}

// Custom tab overflow renderer
class CustomTabOverflowRenderer implements ITabOverflowRenderer {
    private readonly _element: HTMLElement;
    private isOpen = false;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.position = 'relative';
    }

    update(event: TabOverflowEvent): void {
        if (!event.isVisible) {
            this._element.style.display = 'none';
            this.isOpen = false;
            return;
        }

        this._element.style.display = 'block';

        // Create button
        const button = document.createElement('button');
        button.textContent = `+${event.tabs.length} more`;
        button.style.cssText = `
            padding: 4px 8px; 
            border: 1px solid #ccc; 
            border-radius: 4px; 
            background: white; 
            cursor: pointer; 
            font-size: 12px;
        `;

        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.style.cssText = `
            position: absolute; 
            top: 100%; 
            right: 0; 
            background: white; 
            border: 1px solid #ccc; 
            border-radius: 4px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
            z-index: 1000; 
            min-width: 200px;
            display: ${this.isOpen ? 'block' : 'none'};
        `;

        // Add tab items to dropdown
        event.tabs.forEach(tab => {
            const tabElement = document.createElement('div');
            tabElement.style.cssText = `
                padding: 8px 12px; 
                cursor: pointer; 
                border-bottom: 1px solid #eee;
                background-color: ${tab.isActive ? '#e6f3ff' : 'transparent'};
            `;
            
            tabElement.innerHTML = `
                ${tab.title}
                ${tab.isActive ? '<span style="margin-left: 8px; font-weight: bold;">(active)</span>' : ''}
            `;

            tabElement.addEventListener('click', () => {
                tab.panel.api.setActive();
                this.isOpen = false;
                this.update(event); // Re-render to close dropdown
            });

            dropdown.appendChild(tabElement);
        });

        // Toggle dropdown on button click
        button.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            dropdown.style.display = this.isOpen ? 'block' : 'none';
        });

        // Clear and rebuild the element
        this._element.innerHTML = '';
        this._element.appendChild(button);
        this._element.appendChild(dropdown);

        // Close dropdown if clicking outside
        const handleClickOutside = (e: MouseEvent) => {
            if (!this._element.contains(e.target as Node)) {
                this.isOpen = false;
                dropdown.style.display = 'none';
                document.removeEventListener('click', handleClickOutside);
            }
        };

        if (this.isOpen) {
            document.addEventListener('click', handleClickOutside);
        }
    }

    dispose(): void {
        // cleanup
    }
}

// Create dockview instance
const api = createDockview(document.getElementById('app')!, {
    theme: themeAbyss,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
            default:
                throw new Error(`Unknown component: ${options.name}`);
        }
    },
    createTabOverflowComponent: () => {
        return new CustomTabOverflowRenderer();
    },
});

// Add multiple panels to trigger overflow
for (let i = 1; i <= 8; i++) {
    api.addPanel({
        id: `panel_${i}`,
        component: 'default',
        title: `Panel ${i}`,
    });
}