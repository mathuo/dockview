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
import 'dockview-core/dist/styles/dockview.css';

@Component({
    selector: 'default-panel',
    template: `
        <div
            style="height: 100%; padding: 20px; background: var(--dv-group-view-background-color);">
            {{ params?.title }}
        </div>
    `,
})
export class DefaultPanelComponent {
    @Input() api!: DockviewPanelApi;
    @Input() params!: { title: string };
}

@Component({
    selector: 'inner-dockview',
    template: `
        <dv-dockview
            [components]="components"
            className="nested-dockview"
            (ready)="onReady($event)">
        </dv-dockview>
    `,
})
export class InnerDockviewComponent {
    // Inner dockview reuses the outer DefaultPanelComponent; it's registered
    // here under the same key so panels can be added recursively.
    components: Record<string, Type<any>> = {
        default: DefaultPanelComponent,
    };

    onReady(event: DockviewReadyEvent) {
        const api: DockviewApi = event.api;
        api.addPanel({
            id: 'inner_panel_1',
            component: 'default',
            params: { title: 'Inner 1' },
        });
        api.addPanel({
            id: 'inner_panel_2',
            component: 'default',
            params: { title: 'Inner 2' },
        });
        api.addPanel({
            id: 'inner_panel_3',
            component: 'default',
            params: { title: 'Inner 3' },
        });
    }
}

@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%;">
            <dv-dockview
                [components]="components"
                className="dockview-theme-abyss"
                (ready)="onReady($event)">
            </dv-dockview>
        </div>
    `,
})
export class AppComponent {
    components: Record<string, Type<any>> = {
        default: DefaultPanelComponent,
        innerDockview: InnerDockviewComponent,
    };

    onReady(event: DockviewReadyEvent) {
        const api: DockviewApi = event.api;
        api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: { title: 'Panel 1' },
        });
        api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: { title: 'Panel 2' },
        });
        api.addPanel({
            id: 'panel_3',
            component: 'innerDockview',
            params: { title: 'Inner Dock' },
            position: { referencePanel: 'panel_2', direction: 'right' },
        });
    }
}

@NgModule({
    declarations: [AppComponent, DefaultPanelComponent, InnerDockviewComponent],
    imports: [BrowserModule, DockviewAngularModule],
    bootstrap: [AppComponent],
})
export class AppModule {}

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
