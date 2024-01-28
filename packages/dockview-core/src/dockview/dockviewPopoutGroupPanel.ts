import { CompositeDisposable } from '../lifecycle';
import { PopoutWindow } from '../popoutWindow';
import { Box } from '../types';

export class DockviewPopoutGroupPanel extends CompositeDisposable {
    readonly window: PopoutWindow;

    constructor(
        readonly id: string,
        private readonly options: {
            className: string;
            popoutUrl: string;
            box: Box;
            onDidOpen?: (event: { id: string; window: Window }) => void;
            onWillClose?: (event: { id: string; window: Window }) => void;
        }
    ) {
        super();

        this.window = new PopoutWindow(id, options.className ?? '', {
            url: this.options.popoutUrl,
            left: this.options.box.left,
            top: this.options.box.top,
            width: this.options.box.width,
            height: this.options.box.height,
            onDidOpen: this.options.onDidOpen,
            onWillClose: this.options.onWillClose,
        });

        this.addDisposables(
            this.window,
            this.window.onDidClose(() => {
                this.dispose();
            })
        );
    }

    open(): Promise<HTMLElement | null> {
        const didOpen = this.window.open();

        return didOpen;
    }
}
