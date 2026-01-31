import 'dockview-core/dist/styles/dockview.css';
import {
    createDockview,
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabOverflowRenderer,
    ITabOverflowTriggerRenderer,
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

// Custom trigger renderer (appears in the tab header)
class CustomTriggerRenderer implements ITabOverflowTriggerRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('button');
        this._element.style.cssText = `
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            color: white;
            border: none;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
        `;
    }

    update(event: TabOverflowEvent): void {
        if (!event.isVisible) {
            this._element.style.display = 'none';
            return;
        }
        this._element.style.display = 'flex';
        this._element.textContent = event.tabs.length.toString();
    }

    dispose(): void {
        // cleanup
    }
}

// Custom content renderer (the overflow menu)
class CustomContentRenderer implements ITabOverflowRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 16px;
            min-width: 280px;
            color: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        `;
    }

    update(event: TabOverflowEvent): void {
        this._element.innerHTML = '';
        
        // Title
        const title = document.createElement('div');
        title.textContent = `📋 Hidden Tabs (${event.tabs.length})`;
        title.style.cssText = `
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 12px;
            text-align: center;
        `;
        this._element.appendChild(title);

        // Scrollable container
        const scrollContainer = document.createElement('div');
        scrollContainer.style.cssText = `
            max-height: 300px;
            overflow-y: auto;
        `;

        // Add tab items
        event.tabs.forEach((tab) => {
            const tabElement = document.createElement('div');
            tabElement.style.cssText = `
                padding: 12px;
                margin: 6px 0;
                border-radius: 8px;
                cursor: pointer;
                background: ${tab.isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
                border: ${tab.isActive ? '2px solid rgba(255, 255, 255, 0.6)' : '2px solid transparent'};
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;
            
            const titleSpan = document.createElement('span');
            titleSpan.textContent = tab.title;
            titleSpan.style.fontWeight = tab.isActive ? 'bold' : 'normal';
            
            tabElement.appendChild(titleSpan);
            
            if (tab.isActive) {
                const activeSpan = document.createElement('span');
                activeSpan.textContent = '✓ Active';
                activeSpan.style.cssText = `
                    font-size: 12px;
                    background: rgba(255,255,255,0.3);
                    padding: 2px 6px;
                    border-radius: 4px;
                `;
                tabElement.appendChild(activeSpan);
            }

            tabElement.addEventListener('click', () => {
                tab.panel.api.setActive();
            });

            scrollContainer.appendChild(tabElement);
        });
        
        this._element.appendChild(scrollContainer);
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
        return {
            trigger: new CustomTriggerRenderer(),
            content: new CustomContentRenderer()
        };
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