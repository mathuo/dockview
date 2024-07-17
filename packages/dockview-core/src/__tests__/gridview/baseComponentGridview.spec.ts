import { Emitter } from '../../events';
import {
    BaseGrid,
    IGridPanelView,
    BaseGridOptions,
} from '../../gridview/baseComponentGridview';
import { IViewSize } from '../../gridview/gridview';
import { CompositeDisposable } from '../../lifecycle';
import {
    PanelInitParameters,
    PanelUpdateEvent,
    Parameters,
} from '../../panel/types';
import { LayoutPriority, Orientation } from '../../splitview/splitview';

class TestPanel implements IGridPanelView {
    _onDidChange = new Emitter<IViewSize | undefined>();
    readonly onDidChange = this._onDidChange.event;

    isVisible: boolean = true;
    isActive: boolean = true;
    params: Parameters = {};

    constructor(
        public readonly id: string,
        public readonly element: HTMLElement,
        public readonly minimumWidth: number,
        public readonly maximumWidth: number,
        public readonly minimumHeight: number,
        public readonly maximumHeight: number,
        public priority: LayoutPriority,
        public snap: boolean
    ) {}

    init(params: PanelInitParameters): void {
        //
    }

    setActive(isActive: boolean): void {
        //
    }

    toJSON(): object {
        return {};
    }

    layout(width: number, height: number): void {
        //
    }

    update(event: PanelUpdateEvent<Parameters>): void {
        //
    }

    focus(): void {
        //
    }

    fromJSON(json: object): void {
        //
    }

    dispose(): void {
        //
    }
}

class ClassUnderTest extends BaseGrid<TestPanel> {
    readonly gridview = this.gridview;

    constructor(options: BaseGridOptions) {
        super(options);
    }

    doRemoveGroup(
        group: TestPanel,
        options?: { skipActive?: boolean; skipDispose?: boolean }
    ): TestPanel {
        return super.doRemoveGroup(group, options);
    }

    doAddGroup(group: TestPanel, location?: number[], size?: number): void {
        this._groups.set(group.id, {
            value: group,
            disposable: {
                dispose: () => {
                    //
                },
            },
        });
        super.doAddGroup(group, location, size);
    }

    public fromJSON(data: any): void {
        //
    }

    public toJSON(): object {
        return {};
    }

    public clear(): void {
        //
    }
}

describe('baseComponentGridview', () => {
    test('that .layout(...) force flag works', () => {
        const cut = new ClassUnderTest({
            parentElement: document.createElement('div'),
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: true,
        });

        const spy = jest.spyOn(cut.gridview, 'layout');

        cut.layout(100, 100);
        expect(spy).toHaveBeenCalledTimes(1);

        cut.layout(100, 100, false);
        expect(spy).toHaveBeenCalledTimes(1);

        cut.layout(100, 100, true);
        expect(spy).toHaveBeenCalledTimes(2);

        cut.layout(150, 150, false);
        expect(spy).toHaveBeenCalledTimes(3);

        cut.layout(150, 150, true);
        expect(spy).toHaveBeenCalledTimes(4);
    });

    test('can add group', () => {
        const cut = new ClassUnderTest({
            parentElement: document.createElement('div'),
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: true,
        });

        const events: { type: string; panel: TestPanel | undefined }[] = [];

        const disposable = new CompositeDisposable(
            cut.onDidAdd((event) => {
                events.push({ type: 'add', panel: event });
            }),
            cut.onDidRemove((event) => {
                events.push({ type: 'remove', panel: event });
            }),
            cut.onDidActiveChange((event) => {
                events.push({ type: 'active', panel: event });
            })
        );

        const panel1 = new TestPanel(
            'id',
            document.createElement('div'),
            0,
            100,
            0,
            100,
            LayoutPriority.Normal,
            false
        );

        cut.doAddGroup(panel1);

        expect(events.length).toBe(1);
        expect(events[0]).toEqual({ type: 'add', panel: panel1 });

        const panel2 = new TestPanel(
            'id',
            document.createElement('div'),
            0,
            100,
            0,
            100,
            LayoutPriority.Normal,
            false
        );

        cut.doAddGroup(panel2);

        expect(events.length).toBe(2);
        expect(events[1]).toEqual({ type: 'add', panel: panel2 });

        cut.doRemoveGroup(panel1);
        expect(events.length).toBe(3);
        expect(events[2]).toEqual({ type: 'remove', panel: panel1 });

        disposable.dispose();
        cut.dispose();
    });
});
