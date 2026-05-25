import { IDisposable } from '../lifecycle';
import { addTestId } from '../dom';
import { IWatermarkRenderer } from './types';
import { DockviewApi } from '../api/component.api';
import { defineModule } from './modules';

export interface IWatermarkHost {
    readonly api: DockviewApi;
    readonly mountElement: HTMLElement;
    createWatermarkComponent(): IWatermarkRenderer;
    hasVisibleGridGroup(): boolean;
}

export interface IWatermarkService extends IDisposable {
    /** Mount or unmount the watermark based on current grid state. */
    update(): void;
    /** Tear down the current watermark and re-evaluate. Used when the watermark factory option changes. */
    refresh(): void;
}

export class WatermarkService implements IWatermarkService {
    private readonly _host: IWatermarkHost;
    private _watermark: IWatermarkRenderer | null = null;

    constructor(host: IWatermarkHost) {
        this._host = host;
    }

    update(): void {
        if (this._host.hasVisibleGridGroup()) {
            this._unmount();
            return;
        }
        if (this._watermark) {
            return;
        }
        this._watermark = this._host.createWatermarkComponent();
        this._watermark.init({ containerApi: this._host.api });

        const container = document.createElement('div');
        container.className = 'dv-watermark-container';
        addTestId(container, 'watermark-component');
        container.appendChild(this._watermark.element);

        this._host.mountElement.appendChild(container);
    }

    refresh(): void {
        this._unmount();
        this.update();
    }

    private _unmount(): void {
        if (!this._watermark) {
            return;
        }
        this._watermark.element.parentElement!.remove();
        this._watermark.dispose?.();
        this._watermark = null;
    }

    dispose(): void {
        this._unmount();
    }
}

export const WatermarkModule = defineModule<
    'watermarkService',
    IWatermarkHost
>({
    name: 'Watermark',
    serviceKey: 'watermarkService',
    create: (host) => new WatermarkService(host),
});
