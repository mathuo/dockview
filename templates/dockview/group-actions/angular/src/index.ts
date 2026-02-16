import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, Type, NgModule, Input } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DockviewAngularModule, DockviewApi, DockviewReadyEvent, DockviewPanel } from 'dockview-angular';
import 'dockview-core/dist/styles/dockview.css';

// Default panel component
@Component({
    selector: 'default-panel',
    template: `
        <div style="display: flex; justify-content: center; align-items: center; color: gray; height: 100%;">
            <span>{{ title }}</span>
        </div>
    `
})
export class DefaultPanelComponent {
    @Input() api: any;
    @Input() params: any;
    
    get title() {
        return this.api?.title || 'Panel';
    }
}

// Right header actions component
@Component({
    selector: 'right-header-actions',
    template: `
        <div class="dockview-groupcontrol-demo">
            <span class="dockview-groupcontrol-demo-group-active" 
                  [style.background]="isGroupActive ? 'green' : 'red'">
                {{ isGroupActive ? 'Group Active' : 'Group Inactive' }}
            </span>
        </div>
    `,
    styles: [`
        .dockview-groupcontrol-demo {
            height: 100%;
            display: flex;
            align-items: center;
            color: white;
            background-color: black;
            padding: 0px 8px;
            margin: 1px;
            border: 1px dotted orange;
        }
        
        .dockview-groupcontrol-demo-group-active {
            padding: 0px 8px;
        }
    `]
})
export class RightHeaderActionsComponent {
    @Input() isGroupActive: boolean;
}

// Left header actions component
@Component({
    selector: 'left-header-actions',
    template: `
        <div class="dockview-groupcontrol-demo">
            <span class="dockview-groupcontrol-demo-active-panel">
                activePanel: {{ activePanel?.id || 'null' }}
            </span>
        </div>
    `,
    styles: [`
        .dockview-groupcontrol-demo {
            height: 100%;
            display: flex;
            align-items: center;
            color: white;
            background-color: black;
            padding: 0px 8px;
            margin: 1px;
            border: 1px dotted orange;
        }
        
        .dockview-groupcontrol-demo-active-panel {
            color: yellow;
            padding: 0px 8px;
        }
    `]
})
export class LeftHeaderActionsComponent {
    @Input() activePanel: DockviewPanel;
}

// Prefix header component
@Component({
    selector: 'prefix-header-actions',
    template: `
        <div class="dockview-groupcontrol-demo">🌲</div>
    `,
    styles: [`
        .dockview-groupcontrol-demo {
            height: 100%;
            display: flex;
            align-items: center;
            color: white;
            background-color: black;
            padding: 0px 8px;
            margin: 1px;
            border: 1px dotted orange;
        }
    `]
})
export class PrefixHeaderActionsComponent {
    @Input() activePanel: DockviewPanel;
}

// Main app component
@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%;">
            <dv-dockview
                [components]="components"
                [prefixHeaderActionsComponent]="prefixHeaderActionsComponent"
                [leftHeaderActionsComponent]="leftHeaderActionsComponent"
                [rightHeaderActionsComponent]="rightHeaderActionsComponent"
                className="dockview-theme-abyss"
                (ready)="onReady($event)">
            </dv-dockview>
        </div>
    `
})
export class AppComponent {
    components: Record<string, Type<any>>;
    prefixHeaderActionsComponent = PrefixHeaderActionsComponent;
    leftHeaderActionsComponent = LeftHeaderActionsComponent;
    rightHeaderActionsComponent = RightHeaderActionsComponent;

    constructor() {
        this.components = {
            default: DefaultPanelComponent,
        };
    }

    onReady(event: DockviewReadyEvent) {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
            position: {
                direction: 'right',
            },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
            position: {
                direction: 'below',
            },
        });
    }
}

// App module
@NgModule({
    declarations: [
        AppComponent, 
        DefaultPanelComponent,
        RightHeaderActionsComponent,
        LeftHeaderActionsComponent,
        PrefixHeaderActionsComponent
    ],
    imports: [BrowserModule, DockviewAngularModule],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

// Bootstrap the application
platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));