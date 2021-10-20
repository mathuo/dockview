import React from 'react';
import { ControlCenter } from '../layout-grid/controlCenter';

export interface RegisteredView {
    id: string;
    icon: string;
    title: string;
    isLocationEditable: boolean;
    component: React.FunctionComponent;
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
    component: () => {
        return (
            <div
                style={{
                    backgroundColor: 'yellow',
                    color: 'black',
                    height: '100%',
                }}
            >
                This is a search bar component
            </div>
        );
    },
});
VIEW_REGISTRY.register({
    id: 'home_widget',
    title: 'Home',
    icon: 'home',
    isLocationEditable: true,
    component: ControlCenter,
});
VIEW_REGISTRY.register({
    id: 'account_widget',
    title: 'Account',
    icon: 'account_circle',
    isLocationEditable: true,
    component: () => {
        return (
            <div
                style={{
                    backgroundColor: 'green',
                    color: 'black',
                    height: '100%',
                }}
            >
                account_circle
            </div>
        );
    },
});
VIEW_REGISTRY.register({
    id: 'settings_widget',
    title: 'Settings',
    icon: 'settings',
    isLocationEditable: true,
    component: () => {
        return (
            <div
                style={{
                    backgroundColor: 'orange',
                    color: 'black',
                    height: '100%',
                }}
            >
                settings
            </div>
        );
    },
});
