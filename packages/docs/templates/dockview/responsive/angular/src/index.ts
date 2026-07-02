import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, Type, NgModule, Input } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DockviewAngularModule } from 'dockview-angular';
import 'dockview-angular/dist/styles/dockview.css';

// Default panel component
@Component({
    selector: 'default-panel',
    template: `<div>
        {{ title }}{{ params?.subtitle ? ' — ' + params.subtitle : '' }}
    </div>`,
})
export class DefaultPanelComponent {
    // `params` receives the object passed to `api.addPanel({ params: ... })`.
    @Input() params: { subtitle?: string };
    @Input() api: any;

    get title() {
        return this.api?.title || this.api?.id || 'Panel';
    }

    constructor() {}
}

// Main app component
@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%;">
            <dv-dockview
                [components]="components"
                [responsive]="responsive"
                className="dockview-theme-abyss"
                (ready)="onReady($event)"
            >
            </dv-dockview>
        </div>
    `,
})
export class AppComponent {
    components: Record<string, Type<any>>;

    // Below 600px the side-by-side groups collapse into one tabbed group; above
    // 680px they expand back out (container-driven, not viewport).
    responsive = {
        breakpoints: [
            { name: 'lg', maxWidth: Infinity },
            {
                name: 'sm',
                maxWidth: 600,
                exitAt: 680,
                rules: [{ kind: 'collapseToTabs' }],
            },
        ],
    };

    constructor() {
        this.components = {
            default: DefaultPanelComponent,
        };
    }

    onReady(event: any) {
        const api = event.api;

        api.addPanel({ id: 'sidebar', component: 'default' });
        api.addPanel({
            id: 'editor',
            component: 'default',
            position: { direction: 'right', referencePanel: 'sidebar' },
        });
        api.addPanel({
            id: 'inspector',
            component: 'default',
            position: { direction: 'right', referencePanel: 'editor' },
        });
    }
}

// App module
@NgModule({
    declarations: [AppComponent, DefaultPanelComponent],
    imports: [BrowserModule, DockviewAngularModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}

// Bootstrap the application with JIT compilation
platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
