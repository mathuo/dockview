import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, Input, NgModule, OnInit, Type } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
    DockviewAngularModule,
    DockviewReadyEvent,
    GetTabContextMenuItemsParams,
    IContextMenuItemComponentProps,
} from 'dockview-angular';
import 'dockview-core/dist/styles/dockview.css';

@Component({
    selector: 'default-panel',
    template: `<div style="padding:8px;">{{ api?.title }}</div>`,
})
export class DefaultPanelComponent {
    @Input() api: any;
}

/**
 * A custom context menu item as an Angular component.
 * Receives panel, group, api, and close via @Input bindings.
 */
@Component({
    selector: 'float-menu-item',
    template: `
        <div class="dv-context-menu-item" (click)="onClick()">Float tab</div>
    `,
})
export class FloatMenuItemComponent implements IContextMenuItemComponentProps {
    @Input() panel: any;
    @Input() group: any;
    @Input() api: any;
    @Input() close!: () => void;

    onClick() {
        this.api.addFloatingGroup(this.panel);
        this.close();
    }
}

@Component({
    selector: 'app-root',
    template: `
        <dv-dockview
            style="width:100%;height:100%"
            className="dockview-theme-abyss"
            [components]="components"
            [getTabContextMenuItems]="getTabContextMenuItems"
            (ready)="onReady($event)"
        >
        </dv-dockview>
    `,
})
export class AppComponent implements OnInit {
    components: Record<string, Type<any>> = {
        default: DefaultPanelComponent,
    };

    getTabContextMenuItems = (params: GetTabContextMenuItemsParams) => [
        'close' as const,
        'closeOthers' as const,
        'closeAll' as const,
        'separator' as const,
        {
            label: 'Log panel id',
            action: () => console.log(params.panel.id),
        },
    ];

    ngOnInit() {}

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
        });
        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
        });
    }
}

@NgModule({
    declarations: [AppComponent, DefaultPanelComponent, FloatMenuItemComponent],
    imports: [BrowserModule, DockviewAngularModule],
    bootstrap: [AppComponent],
})
export class AppModule {}

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
