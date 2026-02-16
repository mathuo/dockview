import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, OnInit, OnDestroy, Type, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { DockviewAngularModule } from 'dockview-angular';
import { Subject } from 'rxjs';
import 'dockview-core/dist/styles/dockview.css';

// Default panel component with constraints
@Component({
    selector: 'default-panel',
    template: `
        <div [ngStyle]="{
            height: '100%',
            padding: '20px',
            background: 'var(--dv-group-view-background-color)',
            color: 'white'
        }">
            <button (click)="onClick()">Set</button>
            <div *ngIf="constraints" [ngStyle]="{ fontSize: '13px' }">
                <div *ngIf="constraints.maximumHeight != null" [ngStyle]="constraintItemStyle">
                    <span [ngStyle]="{ color: 'grey' }">Maximum Height: </span>
                    <span>{{ constraints.maximumHeight }}px</span>
                </div>
                <div *ngIf="constraints.minimumHeight != null" [ngStyle]="constraintItemStyle">
                    <span [ngStyle]="{ color: 'grey' }">Minimum Height: </span>
                    <span>{{ constraints.minimumHeight }}px</span>
                </div>
                <div *ngIf="constraints.maximumWidth != null" [ngStyle]="constraintItemStyle">
                    <span [ngStyle]="{ color: 'grey' }">Maximum Width: </span>
                    <span>{{ constraints.maximumWidth }}px</span>
                </div>
                <div *ngIf="constraints.minimumWidth != null" [ngStyle]="constraintItemStyle">
                    <span [ngStyle]="{ color: 'grey' }">Minimum Width: </span>
                    <span>{{ constraints.minimumWidth }}px</span>
                </div>
            </div>
        </div>
    `,
})
export class DefaultPanelComponent implements OnInit, OnDestroy {
    api: any;
    constraints: any = null;
    private destroy$ = new Subject<void>();

    constraintItemStyle = {
        border: '1px solid grey',
        margin: '2px',
        padding: '1px'
    };

    ngOnInit() {
        if (this.api?.group?.api?.onDidConstraintsChange) {
            this.api.group.api.onDidConstraintsChange((event: any) => {
                this.constraints = event;
            });
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onClick() {
        if (this.api?.group?.api?.setConstraints) {
            this.api.group.api.setConstraints({
                maximumWidth: 300,
                maximumHeight: 300,
            });
        }
    }
}

// Main app component
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
    components: Record<string, Type<any>>;

    constructor() {
        this.components = {
            default: DefaultPanelComponent,
        };
    }

    onReady(event: any) {
        const api = event.api;

        const panel1 = api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        const panel2 = api.addPanel({
            id: 'panel_2',
            component: 'default',
            position: {
                referencePanel: panel1,
                direction: 'right',
            },
        });

        const panel3 = api.addPanel({
            id: 'panel_3',
            component: 'default',
            position: {
                referencePanel: panel2,
                direction: 'right',
            },
        });

        const panel4 = api.addPanel({
            id: 'panel_4',
            component: 'default',
            position: {
                direction: 'below',
            },
        });
    }
}

@NgModule({
    declarations: [AppComponent, DefaultPanelComponent],
    imports: [BrowserModule, CommonModule, DockviewAngularModule],
    bootstrap: [AppComponent]
})
export class AppModule { }

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));
