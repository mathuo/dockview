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
                [pinnedTabs]="pinnedTabs"
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

    // Enable pinned tabs, which stay ahead of the other tabs and never overflow.
    pinnedTabs = { enabled: true };

    onReady(event: DockviewReadyEvent) {
        const api: DockviewApi = event.api;

        const home = api.addPanel({
            id: 'home',
            component: 'default',
            title: 'Home',
            params: { title: 'Home' },
        });
        api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
            params: { title: 'Panel 1' },
        });
        api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
            params: { title: 'Panel 2' },
        });
        api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
            params: { title: 'Panel 3' },
        });
        api.addPanel({
            id: 'panel_4',
            component: 'default',
            title: 'Panel 4',
            params: { title: 'Panel 4' },
        });

        // Pin the "Home" tab so it always renders first and never overflows.
        home.api.setPinned(true);
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
