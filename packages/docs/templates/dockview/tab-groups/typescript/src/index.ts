import { LicenseManager } from 'dockview-enterprise';
import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    GroupPanelPartInitParameters,
    IContentRenderer,
    themeAbyss,
} from 'dockview';

// dockview.dev docs license key — replace with your own key in production.
LicenseManager.setLicenseKey(
    '[KeyId:DOCKVIEW-DOCS]_[Company:Dockview]_[Plan:team]_[AppName:Dockview_Docs]_[Email:enterprise@dockview.dev]_[ValidFrom:01_Jan_2025]_[ValidUntil:01_Jan_2099]__aaa294ecec1eed47'
);

class Panel implements IContentRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.padding = '10px';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = parameters.title ?? 'Panel';
    }
}

const api = createDockview(document.getElementById('app'), {
    theme: { ...themeAbyss, tabAnimation: 'smooth' },
    disableFloatingGroups: true,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
    getTabGroupChipContextMenuItems: () => ['rename', 'colorPicker'],
});

const titles = [
    'Dashboard',
    'Settings',
    'Users',
    'Analytics',
    'Reports',
    'Billing',
    'Notifications',
    'Logs',
];

const firstPanel = api.addPanel({
    id: 'panel_1',
    component: 'default',
    title: titles[0],
});

for (let i = 1; i < titles.length; i++) {
    api.addPanel({
        id: `panel_${i + 1}`,
        component: 'default',
        title: titles[i],
    });
}

const groupId = firstPanel.group.id;

const featureGroup = api.createTabGroup({
    groupId,
    label: 'Feature',
    color: 'blue',
});
['panel_1', 'panel_2', 'panel_3', 'panel_4'].forEach((panelId) => {
    api.addPanelToTabGroup({ groupId, tabGroupId: featureGroup.id, panelId });
});

const monitoringGroup = api.createTabGroup({
    groupId,
    label: 'Monitoring',
    color: 'purple',
});
['panel_5', 'panel_7', 'panel_8'].forEach((panelId) => {
    api.addPanelToTabGroup({
        groupId,
        tabGroupId: monitoringGroup.id,
        panelId,
    });
});
monitoringGroup.collapse();
