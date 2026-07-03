import { LicenseManager } from 'dockview-enterprise';
import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, Type, NgModule, Input } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
    DockviewAngularModule,
    DockviewReadyEvent,
    themeAbyss,
} from 'dockview-angular';
import 'dockview-angular/dist/styles/dockview.css';

// dockview.dev docs license key — replace with your own key in production.
LicenseManager.setLicenseKey(
    '[KeyId:DOCKVIEW-DOCS]_[Company:Dockview]_[Plan:team]_[AppName:Dockview_Docs]_[Email:enterprise@dockview.dev]_[ValidFrom:01_Jan_2025]_[ValidUntil:01_Jan_2099]__aaa294ecec1eed47'
);

@Component({
    selector: 'default-panel',
    template: `<div style="padding: 10px;">{{ title }}</div>`,
})
export class DefaultPanelComponent {
    @Input() api: any;

    get title() {
        return this.api?.title || this.api?.id || 'Panel';
    }
}

@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%;">
            <dv-dockview
                [components]="components"
                [theme]="theme"
                [disableFloatingGroups]="true"
                [getTabGroupChipContextMenuItems]="getTabGroupChipContextMenuItems"
                (ready)="onReady($event)">
            </dv-dockview>
        </div>
    `,
})
export class AppComponent {
    components: Record<string, Type<any>>;
    theme = { ...themeAbyss, tabAnimation: 'smooth' as const };
    getTabGroupChipContextMenuItems = () =>
        ['rename', 'colorPicker'] as const;

    constructor() {
        this.components = {
            default: DefaultPanelComponent,
        };
    }

    onReady(event: DockviewReadyEvent) {
        const api = event.api;

        const titles = [
            'Dashboard',
            'Settings',
            'Users',
            'Analytics',
            'Reports',
            'Billing',
            'Notifications',
            'Logs',
        ];

        const first = api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: titles[0],
        });
        for (let i = 1; i < titles.length; i++) {
            api.addPanel({
                id: `panel_${i + 1}`,
                component: 'default',
                title: titles[i],
            });
        }

        const groupId = first.group.id;

        const featureGroup = api.createTabGroup({
            groupId,
            label: 'Feature',
            color: 'blue',
        });
        ['panel_1', 'panel_2', 'panel_3', 'panel_4'].forEach((panelId) => {
            api.addPanelToTabGroup({
                groupId,
                tabGroupId: featureGroup.id,
                panelId,
            });
        });

        const monitoringGroup = api.createTabGroup({
            groupId,
            label: 'Monitoring',
            color: 'purple',
        });
        ['panel_5', 'panel_7', 'panel_8'].forEach((panelId) => {
            api.addPanelToTabGroup({
                groupId,
                tabGroupId: monitoringGroup.id,
                panelId,
            });
        });
        monitoringGroup.collapse();
    }
}

@NgModule({
    declarations: [AppComponent, DefaultPanelComponent],
    imports: [BrowserModule, DockviewAngularModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
