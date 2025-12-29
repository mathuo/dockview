import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, Type, NgModule, Input } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DockviewAngularModule, DockviewReadyEvent } from 'dockview-angular';
import { TabOverflowEvent } from 'dockview-core';
import 'dockview-core/dist/styles/dockview.css';

// Default panel component
@Component({
    selector: 'default-panel',
    template: `
        <div style="height: 100%; padding: 16px;">
            <h3>{{ title }}</h3>
            <p>This is a sample panel. Try resizing the window to see the custom overflow behavior.</p>
        </div>
    `
})
export class DefaultPanelComponent {
    @Input() api: any;
    @Input() params: any;
    
    get title() {
        return this.params?.title || this.api?.title || this.api?.id || 'Panel';
    }
}

// Custom tab overflow component
@Component({
    selector: 'custom-tab-overflow',
    template: `
        <div *ngIf="event.isVisible" style="position: relative;">
            <button 
                (click)="isOpen = !isOpen"
                style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; 
                       background: white; cursor: pointer; font-size: 12px;"
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

// Main app component  
@Component({
    selector: 'app-root',
    template: `
        <dv-dockview
            [components]="components"
            [tab-overflow-component]="tabOverflowComponent"
            className="dockview-theme-abyss"
            (ready)="onReady($event)"
            style="width: 100%; height: 100vh;">
        </dv-dockview>
    `
})
export class AppComponent {
    components: Record<string, Type<any>>;
    tabOverflowComponent = CustomTabOverflowComponent;

    constructor() {
        this.components = {
            default: DefaultPanelComponent,
        };
    }

    onReady(event: DockviewReadyEvent) {
        // Add multiple panels to trigger overflow
        for (let i = 1; i <= 8; i++) {
            event.api.addPanel({
                id: `panel_${i}`,
                component: 'default',
                title: `Panel ${i}`,
            });
        }
    }
}

// App module
@NgModule({
    declarations: [AppComponent, DefaultPanelComponent, CustomTabOverflowComponent],
    imports: [BrowserModule, DockviewAngularModule],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

// Bootstrap the application
platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));