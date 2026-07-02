import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import {
    Component,
    Type,
    NgModule,
    Input,
    NgZone,
    Inject,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DockviewAngularModule } from 'dockview-angular';
import 'dockview-angular/dist/styles/dockview.css';
// LayoutPriority is a core enum; the framework bundle tree-shakes it out, so
// import it from dockview-core (string-valued, safe across bundles).
import { LayoutPriority } from 'dockview-core';

/**
 * A "complex" responsive demo exercising all three reflow transforms as the
 * container narrows — driven by the *container* width, not the viewport:
 *
 *   lg  (>900px)      canonical — four groups side by side
 *   md  (640–900px)   restack           — flipped from columns to rows
 *   sm  (440–640px)   restack + hide    — low-priority groups parked
 *   xs  (<440px)      collapseToTabs    — everything folded into one tabbed group
 */

const TINTS: Record<string, string> = {
    Files: '#1f6feb',
    'app.ts': '#238636',
    'styles.css': '#238636',
    Properties: '#8957e5',
    Output: '#9e6a03',
};

const BANDS: Record<string, string> = {
    lg: 'lg · ≥900px · canonical — four groups side by side',
    md: 'md · 640–900px · restack — flipped from columns to rows',
    sm: 'sm · 440–640px · restack + hide — low-priority groups parked',
    xs: 'xs · <440px · collapseToTabs — one tabbed group',
};

@Component({
    selector: 'default-panel',
    template: `<div
        style="height:100%; box-sizing:border-box; padding:12px; color:white;"
        [style.borderTop]="'2px solid ' + tint"
    >
        {{ title }}
    </div>`,
})
export class DefaultPanelComponent {
    @Input() api: any;

    get title() {
        return this.api?.title || this.api?.id || 'Panel';
    }

    get tint() {
        return TINTS[this.title] || '#484f58';
    }
}

@Component({
    selector: 'app-root',
    template: `
        <div style="height:100%; display:flex; flex-direction:column;">
            <div
                style="flex:0 0 auto; padding:6px 10px; font:12px/1.4 ui-monospace,monospace; color:#e6edf3; background:#161b22; border-bottom:1px solid #30363d;"
            >
                {{ bands[band] || 'breakpoint: ' + band }}
            </div>
            <dv-dockview
                style="flex:1 1 auto; min-height:0;"
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
    band = 'lg';
    bands = BANDS;

    responsive = {
        breakpoints: [
            { name: 'lg', maxWidth: Infinity },
            {
                name: 'md',
                maxWidth: 900,
                exitAt: 980,
                rules: [{ kind: 'restack' }],
            },
            {
                name: 'sm',
                maxWidth: 640,
                exitAt: 720,
                rules: [{ kind: 'restack' }, { kind: 'hide' }],
            },
            {
                name: 'xs',
                maxWidth: 440,
                exitAt: 520,
                rules: [{ kind: 'collapseToTabs' }],
            },
        ],
    };

    // `@Inject` (rather than type-based DI) so the example runner's transpiler
    // doesn't need emitted parameter metadata.
    constructor(@Inject(NgZone) private zone: NgZone) {
        this.components = {
            default: DefaultPanelComponent,
        };
    }

    onReady(event: any) {
        const api = event.api;
        // dockview fires its events outside Angular's zone, so re-enter it (and
        // defer a tick) to refresh the status bar without tripping
        // ExpressionChangedAfterItHasBeenChecked.
        const setBand = (bp: string) =>
            this.zone.run(() => setTimeout(() => (this.band = bp)));
        api.onDidBreakpointChange((e: { to: string }) => setBand(e.to));

        const explorer = api.addPanel({
            id: 'files',
            component: 'default',
            title: 'Files',
        });
        explorer.group.api.priority = LayoutPriority.Low;

        const editor = api.addPanel({
            id: 'editor',
            component: 'default',
            title: 'app.ts',
            position: { direction: 'right', referencePanel: 'files' },
        });
        editor.group.api.priority = LayoutPriority.Fill;
        api.addPanel({
            id: 'styles',
            component: 'default',
            title: 'styles.css',
            position: { referenceGroup: editor.group },
        });

        const inspector = api.addPanel({
            id: 'inspector',
            component: 'default',
            title: 'Properties',
            position: { direction: 'right', referenceGroup: editor.group },
        });

        const terminal = api.addPanel({
            id: 'terminal',
            component: 'default',
            title: 'Output',
            position: { direction: 'right', referenceGroup: inspector.group },
        });
        terminal.group.api.priority = LayoutPriority.Low;

        editor.api.setActive();
        setBand(api.activeBreakpoint || 'lg');
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
