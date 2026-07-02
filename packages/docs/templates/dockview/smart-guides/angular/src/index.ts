import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, NgModule, Input, Type } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
    DockviewAngularModule,
    DockviewApi,
    DockviewPanelApi,
    DockviewReadyEvent,
} from 'dockview-angular';
import 'dockview-angular/dist/styles/dockview.css';

@Component({
    selector: 'default-panel',
    template: `
        <div
            style="height: 100%; padding: 20px; background: var(--dv-group-view-background-color);"
        >
            {{ params?.title }}
        </div>
    `,
})
export class DefaultPanelComponent {
    @Input() api!: DockviewPanelApi;
    @Input() params!: { title: string };
}

@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%;">
            <dv-dockview
                [components]="components"
                [smartGuides]="smartGuides"
                className="dockview-theme-abyss"
                (ready)="onReady($event)"
            >
            </dv-dockview>
        </div>
    `,
})
export class AppComponent {
    components: Record<string, Type<any>> = {
        default: DefaultPanelComponent,
    };

    // Snap floating groups to each other (and to container edges) when dragged
    // within 8px of an alignment.
    smartGuides = { snapDistance: 8 };

    onReady(event: DockviewReadyEvent) {
        const api: DockviewApi = event.api;

        // A docked base panel to fill the container.
        api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
            params: { title: 'Panel 1' },
        });

        // Two floating groups so alignment + snapping is demonstrable: drag one
        // near the other (or towards a container edge) to see the guides.
        api.addPanel({
            id: 'float_1',
            component: 'default',
            title: 'Floating 1',
            params: { title: 'Floating 1' },
            floating: {
                width: 220,
                height: 140,
                position: { top: 40, left: 60 },
            },
        });

        api.addPanel({
            id: 'float_2',
            component: 'default',
            title: 'Floating 2',
            params: { title: 'Floating 2' },
            floating: {
                width: 220,
                height: 140,
                position: { top: 220, left: 340 },
            },
        });
    }
}

@NgModule({
    declarations: [AppComponent, DefaultPanelComponent],
    imports: [BrowserModule, DockviewAngularModule],
    bootstrap: [AppComponent],
})
export class AppModule {}

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
