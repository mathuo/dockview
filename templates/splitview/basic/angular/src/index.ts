import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, Type, NgModule, Input } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DockviewAngularModule } from 'dockview-angular';
import 'dockview-core/dist/styles/dockview.css';

@Component({
    selector: 'default-panel',
    template: `<div style="height: 100%; padding: 10px; color: white; background: #1e1e1e;">Panel {{ api?.id || 'Unknown' }}</div>`,
    styles: [`:host { display: block; height: 100%; }`]
})
export class DefaultPanelComponent {
    @Input() api: any;

    constructor() {}
}

@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%;">
            <dv-splitview
                style="width: 100%; height: 100%"
                [components]="components"
                className="dockview-theme-abyss"
                orientation="VERTICAL"
                (ready)="onReady($event)">
            </dv-splitview>
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

        const el = document.getElementById('app')!;
        api.layout(el.clientWidth, el.clientHeight);

        api.addPanel({
            id: 'panel_1',
            component: 'default',
            size: 200,
        });

        api.addPanel({
            id: 'panel_2',
            component: 'default',
            size: 300,
        });

        api.addPanel({
            id: 'panel_3',
            component: 'default',
            size: 200,
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