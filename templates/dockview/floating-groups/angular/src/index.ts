System.register(["zone.js", "@angular/compiler", "@angular/platform-browser-dynamic", "@angular/core", "@angular/platform-browser", "dockview-angular", "dockview-core/dist/styles/dockview.css"], function (exports_1, context_1) {
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
    var platform_browser_dynamic_1, core_1, platform_browser_1, dockview_angular_1, DefaultPanelComponent, WatermarkComponent, LeftHeaderActionsComponent, RightHeaderActionsComponent, AppComponent, AppModule;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (_1) {
            },
            function (_2) {
            },
            function (platform_browser_dynamic_1_1) {
                platform_browser_dynamic_1 = platform_browser_dynamic_1_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (platform_browser_1_1) {
                platform_browser_1 = platform_browser_1_1;
            },
            function (dockview_angular_1_1) {
                dockview_angular_1 = dockview_angular_1_1;
            },
            function (_3) {
            }
        ],
        execute: function () {
            DefaultPanelComponent = /** @class */ (function () {
                function DefaultPanelComponent() {
                }
                Object.defineProperty(DefaultPanelComponent.prototype, "title", {
                    get: function () {
                        var _a, _b, _c;
                        return ((_a = this.params) === null || _a === void 0 ? void 0 : _a.title) || ((_b = this.api) === null || _b === void 0 ? void 0 : _b.title) || ((_c = this.api) === null || _c === void 0 ? void 0 : _c.id) || 'Panel';
                    },
                    enumerable: false,
                    configurable: true
                });
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", Object)
                ], DefaultPanelComponent.prototype, "api", void 0);
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", Object)
                ], DefaultPanelComponent.prototype, "params", void 0);
                DefaultPanelComponent = __decorate([
                    core_1.Component({
                        selector: 'default-panel',
                        template: "\n        <div style=\"height: 100%; padding: 20px; background: var(--dv-group-view-background-color);\">\n            {{ title }}\n        </div>\n    "
                    })
                ], DefaultPanelComponent);
                return DefaultPanelComponent;
            }());
            exports_1("DefaultPanelComponent", DefaultPanelComponent);
            WatermarkComponent = /** @class */ (function () {
                function WatermarkComponent() {
                }
                WatermarkComponent = __decorate([
                    core_1.Component({
                        selector: 'watermark-panel',
                        template: "\n        <div style=\"color: white; padding: 8px;\">watermark</div>\n    "
                    })
                ], WatermarkComponent);
                return WatermarkComponent;
            }());
            exports_1("WatermarkComponent", WatermarkComponent);
            LeftHeaderActionsComponent = /** @class */ (function () {
                function LeftHeaderActionsComponent() {
                }
                LeftHeaderActionsComponent.prototype.addPanel = function () {
                    this.containerApi.addPanel({
                        id: Date.now().toString(),
                        title: "Tab ".concat(Date.now()),
                        component: 'default',
                    });
                };
                var _a;
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", typeof (_a = typeof dockview_angular_1.DockviewApi !== "undefined" && dockview_angular_1.DockviewApi) === "function" ? _a : Object)
                ], LeftHeaderActionsComponent.prototype, "containerApi", void 0);
                LeftHeaderActionsComponent = __decorate([
                    core_1.Component({
                        selector: 'left-header-actions',
                        template: "\n        <div style=\"height: 100%; color: white; padding: 0px 4px;\">\n            <div (click)=\"addPanel()\" \n                 style=\"display: flex; justify-content: center; align-items: center; width: 30px; height: 100%; font-size: 18px; cursor: pointer;\"\n                 title=\"Add Panel\">\n                <span class=\"material-symbols-outlined\">add</span>\n            </div>\n        </div>\n    "
                    })
                ], LeftHeaderActionsComponent);
                return LeftHeaderActionsComponent;
            }());
            exports_1("LeftHeaderActionsComponent", LeftHeaderActionsComponent);
            RightHeaderActionsComponent = /** @class */ (function () {
                function RightHeaderActionsComponent() {
                    this.isFloating = false;
                }
                RightHeaderActionsComponent.prototype.ngOnInit = function () {
                    var _this = this;
                    var _a, _b, _c;
                    this.isFloating = ((_b = (_a = this.api) === null || _a === void 0 ? void 0 : _a.location) === null || _b === void 0 ? void 0 : _b.type) === 'floating';
                    if ((_c = this.group) === null || _c === void 0 ? void 0 : _c.api) {
                        this.group.api.onDidLocationChange(function (event) {
                            _this.isFloating = event.location.type === 'floating';
                        });
                    }
                };
                RightHeaderActionsComponent.prototype.toggleFloat = function () {
                    if (this.isFloating) {
                        var group = this.containerApi.addGroup();
                        this.group.api.moveTo({ group: group });
                    }
                    else {
                        this.containerApi.addFloatingGroup(this.group, {
                            position: {
                                width: 400,
                                height: 300,
                                bottom: 50,
                                right: 50,
                            }
                        });
                    }
                };
                var _b, _c;
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", typeof (_b = typeof dockview_angular_1.DockviewApi !== "undefined" && dockview_angular_1.DockviewApi) === "function" ? _b : Object)
                ], RightHeaderActionsComponent.prototype, "containerApi", void 0);
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", Object)
                ], RightHeaderActionsComponent.prototype, "api", void 0);
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", typeof (_c = typeof dockview_angular_1.DockviewGroupPanel !== "undefined" && dockview_angular_1.DockviewGroupPanel) === "function" ? _c : Object)
                ], RightHeaderActionsComponent.prototype, "group", void 0);
                RightHeaderActionsComponent = __decorate([
                    core_1.Component({
                        selector: 'right-header-actions',
                        template: "\n        <div style=\"height: 100%; color: white; padding: 0px 4px;\">\n            <div (click)=\"toggleFloat()\"\n                 style=\"display: flex; justify-content: center; align-items: center; width: 30px; height: 100%; font-size: 18px; cursor: pointer;\"\n                 [title]=\"isFloating ? 'Dock Group' : 'Float Group'\">\n                <span class=\"material-symbols-outlined\">{{ isFloating ? 'jump_to_element' : 'back_to_tab' }}</span>\n            </div>\n        </div>\n    "
                    })
                ], RightHeaderActionsComponent);
                return RightHeaderActionsComponent;
            }());
            exports_1("RightHeaderActionsComponent", RightHeaderActionsComponent);
            AppComponent = /** @class */ (function () {
                function AppComponent() {
                    this.watermarkComponent = WatermarkComponent;
                    this.leftHeaderActionsComponent = LeftHeaderActionsComponent;
                    this.rightHeaderActionsComponent = RightHeaderActionsComponent;
                    this.layout = null;
                    this.disableFloatingGroups = false;
                    this.floatingGroupBounds = undefined;
                    this.panelCount = 0;
                    this.components = {
                        default: DefaultPanelComponent,
                    };
                    // Load layout from localStorage
                    try {
                        var saved = localStorage.getItem('floating.layout');
                        if (saved) {
                            this.layout = JSON.parse(saved);
                        }
                    }
                    catch (err) {
                        // ignore
                    }
                }
                Object.defineProperty(AppComponent.prototype, "boundsText", {
                    get: function () {
                        return "Bounds: ".concat(this.floatingGroupBounds ? 'Within' : 'Overflow');
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(AppComponent.prototype, "disableFloatingText", {
                    get: function () {
                        return "".concat(this.disableFloatingGroups ? 'Enable' : 'Disable', " floating groups");
                    },
                    enumerable: false,
                    configurable: true
                });
                AppComponent.prototype.onReady = function (event) {
                    this.api = event.api;
                    this.loadLayout();
                };
                AppComponent.prototype.loadDefaultLayout = function () {
                    this.api.addPanel({
                        id: 'panel_1',
                        component: 'default',
                    });
                    this.api.addPanel({
                        id: 'panel_2',
                        component: 'default',
                    });
                    this.api.addPanel({
                        id: 'panel_3',
                        component: 'default',
                    });
                    var panel4 = this.api.addPanel({
                        id: 'panel_4',
                        component: 'default',
                        floating: true,
                    });
                    this.api.addPanel({
                        id: 'panel_5',
                        component: 'default',
                        floating: false,
                        position: { referencePanel: panel4 },
                    });
                    this.api.addPanel({
                        id: 'panel_6',
                        component: 'default',
                    });
                };
                AppComponent.prototype.loadLayout = function () {
                    this.api.clear();
                    if (this.layout) {
                        try {
                            this.api.fromJSON(this.layout);
                        }
                        catch (err) {
                            console.error(err);
                            this.api.clear();
                            this.loadDefaultLayout();
                        }
                    }
                    else {
                        this.loadDefaultLayout();
                    }
                };
                AppComponent.prototype.save = function () {
                    if (this.api) {
                        this.layout = this.api.toJSON();
                        localStorage.setItem('floating.layout', JSON.stringify(this.layout));
                    }
                };
                AppComponent.prototype.load = function () {
                    if (this.api) {
                        this.loadLayout();
                    }
                };
                AppComponent.prototype.clear = function () {
                    this.api.clear();
                    this.layout = null;
                    localStorage.removeItem('floating.layout');
                };
                AppComponent.prototype.addFloatingPanel = function () {
                    this.api.addPanel({
                        id: (++this.panelCount).toString(),
                        title: "Tab ".concat(this.panelCount),
                        component: 'default',
                        floating: { width: 250, height: 150, x: 50, y: 50 },
                    });
                };
                AppComponent.prototype.toggleBounds = function () {
                    this.floatingGroupBounds = this.floatingGroupBounds === undefined
                        ? 'boundedWithinViewport'
                        : undefined;
                };
                AppComponent.prototype.toggleDisableFloating = function () {
                    this.disableFloatingGroups = !this.disableFloatingGroups;
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'app-root',
                        template: "\n        <div style=\"height: 100vh; display: flex; flex-direction: column;\">\n            <div style=\"height: 25px;\">\n                <button (click)=\"save()\">Save</button>\n                <button (click)=\"load()\">Load</button>\n                <button (click)=\"clear()\">Clear</button>\n                <button (click)=\"addFloatingPanel()\">Add Floating Group</button>\n                <button (click)=\"toggleBounds()\">{{ boundsText }}</button>\n                <button (click)=\"toggleDisableFloating()\">{{ disableFloatingText }}</button>\n            </div>\n            <div style=\"flex-grow: 1;\">\n                <dv-dockview\n                    [components]=\"components\"\n                    [watermarkComponent]=\"watermarkComponent\"\n                    [leftHeaderActionsComponent]=\"leftHeaderActionsComponent\"\n                    [rightHeaderActionsComponent]=\"rightHeaderActionsComponent\"\n                    [disableFloatingGroups]=\"disableFloatingGroups\"\n                    [floatingGroupBounds]=\"floatingGroupBounds\"\n                    className=\"dockview-theme-abyss\"\n                    (ready)=\"onReady($event)\">\n                </dv-dockview>\n            </div>\n        </div>\n    "
                    }),
                    __metadata("design:paramtypes", [])
                ], AppComponent);
                return AppComponent;
            }());
            exports_1("AppComponent", AppComponent);
            AppModule = /** @class */ (function () {
                function AppModule() {
                }
                AppModule = __decorate([
                    core_1.NgModule({
                        declarations: [
                            AppComponent,
                            DefaultPanelComponent,
                            WatermarkComponent,
                            LeftHeaderActionsComponent,
                            RightHeaderActionsComponent
                        ],
                        imports: [platform_browser_1.BrowserModule, dockview_angular_1.DockviewAngularModule],
                        providers: [],
                        bootstrap: [AppComponent]
                    })
                ], AppModule);
                return AppModule;
            }());
            exports_1("AppModule", AppModule);
            // Bootstrap the application
            platform_browser_dynamic_1.platformBrowserDynamic().bootstrapModule(AppModule).catch(function (err) { return console.error(err); });
        }
    };
});
