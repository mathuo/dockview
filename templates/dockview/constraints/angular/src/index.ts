System.register(["zone.js", "@angular/platform-browser", "@angular/core", "@angular/common", "dockview-angular", "rxjs", "dockview-core/dist/styles/dockview.css"], function (exports_1, context_1) {
    "use strict";
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var platform_browser_1, core_1, common_1, dockview_angular_1, rxjs_1, DefaultPanelComponent, AppComponent;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (_1) {
            },
            function (platform_browser_1_1) {
                platform_browser_1 = platform_browser_1_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (common_1_1) {
                common_1 = common_1_1;
            },
            function (dockview_angular_1_1) {
                dockview_angular_1 = dockview_angular_1_1;
            },
            function (rxjs_1_1) {
                rxjs_1 = rxjs_1_1;
            },
            function (_2) {
            }
        ],
        execute: function () {
            DefaultPanelComponent = /** @class */ (function () {
                function DefaultPanelComponent() {
                    this.constraints = null;
                    this.destroy$ = new rxjs_1.Subject();
                    this.constraintItemStyle = {
                        border: '1px solid grey',
                        margin: '2px',
                        padding: '1px'
                    };
                }
                DefaultPanelComponent.prototype.ngOnInit = function () {
                    var _this = this;
                    var _a, _b, _c;
                    if ((_c = (_b = (_a = this.api) === null || _a === void 0 ? void 0 : _a.group) === null || _b === void 0 ? void 0 : _b.api) === null || _c === void 0 ? void 0 : _c.onDidConstraintsChange) {
                        this.api.group.api.onDidConstraintsChange(function (event) {
                            _this.constraints = event;
                        });
                    }
                };
                DefaultPanelComponent.prototype.ngOnDestroy = function () {
                    this.destroy$.next();
                    this.destroy$.complete();
                };
                DefaultPanelComponent.prototype.onClick = function () {
                    var _a, _b, _c;
                    if ((_c = (_b = (_a = this.api) === null || _a === void 0 ? void 0 : _a.group) === null || _b === void 0 ? void 0 : _b.api) === null || _c === void 0 ? void 0 : _c.setConstraints) {
                        this.api.group.api.setConstraints({
                            maximumWidth: 300,
                            maximumHeight: 300,
                        });
                    }
                };
                DefaultPanelComponent = __decorate([
                    core_1.Component({
                        selector: 'default-panel',
                        template: "\n        <div [ngStyle]=\"{\n            height: '100%',\n            padding: '20px',\n            background: 'var(--dv-group-view-background-color)',\n            color: 'white'\n        }\">\n            <button (click)=\"onClick()\">Set</button>\n            <div *ngIf=\"constraints\" [ngStyle]=\"{ fontSize: '13px' }\">\n                <div *ngIf=\"constraints.maximumHeight != null\" [ngStyle]=\"constraintItemStyle\">\n                    <span [ngStyle]=\"{ color: 'grey' }\">Maximum Height: </span>\n                    <span>{{ constraints.maximumHeight }}px</span>\n                </div>\n                <div *ngIf=\"constraints.minimumHeight != null\" [ngStyle]=\"constraintItemStyle\">\n                    <span [ngStyle]=\"{ color: 'grey' }\">Minimum Height: </span>\n                    <span>{{ constraints.minimumHeight }}px</span>\n                </div>\n                <div *ngIf=\"constraints.maximumWidth != null\" [ngStyle]=\"constraintItemStyle\">\n                    <span [ngStyle]=\"{ color: 'grey' }\">Maximum Width: </span>\n                    <span>{{ constraints.maximumWidth }}px</span>\n                </div>\n                <div *ngIf=\"constraints.minimumWidth != null\" [ngStyle]=\"constraintItemStyle\">\n                    <span [ngStyle]=\"{ color: 'grey' }\">Minimum Width: </span>\n                    <span>{{ constraints.minimumWidth }}px</span>\n                </div>\n            </div>\n        </div>\n    ",
                        standalone: true,
                        imports: [common_1.CommonModule]
                    })
                ], DefaultPanelComponent);
                return DefaultPanelComponent;
            }());
            exports_1("DefaultPanelComponent", DefaultPanelComponent);
            AppComponent = /** @class */ (function () {
                function AppComponent() {
                    this.components = {
                        default: DefaultPanelComponent,
                    };
                }
                AppComponent.prototype.onReady = function (event) {
                    var api = event.api;
                    var panel1 = api.addPanel({
                        id: 'panel_1',
                        component: 'default',
                    });
                    var panel2 = api.addPanel({
                        id: 'panel_2',
                        component: 'default',
                        position: {
                            referencePanel: panel1,
                            direction: 'right',
                        },
                    });
                    var panel3 = api.addPanel({
                        id: 'panel_3',
                        component: 'default',
                        position: {
                            referencePanel: panel2,
                            direction: 'right',
                        },
                    });
                    var panel4 = api.addPanel({
                        id: 'panel_4',
                        component: 'default',
                        position: {
                            direction: 'below',
                        },
                    });
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'app-root',
                        template: "\n        <div style=\"height: 100vh;\">\n            <dv-dockview\n                [components]=\"components\"\n                className=\"dockview-theme-abyss\"\n                (ready)=\"onReady($event)\">\n            </dv-dockview>\n        </div>\n    ",
                        standalone: true,
                        imports: [dockview_angular_1.DockviewAngularComponent]
                    }),
                    __metadata("design:paramtypes", [])
                ], AppComponent);
                return AppComponent;
            }());
            exports_1("AppComponent", AppComponent);
            // Bootstrap the application
            platform_browser_1.bootstrapApplication(AppComponent).catch(function (err) { return console.error(err); });
        }
    };
});
