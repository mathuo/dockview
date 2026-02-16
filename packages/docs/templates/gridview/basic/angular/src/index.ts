import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, Type, NgModule, Input } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DockviewAngularModule } from 'dockview-angular';
import 'dockview-core/dist/styles/dockview.css';

@Component({
    selector: 'default-panel',
    template: `<div style="padding: 10px; color: white; background: #1e1e1e; border: 1px solid #333; height: 100%;">Panel {{ api?.id || 'Unknown' }}</div>`
})
export class DefaultPanelComponent {
    @Input() api: any;

    constructor() {}
}

@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%;">
            <dv-gridview
                [components]="components"
                className="dockview-theme-abyss"
                (ready)="onReady($event)">
            </dv-gridview>
        </div>
    `
})
export class AppComponent {
    components: Record<string, Type<any>>;

    constructor() {
        this.components = {
            default: DefaultPanelComponent,
        };
    }

    onReady(event: any) {
        const api = event.api;

        const panel1 = api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        const panel2 = api.addPanel({
            id: 'panel_2',
            component: 'default',
            position: { referencePanel: panel1.id, direction: 'right' },
        });

        api.addPanel({
            id: 'panel_3',
            component: 'default',
            position: { referencePanel: panel1.id, direction: 'below' },
        });

        api.addPanel({
            id: 'panel_4',
            component: 'default',
            position: { referencePanel: panel2.id, direction: 'below' },
        });
    }
}

@NgModule({
    declarations: [AppComponent, DefaultPanelComponent],
    imports: [BrowserModule, DockviewAngularModule],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));