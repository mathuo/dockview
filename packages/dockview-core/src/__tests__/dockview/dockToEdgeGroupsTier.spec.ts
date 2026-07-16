import { DockviewComponent } from '../../dockview/dockviewComponent';
import { AllModules } from '../../dockview/allModules';
import { IContentRenderer } from '../../dockview/types';
import { DockviewComponentOptions } from '../../dockview/options';
import { LocalSelectionTransfer, PanelTransfer } from '../../dnd/dataTransfer';
import { _resetMissingModuleWarnings } from '../../dockview/modules';

class TestPanel implements IContentRenderer {
    element = document.createElement('div');
    init(): void {
        // noop
    }
    layout(): void {
        // noop
    }
    dispose(): void {
        // noop
    }
}

/**
 * Docking a dragged panel to a layout edge is an AutoEdgeGroup (enterprise)
 * feature — `features.mdx` ticks only the Enterprise column. Core used to carry
 * a single-band fallback that performed the dock whenever the module was
 * absent, which handed the feature to free builds; these tests pin the tier
 * boundary so it can't come back.
 *
 * `AllModules` is core-only, so this file always runs as a free build: the
 * enterprise modules self-register on import of `dockview-enterprise`, which
 * this package never imports.
 */
describe('dockToEdgeGroups is enterprise-only', () => {
    /** `DEFAULT_ROOT_OVERLAY_MODEL.activationSize` in rootDropTargetService. */
    const DEFAULT_ACTIVATION = 10;

    const transfer = LocalSelectionTransfer.getInstance<PanelTransfer>();

    let dockview: DockviewComponent;
    const built: DockviewComponent[] = [];

    /** A component with only core modules — i.e. the free package. */
    function freeDockview(
        options: Partial<DockviewComponentOptions>
    ): DockviewComponent {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const dv = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            modules: AllModules,
            ...options,
        } as never);
        dv.layout(1000, 800);
        built.push(dv);
        return dv;
    }

    beforeEach(() => {
        // The missing-module dedup is page-global and outlives a test, so
        // without this only the first component built in this file would log.
        _resetMissingModuleWarnings();
        jest.spyOn(console, 'error').mockImplementation(() => undefined);

        dockview = freeDockview({ dockToEdgeGroups: true });
    });

    afterEach(() => {
        transfer.clearData(PanelTransfer.prototype);
        for (const dv of built.splice(0)) {
            dv.dispose();
        }
        jest.restoreAllMocks();
    });

    /**
     * The resolved edge activation band, read off the drop target the service
     * built. Reaches through privates deliberately: the band is not exposed
     * anywhere public, and the alternative — simulating dragover at a measured
     * offset — would assert the same thing through far more machinery.
     */
    function bandActivationSize(dv: DockviewComponent): number | undefined {
        const svc = (dv as never as { _rootDropTargetService: unknown })
            ._rootDropTargetService as {
            _html5Target: {
                options: {
                    overlayModel?: { activationSize?: { value?: number } };
                };
            };
        };
        return svc._html5Target.options.overlayModel?.activationSize?.value;
    }

    function dragPanelToEdge(panelId: string, groupId: string): void {
        transfer.setData(
            [new PanelTransfer(dockview.id, groupId, panelId)],
            PanelTransfer.prototype
        );
        dockview.dockToLayoutEdge(new MouseEvent('drop') as never, 'left');
    }

    test('a root-edge drop does not create an edge group', () => {
        const a = dockview.addPanel({ id: 'a', component: 'default' });
        dockview.addPanel({ id: 'b', component: 'default' });

        dragPanelToEdge('a', a.group.id);

        // The dock is the paid behaviour: without AutoEdgeGroup the drop must
        // fall through to the ordinary grid split, leaving no edge group.
        expect(dockview.getEdgeGroup('left')).toBeUndefined();
        expect(
            dockview.groups.filter((g) => g.model.location.type === 'edge')
        ).toEqual([]);
    });

    test('the panel is still moved — the drop degrades, it does not vanish', () => {
        const a = dockview.addPanel({ id: 'a', component: 'default' });
        dockview.addPanel({ id: 'b', component: 'default' });

        dragPanelToEdge('a', a.group.id);

        expect(dockview.panels.map((p) => p.id).sort()).toEqual(['a', 'b']);
    });

    test('the option does not widen the edge activation band', () => {
        // The widened band exists to fit the affordance's outer "dock as edge
        // group" sub-band. With no affordance nothing consumes it, so widening
        // would only enlarge the plain grid-split trigger — a bigger target for
        // behaviour the default band already gives.
        //
        // Pinned to the concrete default rather than compared against a second
        // free build: two builds agreeing proves nothing if the band ever
        // resolves to undefined. 32 is the widened value this must never be —
        // see the enterprise-side edgeDragRevealBand spec for the positive.
        expect(bandActivationSize(dockview)).toBe(DEFAULT_ACTIVATION);
        expect(
            bandActivationSize(freeDockview({ dockToEdgeGroups: undefined }))
        ).toBe(DEFAULT_ACTIVATION);
    });

    test('setting the option reports the missing module', () => {
        // The option is inert here, so the diagnostic is the only thing telling
        // the user why — see optionsModules.ts.
        const messages = (console.error as jest.Mock).mock.calls.map(
            (c) => c[0] as string
        );
        expect(messages.some((m) => m.includes('AutoEdgeGroup'))).toBe(true);
    });
});
