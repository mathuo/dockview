import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IGroupview } from '../../groupview/groupview';
import {
    GroupPanelPartInitParameters,
    PanelContentPart,
} from '../../groupview/types';
import { PanelUpdateEvent } from '../../panel/types';

class PanelContentPartTest implements PanelContentPart {
    element: HTMLElement = document.createElement('div');

    constructor(public readonly id: string, component: string) {}

    updateParentGroup(group: IGroupview, isPanelVisible: boolean): void {
        //noop
    }

    init(parameters: GroupPanelPartInitParameters): void {
        //noop
    }

    layout(width: number, height: number): void {
        //noop
    }

    update(event: PanelUpdateEvent): void {
        //noop
    }

    toJSON(): object {
        return {};
    }

    focus(): void {
        //noop
    }

    dispose(): void {
        //noop
    }
}

describe('dockviewComponent', () => {
    let element: HTMLElement;
    let dockview: DockviewComponent;

    beforeEach(() => {
        element = document.createElement('div');
        dockview = new DockviewComponent(element, {
            components: {
                default: PanelContentPartTest,
            },
        });
    });

    test('add panel', () => {
        dockview.layout(500, 1000);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        const panel1 = dockview.getGroupPanel('panel1');

        expect(panel1!.api.id).toBe('panel1');
        expect(panel1!.api.isVisible).toBeTruthy();
        expect(panel1!.api.isActive).toBeTruthy();
        // expect(panel1?.api.isFocused).toBeTruthy();
        expect(panel1!.api.height).toBe(1000);
        expect(panel1!.api.width).toBe(500);
        expect(panel1!.api.group).toBe(panel1?.group);
        expect(panel1!.api.group.isActive).toBeTruthy();
        expect(panel1!.api.isGroupActive).toBeTruthy();

        dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        expect(panel1?.api.isActive).toBeFalsy();
        // expect(panel1?.api.isFocused).toBeFalsy();
        expect(panel1?.api.isVisible).toBeFalsy();
        expect(panel1!.api.isGroupActive).toBeTruthy();
        expect(panel1!.api.group.isActive).toBeTruthy();

        const panel2 = dockview.getGroupPanel('panel2');

        expect(panel2!.api.id).toBe('panel2');
        expect(panel2!.api.isVisible).toBeTruthy();
        expect(panel2!.api.isActive).toBeTruthy();
        // expect(panel2?.api.isFocused).toBeTruthy();
        expect(panel2!.api.height).toBe(1000);
        expect(panel2!.api.width).toBe(500);
        expect(panel2!.api.group).toBe(panel2?.group);
        expect(panel2!.api.isGroupActive).toBeTruthy();
        expect(panel2!.api.group.isActive).toBeTruthy();

        dockview.addPanel({
            id: 'panel3',
            component: 'default',
            position: { referencePanel: 'panel1', direction: 'right' },
        });

        expect(panel1!.api.isActive).toBeFalsy();
        expect(panel1!.api.isVisible).toBeFalsy();
        expect(panel1!.api.isGroupActive).toBeFalsy();
        expect(panel1!.api.group.isActive).toBeFalsy();
        expect(panel2!.api.isActive).toBeFalsy();
        expect(panel2!.api.isVisible).toBeTruthy();
        expect(panel2!.api.isGroupActive).toBeFalsy();
        expect(panel2!.api.group.isActive).toBeFalsy();

        const panel3 = dockview.getGroupPanel('panel3');

        expect(panel3!.api.isActive).toBeTruthy();
        expect(panel3!.api.isGroupActive).toBeTruthy();
        expect(panel3!.api.group.isActive).toBeTruthy();

        dockview.setActivePanel(panel1!);

        expect(panel1!.api.isActive).toBeTruthy();
        expect(panel1!.api.isVisible).toBeTruthy();
        expect(panel1!.api.isGroupActive).toBeTruthy();
        expect(panel1!.api.group.isActive).toBeTruthy();
        expect(panel2!.api.isActive).toBeFalsy();
        expect(panel2!.api.isVisible).toBeFalsy();
        expect(panel2!.api.isGroupActive).toBeTruthy();
        expect(panel2!.api.group.isActive).toBeTruthy();
        expect(panel3!.api.isActive).toBeFalsy();
        expect(panel3!.api.isVisible).toBeTruthy();
        expect(panel3!.api.isGroupActive).toBeFalsy();
        expect(panel3!.api.group.isActive).toBeFalsy();
    });
});
