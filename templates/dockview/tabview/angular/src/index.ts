import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, NgModule, Input, Type, OnDestroy } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
    DockviewAngularModule,
    DockviewApi,
    DockviewPanelApi,
    DockviewReadyEvent,
    DockviewTheme,
    TabAnimation,
    themeAbyss,
} from 'dockview-angular';
import 'dockview-core/dist/styles/dockview.css';

@Component({
    selector: 'default-panel',
    template: `
        <div style="height: 100%; color: white; padding: 8px;">
            {{ api?.title }}
        </div>
    `,
})
export class DefaultPanelComponent {
    @Input() api!: DockviewPanelApi;
}

@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <div style="padding: 4px 8px;">
                <button (click)="toggle()">tabAnimation: {{ tabAnimation }}</button>
            </div>
            <div style="flex-grow: 1;">
                <dv-dockview
                    [components]="components"
                    [theme]="theme"
                    [disableFloatingGroups]="true"
                    className="dockview-theme-abyss"
                    (ready)="onReady($event)">
                </dv-dockview>
            </div>
        </div>
    `,
})
export class AppComponent implements OnDestroy {
    components: Record<string, Type<any>> = {
        default: DefaultPanelComponent,
    };

    tabAnimation: TabAnimation = 'default';
    theme: DockviewTheme = { ...themeAbyss, tabAnimation: this.tabAnimation };

    private overlayDisposable?: { dispose(): void };

    toggle() {
        this.tabAnimation =
            this.tabAnimation === 'smooth' ? 'default' : 'smooth';
        this.theme = { ...themeAbyss, tabAnimation: this.tabAnimation };
    }

    onReady(event: DockviewReadyEvent) {
        const api: DockviewApi = event.api;

        this.overlayDisposable = api.onWillShowOverlay((e) => {
            if (e.kind === 'header_space' || e.kind === 'tab') {
                return;
            }
            e.preventDefault();
        });

        api.addPanel({ id: 'panel_1', component: 'default' });
        api.addPanel({ id: 'panel_2', component: 'default' });
        api.addPanel({ id: 'panel_3', component: 'default' });
        api.addPanel({ id: 'panel_4', component: 'default' });
        api.addPanel({ id: 'panel_5', component: 'default' });
    }

    ngOnDestroy() {
        this.overlayDisposable?.dispose();
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
