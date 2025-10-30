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
    var platform_browser_dynamic_1, core_1, platform_browser_1, dockview_angular_1, DefaultPanelComponent, AppComponent, AppModule;
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
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", Object)
                ], DefaultPanelComponent.prototype, "api", void 0);
                DefaultPanelComponent = __decorate([
                    core_1.Component({
                        selector: 'default-panel',
                        template: "<div style=\"padding: 10px; color: white; background: #1e1e1e;\">Panel {{ api?.id || 'Unknown' }}</div>"
                    }),
                    __metadata("design:paramtypes", [])
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
                    api.addPanel({
                        id: 'panel_1',
                        component: 'default',
                        size: 200,
                    });
                    api.addPanel({
                        id: 'panel_2',
                        component: 'default',
                        size: 300,
                    });
                    api.addPanel({
                        id: 'panel_3',
                        component: 'default',
                        size: 200,
                    });
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'app-root',
                        template: "\n        <div style=\"height: 100vh;\">\n            <dv-splitview\n                [components]=\"components\"\n                className=\"dockview-theme-abyss\"\n                orientation=\"horizontal\"\n                (ready)=\"onReady($event)\">\n            </dv-splitview>\n        </div>\n    "
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
                        declarations: [AppComponent, DefaultPanelComponent],
                        imports: [platform_browser_1.BrowserModule, dockview_angular_1.DockviewAngularModule],
                        providers: [],
                        bootstrap: [AppComponent]
                    })
                ], AppModule);
                return AppModule;
            }());
            exports_1("AppModule", AppModule);
            platform_browser_dynamic_1.platformBrowserDynamic().bootstrapModule(AppModule).catch(function (err) { return console.error(err); });
        }
    };
});
