import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DockviewAngularComponent } from './dockview/dockview-angular.component';
import { GridviewAngularComponent } from './gridview/gridview-angular.component';
import { PaneviewAngularComponent } from './paneview/paneview-angular.component';
import { SplitviewAngularComponent } from './splitview/splitview-angular.component';

@NgModule({
    declarations: [
        DockviewAngularComponent,
        GridviewAngularComponent,
        PaneviewAngularComponent,
        SplitviewAngularComponent
    ],
    imports: [
        CommonModule
    ],
    exports: [
        DockviewAngularComponent,
        GridviewAngularComponent,
        PaneviewAngularComponent,
        SplitviewAngularComponent
    ]
})
export class DockviewAngularModule { }