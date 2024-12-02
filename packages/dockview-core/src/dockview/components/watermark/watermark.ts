import {
    IWatermarkRenderer,
    WatermarkRendererInitParameters,
} from '../../types';
import { CompositeDisposable } from '../../../lifecycle';

export class Watermark
    extends CompositeDisposable
    implements IWatermarkRenderer
{
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        super();
        this._element = document.createElement('div');
        this._element.className = 'dv-watermark';
    }

    init(_params: WatermarkRendererInitParameters): void {
        // noop
    }
}
