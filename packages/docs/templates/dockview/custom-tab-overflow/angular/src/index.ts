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

// Custom trigger component (appears in the tab header)
@Component({
    selector: 'custom-trigger',
    template: `
        <button 
            *ngIf="event.isVisible"
            style="background: linear-gradient(45deg, #ff6b6b, #feca57); 
                   color: white; border: none; border-radius: 50%; 
                   width: 28px; height: 28px; font-size: 12px; 
                   font-weight: bold; cursor: pointer; 
                   box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                   display: flex; align-items: center; justify-content: center;"
        >
            {{ event.tabs.length }}
        </button>
    `
})
export class CustomTriggerComponent {
    @Input() event!: TabOverflowEvent;
}

// Custom content component (the overflow menu)
@Component({
    selector: 'custom-content',
    template: `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px; padding: 16px; min-width: 280px; 
                    color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px; text-align: center;">
                📋 Hidden Tabs ({{ event.tabs.length }})
            </div>
            
            <div style="max-height: 300px; overflow-y: auto;">
                <div
                    *ngFor="let tab of event.tabs"
                    (click)="activateTab(tab)"
                    style="padding: 12px; margin: 6px 0; border-radius: 8px; 
                           cursor: pointer; transition: all 0.2s ease;
                           display: flex; align-items: center; justify-content: space-between;"
                    [style.background]="tab.isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'"
                    [style.border]="tab.isActive ? '2px solid rgba(255, 255, 255, 0.6)' : '2px solid transparent'"
                >
                    <span [style.font-weight]="tab.isActive ? 'bold' : 'normal'">
                        {{ tab.title }}
                    </span>
                    <span 
                        *ngIf="tab.isActive"
                        style="font-size: 12px; background: rgba(255,255,255,0.3);
                               padding: 2px 6px; border-radius: 4px;"
                    >
                        ✓ Active
                    </span>
                </div>
            </div>
        </div>
    `
})
export class CustomContentComponent {
    @Input() event!: TabOverflowEvent;

    activateTab(tab: any) {
        tab.panel.api.setActive();
    }
}

// Main app component  
@Component({
    selector: 'app-root',
    template: `
        <dv-dockview
            [components]="components"
            [tab-overflow-component]="tabOverflowConfig"
            className="dockview-theme-abyss"
            (ready)="onReady($event)"
            style="width: 100%; height: 100vh;">
        </dv-dockview>
    `
})
export class AppComponent {
    components: Record<string, Type<any>>;
    tabOverflowConfig = {
        trigger: CustomTriggerComponent,
        content: CustomContentComponent
    };

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
    declarations: [AppComponent, DefaultPanelComponent, CustomTriggerComponent, CustomContentComponent],
    imports: [BrowserModule, DockviewAngularModule],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

// Bootstrap the application
platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));