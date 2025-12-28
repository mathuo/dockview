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
    var platform_browser_dynamic_1, core_1, platform_browser_1, dockview_angular_1, DefaultPanelComponent, RightHeaderActionsComponent, LeftHeaderActionsComponent, PrefixHeaderActionsComponent, AppComponent, AppModule;
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
                        var _a;
                        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.title) || 'Panel';
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
                        template: "\n        <div style=\"display: flex; justify-content: center; align-items: center; color: gray; height: 100%;\">\n            <span>{{ title }}</span>\n        </div>\n    "
                    })
                ], DefaultPanelComponent);
                return DefaultPanelComponent;
            }());
            exports_1("DefaultPanelComponent", DefaultPanelComponent);
            RightHeaderActionsComponent = /** @class */ (function () {
                function RightHeaderActionsComponent() {
                }
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", Boolean)
                ], RightHeaderActionsComponent.prototype, "isGroupActive", void 0);
                RightHeaderActionsComponent = __decorate([
                    core_1.Component({
                        selector: 'right-header-actions',
                        template: "\n        <div class=\"dockview-groupcontrol-demo\">\n            <span class=\"dockview-groupcontrol-demo-group-active\" \n                  [style.background]=\"isGroupActive ? 'green' : 'red'\">\n                {{ isGroupActive ? 'Group Active' : 'Group Inactive' }}\n            </span>\n        </div>\n    ",
                        styles: ["\n        .dockview-groupcontrol-demo {\n            height: 100%;\n            display: flex;\n            align-items: center;\n            color: white;\n            background-color: black;\n            padding: 0px 8px;\n            margin: 1px;\n            border: 1px dotted orange;\n        }\n        \n        .dockview-groupcontrol-demo-group-active {\n            padding: 0px 8px;\n        }\n    "]
                    })
                ], RightHeaderActionsComponent);
                return RightHeaderActionsComponent;
            }());
            exports_1("RightHeaderActionsComponent", RightHeaderActionsComponent);
            LeftHeaderActionsComponent = /** @class */ (function () {
                function LeftHeaderActionsComponent() {
                }
                var _a;
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", typeof (_a = typeof dockview_angular_1.DockviewPanel !== "undefined" && dockview_angular_1.DockviewPanel) === "function" ? _a : Object)
                ], LeftHeaderActionsComponent.prototype, "activePanel", void 0);
                LeftHeaderActionsComponent = __decorate([
                    core_1.Component({
                        selector: 'left-header-actions',
                        template: "\n        <div class=\"dockview-groupcontrol-demo\">\n            <span class=\"dockview-groupcontrol-demo-active-panel\">\n                activePanel: {{ activePanel?.id || 'null' }}\n            </span>\n        </div>\n    ",
                        styles: ["\n        .dockview-groupcontrol-demo {\n            height: 100%;\n            display: flex;\n            align-items: center;\n            color: white;\n            background-color: black;\n            padding: 0px 8px;\n            margin: 1px;\n            border: 1px dotted orange;\n        }\n        \n        .dockview-groupcontrol-demo-active-panel {\n            color: yellow;\n            padding: 0px 8px;\n        }\n    "]
                    })
                ], LeftHeaderActionsComponent);
                return LeftHeaderActionsComponent;
            }());
            exports_1("LeftHeaderActionsComponent", LeftHeaderActionsComponent);
            PrefixHeaderActionsComponent = /** @class */ (function () {
                function PrefixHeaderActionsComponent() {
                }
                var _b;
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", typeof (_b = typeof dockview_angular_1.DockviewPanel !== "undefined" && dockview_angular_1.DockviewPanel) === "function" ? _b : Object)
                ], PrefixHeaderActionsComponent.prototype, "activePanel", void 0);
                PrefixHeaderActionsComponent = __decorate([
                    core_1.Component({
                        selector: 'prefix-header-actions',
                        template: "\n        <div class=\"dockview-groupcontrol-demo\">\uD83C\uDF32</div>\n    ",
                        styles: ["\n        .dockview-groupcontrol-demo {\n            height: 100%;\n            display: flex;\n            align-items: center;\n            color: white;\n            background-color: black;\n            padding: 0px 8px;\n            margin: 1px;\n            border: 1px dotted orange;\n        }\n    "]
                    })
                ], PrefixHeaderActionsComponent);
                return PrefixHeaderActionsComponent;
            }());
            exports_1("PrefixHeaderActionsComponent", PrefixHeaderActionsComponent);
            AppComponent = /** @class */ (function () {
                function AppComponent() {
                    this.prefixHeaderActionsComponent = PrefixHeaderActionsComponent;
                    this.leftHeaderActionsComponent = LeftHeaderActionsComponent;
                    this.rightHeaderActionsComponent = RightHeaderActionsComponent;
                    this.components = {
                        default: DefaultPanelComponent,
                    };
                }
                AppComponent.prototype.onReady = function (event) {
                    event.api.addPanel({
                        id: 'panel_1',
                        component: 'default',
                        title: 'Panel 1',
                    });
                    event.api.addPanel({
                        id: 'panel_2',
                        component: 'default',
                        title: 'Panel 2',
                        position: {
                            direction: 'right',
                        },
                    });
                    event.api.addPanel({
                        id: 'panel_3',
                        component: 'default',
                        title: 'Panel 3',
                        position: {
                            direction: 'below',
                        },
                    });
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'app-root',
                        template: "\n        <div style=\"height: 100vh;\">\n            <dv-dockview\n                [components]=\"components\"\n                [prefixHeaderActionsComponent]=\"prefixHeaderActionsComponent\"\n                [leftHeaderActionsComponent]=\"leftHeaderActionsComponent\"\n                [rightHeaderActionsComponent]=\"rightHeaderActionsComponent\"\n                className=\"dockview-theme-abyss\"\n                (ready)=\"onReady($event)\">\n            </dv-dockview>\n        </div>\n    "
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
                            RightHeaderActionsComponent,
                            LeftHeaderActionsComponent,
                            PrefixHeaderActionsComponent
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
