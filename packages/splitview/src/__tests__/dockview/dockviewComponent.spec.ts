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

    setVisible(isPanelVisible: boolean, group: IGroupview): void {
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
        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        const panel = dockview.getGroupPanel('panel1');
        expect(panel?.id).toBe('panel1');
    });
});
