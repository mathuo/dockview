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
            <dv-paneview
                [components]="components"
                className="dockview-theme-abyss"
                orientation="VERTICAL"
                (ready)="onReady($event)">
            </dv-paneview>
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

        api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
            size: 150,
        });

        api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
            size: 200,
        });

        api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
            size: 180,
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