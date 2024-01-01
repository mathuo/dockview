import { CompositeDisposable } from '../lifecycle';
import { PopoutWindow } from '../popoutWindow';
import { Box } from '../types';
import { DockviewGroupPanel } from './dockviewGroupPanel';

export class DockviewPopoutGroupPanel extends CompositeDisposable {
    readonly window: PopoutWindow;

    constructor(
        readonly group: DockviewGroupPanel,
        private readonly options: {
            className: string;
            popoutUrl: string;
            box: Box;
        }
    ) {
        super();

        this.window = new PopoutWindow('test', options.className ?? '', {
            url: this.options.popoutUrl,
            left: this.options.box.left,
            top: this.options.box.top,
            width: this.options.box.width,
            height: this.options.box.height,
        });

        group.model.location = 'popout';

        this.addDisposables(
            this.window,
            {
                dispose: () => {
                    group.model.location = 'grid';
                },
            },
            this.window.onDidClose(() => {
                this.dispose();
            })
        );

        this.window.open(group.element);
    }
}
