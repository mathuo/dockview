import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import {
    Component,
    NgModule,
    Input,
    Type,
    OnDestroy,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
    DockviewAngularModule,
    DockviewApi,
    DockviewDidDropEvent,
    DockviewPanelApi,
    DockviewReadyEvent,
    positionToDirection,
} from 'dockview-angular';
import 'dockview-angular/dist/styles/dockview.css';

@Component({
    selector: 'default-panel',
    template: `<div style="padding: 20px;"><div>{{ params?.title }}</div></div>`,
})
export class DefaultPanelComponent {
    @Input() api!: DockviewPanelApi;
    @Input() params!: { title: string };
}

@Component({
    selector: 'app-root',
    template: `
        <div style="display: flex; flex-direction: column; height: 100%;">
            <div style="margin: 2px 0;">
                <span
                    tabindex="-1"
                    draggable="true"
                    (dragstart)="onExternalDragStart($event)"
                    style="background: orange; padding: 0 8px; border-radius: 4px; width: 100px; cursor: pointer;">
                    Drag me into the dock
                </span>
                <div
                    (dragover)="$event.preventDefault()"
                    (drop)="onDropOutside($event)"
                    style="padding: 0 4px; background: black; color: white; border-radius: 2px;">
                    Drop a tab or group here to inspect the attached metadata
                </div>
            </div>
            <dv-dockview
                [components]="components"
                [dndEdges]="dndEdges"
                className="dockview-theme-abyss"
                (ready)="onReady($event)"
                (didDrop)="onDidDrop($event)">
            </dv-dockview>
        </div>
    `,
})
export class AppComponent implements OnDestroy {
    components: Record<string, Type<any>> = {
        default: DefaultPanelComponent,
    };

    dndEdges = {
        size: { value: 100, type: 'pixels' as const },
        activationSize: { value: 5, type: 'percentage' as const },
    };

    private disposables: { dispose(): void }[] = [];

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
            component: 'default',
            params: { title: 'Panel 3' },
        });
        api.addPanel({
            id: 'panel_4',
            component: 'default',
            params: { title: 'Panel 4' },
            position: { referencePanel: 'panel_1', direction: 'right' },
        });

        this.disposables.push(
            // Attach custom metadata when an internal panel/group drag starts —
            // an external drop zone can then read it via dataTransfer.
            api.onWillDragPanel((event) => {
                if (!(event.nativeEvent instanceof DragEvent)) {
                    return;
                }
                event.nativeEvent.dataTransfer?.setData(
                    'text/plain',
                    'Some custom panel data transfer data'
                );
            }),
            api.onWillDragGroup((event) => {
                if (!(event.nativeEvent instanceof DragEvent)) {
                    return;
                }
                event.nativeEvent.dataTransfer?.setData(
                    'text/plain',
                    'Some custom group data transfer data'
                );
            }),
            // Accept arbitrary outside drags into the dock.
            api.onUnhandledDragOverEvent((event) => {
                event.accept();
            })
        );
    }

    onExternalDragStart(event: DragEvent) {
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', 'nothing');
        }
    }

    onDropOutside(event: DragEvent) {
        event.preventDefault();
        const dt = event.dataTransfer;
        if (!dt) {
            return;
        }
        let text = 'The following dataTransfer data was found:\n';
        for (let i = 0; i < dt.items.length; i++) {
            const item = dt.items[i];
            text += `type=${item.type},data=${dt.getData(item.type)}\n`;
        }
        alert(text);
    }

    onDidDrop(event: DockviewDidDropEvent) {
        event.api.addPanel({
            id: 'dropped_' + Date.now(),
            component: 'default',
            params: { title: 'Dropped' },
            position: {
                direction: positionToDirection(event.position),
                referenceGroup: event.group || undefined,
            },
        });
    }

    ngOnDestroy() {
        this.disposables.forEach((d) => d.dispose());
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
