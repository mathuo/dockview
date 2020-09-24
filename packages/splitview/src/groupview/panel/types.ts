import { IGroupview } from '../groupview';
import { IDisposable, ISerializable } from '../../lifecycle';
import { Event } from '../../events';
import { PanelHeaderPart, PanelContentPart, ClosePanelResult } from './parts';
import { IPanel } from '../../panel/types';
import { IGroupPanelInitParameters } from './parts';

export interface IGroupPanel extends IDisposable, ISerializable, IPanel {
    id: string;
    header: PanelHeaderPart;
    content: PanelContentPart;
    group: IGroupview;
    focus(): void;
    onHide(): void;
    setVisible(isGroupActive: boolean, group: IGroupview): void;
    setDirty(isDirty: boolean): void;
    close?(): Promise<ClosePanelResult>;
    init?(params: IGroupPanelInitParameters): void;
    onDidStateChange: Event<any>;
}
