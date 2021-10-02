export interface RegisteredView {
    id: string;
    icon: string;
    title: string;
    isLocationEditable: boolean;
}

export interface IViewRegistry {
    getRegisteredView(id: string): RegisteredView | undefined;
}

export class ViewRegistry {
    private readonly _registry = new Map<string, RegisteredView>();

    register(registeredView: RegisteredView): void {
        this._registry.set(registeredView.id, registeredView);
    }

    getRegisteredView(id: string): RegisteredView | undefined {
        return this._registry.get(id);
    }
}

export const VIEW_REGISTRY = new ViewRegistry();

VIEW_REGISTRY.register({
    id: 'search_widget',
    title: 'search',
    icon: 'search',
    isLocationEditable: false,
});
VIEW_REGISTRY.register({
    id: 'home_widget',
    title: 'Home',
    icon: 'home',
    isLocationEditable: true,
});
VIEW_REGISTRY.register({
    id: 'account_widget',
    title: 'Account',
    icon: 'account_circle',
    isLocationEditable: true,
});
VIEW_REGISTRY.register({
    id: 'settings_widget',
    title: 'Settings',
    icon: 'settings',
    isLocationEditable: true,
});
