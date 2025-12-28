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
    var platform_browser_dynamic_1, core_1, platform_browser_1, dockview_angular_1, DefaultPanelComponent, WatermarkComponent, AppComponent, AppModule;
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
                        template: "\n        <div style=\"height: 100%; padding: 20px;\">\n            {{ title }}\n        </div>\n    "
                    }),
                    __metadata("design:paramtypes", [])
                ], DefaultPanelComponent);
                return DefaultPanelComponent;
            }());
            exports_1("DefaultPanelComponent", DefaultPanelComponent);
            WatermarkComponent = /** @class */ (function () {
                function WatermarkComponent() {
                }
                Object.defineProperty(WatermarkComponent.prototype, "isGroup", {
                    get: function () {
                        var _a;
                        return ((_a = this.containerApi) === null || _a === void 0 ? void 0 : _a.groups.length) > 0;
                    },
                    enumerable: false,
                    configurable: true
                });
                WatermarkComponent.prototype.addPanel = function () {
                    this.containerApi.addPanel({
                        id: Date.now().toString(),
                        component: 'default',
                        params: { title: 'New Panel' }
                    });
                };
                WatermarkComponent.prototype.closeGroup = function () {
                    var _a;
                    (_a = this.group) === null || _a === void 0 ? void 0 : _a.api.close();
                };
                var _a;
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", typeof (_a = typeof dockview_angular_1.DockviewApi !== "undefined" && dockview_angular_1.DockviewApi) === "function" ? _a : Object)
                ], WatermarkComponent.prototype, "containerApi", void 0);
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", Object)
                ], WatermarkComponent.prototype, "group", void 0);
                WatermarkComponent = __decorate([
                    core_1.Component({
                        selector: 'watermark-panel',
                        template: "\n        <div style=\"height: 100%; display: flex; justify-content: center; align-items: center; color: white;\">\n            <div style=\"display: flex; flex-direction: column;\">\n                <span>This is a custom watermark. You can change this content.</span>\n                <span>\n                    <button (click)=\"addPanel()\" style=\"margin: 10px;\">Add New Panel</button>\n                </span>\n                <span *ngIf=\"isGroup\">\n                    <button (click)=\"closeGroup()\" style=\"margin: 10px;\">Close Group</button>\n                </span>\n            </div>\n        </div>\n    "
                    })
                ], WatermarkComponent);
                return WatermarkComponent;
            }());
            exports_1("WatermarkComponent", WatermarkComponent);
            AppComponent = /** @class */ (function () {
                function AppComponent() {
                    this.watermarkComponent = WatermarkComponent;
                    this.components = {
                        default: DefaultPanelComponent,
                    };
                }
                AppComponent.prototype.onReady = function (event) {
                    this.api = event.api;
                    // Start with empty layout to show watermark
                    event.api.fromJSON({
                        grid: {
                            orientation: dockview_angular_1.Orientation.HORIZONTAL,
                            root: { type: 'branch', data: [] },
                            height: 100,
                            width: 100,
                        },
                        panels: {},
                    });
                };
                AppComponent.prototype.addEmptyGroup = function () {
                    if (this.api) {
                        this.api.addGroup();
                    }
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'app-root',
                        template: "\n        <div style=\"height: 100vh; display: flex; flex-direction: column;\">\n            <div>\n                <button (click)=\"addEmptyGroup()\" style=\"margin: 10px;\">Add Empty Group</button>\n            </div>\n            <dv-dockview\n                [components]=\"components\"\n                [watermarkComponent]=\"watermarkComponent\"\n                className=\"dockview-theme-abyss\"\n                (ready)=\"onReady($event)\"\n                style=\"flex: 1;\">\n            </dv-dockview>\n        </div>\n    "
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
                        declarations: [AppComponent, DefaultPanelComponent, WatermarkComponent],
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
