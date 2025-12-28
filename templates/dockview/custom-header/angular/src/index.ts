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
    var platform_browser_dynamic_1, core_1, platform_browser_1, dockview_angular_1, DefaultPanelComponent, CustomTabComponent, AppComponent, AppModule;
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
                    this.running = false;
                }
                Object.defineProperty(DefaultPanelComponent.prototype, "title", {
                    get: function () {
                        var _a;
                        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.title) || 'Panel';
                    },
                    enumerable: false,
                    configurable: true
                });
                DefaultPanelComponent.prototype.ngOnInit = function () {
                    // Component initialization
                };
                DefaultPanelComponent.prototype.ngOnDestroy = function () {
                    this.stopUpdating();
                };
                DefaultPanelComponent.prototype.toggleRunning = function () {
                    this.running = !this.running;
                    if (this.running) {
                        this.startUpdating();
                    }
                    else {
                        this.stopUpdating();
                    }
                };
                DefaultPanelComponent.prototype.startUpdating = function () {
                    var _this = this;
                    var _a;
                    if (this.interval) {
                        clearInterval(this.interval);
                    }
                    (_a = this.api) === null || _a === void 0 ? void 0 : _a.updateParameters({ myValue: Date.now() });
                    this.interval = setInterval(function () {
                        var _a;
                        (_a = _this.api) === null || _a === void 0 ? void 0 : _a.updateParameters({ myValue: Date.now() });
                    }, 1000);
                };
                DefaultPanelComponent.prototype.stopUpdating = function () {
                    if (this.interval) {
                        clearInterval(this.interval);
                        this.interval = null;
                    }
                };
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
                        template: "\n        <div style=\"height: 100%; padding: 20px; color: white;\">\n            <div>{{ title }}</div>\n            <button (click)=\"toggleRunning()\">{{ running ? 'Stop' : 'Start' }}</button>\n            <span>value: {{ params?.myValue }}</span>\n        </div>\n    "
                    })
                ], DefaultPanelComponent);
                return DefaultPanelComponent;
            }());
            exports_1("DefaultPanelComponent", DefaultPanelComponent);
            CustomTabComponent = /** @class */ (function () {
                function CustomTabComponent() {
                }
                Object.defineProperty(CustomTabComponent.prototype, "title", {
                    get: function () {
                        var _a;
                        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.title) || 'Tab';
                    },
                    enumerable: false,
                    configurable: true
                });
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", Object)
                ], CustomTabComponent.prototype, "api", void 0);
                __decorate([
                    core_1.Input(),
                    __metadata("design:type", Object)
                ], CustomTabComponent.prototype, "params", void 0);
                CustomTabComponent = __decorate([
                    core_1.Component({
                        selector: 'custom-tab',
                        template: "\n        <div>\n            <div>custom tab: {{ title }}</div>\n            <span>value: {{ params?.myValue }}</span>\n        </div>\n    "
                    })
                ], CustomTabComponent);
                return CustomTabComponent;
            }());
            exports_1("CustomTabComponent", CustomTabComponent);
            AppComponent = /** @class */ (function () {
                function AppComponent() {
                    this.components = {
                        default: DefaultPanelComponent,
                    };
                    this.tabComponents = {
                        default: CustomTabComponent,
                    };
                }
                AppComponent.prototype.onReady = function (event) {
                    event.api.addPanel({
                        id: 'panel_1',
                        component: 'default',
                        tabComponent: 'default',
                        params: {
                            myValue: Date.now(),
                        },
                    });
                    event.api.addPanel({
                        id: 'panel_2',
                        component: 'default',
                        tabComponent: 'default',
                        params: {
                            myValue: Date.now(),
                        },
                    });
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'app-root',
                        template: "\n        <div style=\"height: 100vh;\">\n            <dv-dockview\n                [components]=\"components\"\n                [tabComponents]=\"tabComponents\"\n                className=\"dockview-theme-abyss\"\n                (ready)=\"onReady($event)\">\n            </dv-dockview>\n        </div>\n    "
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
                        declarations: [AppComponent, DefaultPanelComponent, CustomTabComponent],
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
