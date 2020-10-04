import { IGroupPanel } from './parts';
import { GroupPanelApi } from '../../api/groupPanelApi';
import { Event } from '../../events';
import { IGroupview, GroupChangeKind } from '../groupview';
import { MutableDisposable, CompositeDisposable } from '../../lifecycle';
import {
    PanelContentPart,
    PanelHeaderPart,
    IGroupPanelInitParameters,
} from './parts';
import { PanelUpdateEvent } from '../../panel/types';

export class DefaultPanel extends CompositeDisposable implements IGroupPanel {
    private readonly mutableDisposable = new MutableDisposable();

    private readonly api: GroupPanelApi;
    private _group: IGroupview;
    private params: IGroupPanelInitParameters;

    readonly onDidStateChange: Event<any>;

    private headerPart: PanelHeaderPart;
    private contentPart: PanelContentPart;

    get group() {
        return this._group;
    }

    get header() {
        return this.headerPart;
    }

    get content() {
        return this.contentPart;
    }

    constructor(public readonly id: string) {
        super();

        this.api = new GroupPanelApi(this, this._group);
        this.onDidStateChange = this.api.onDidStateChange;

        this.addDisposables(
            this.api.onDidTitleChange((event) => {
                const title = event.title;
                this.update({ params: { title } });
            })
        );
    }

    public setDirty(isDirty: boolean) {
        this.api._onDidDirtyChange.fire(isDirty);
    }

    public close(): Promise<boolean> {
        if (this.api.tryClose) {
            return this.api.tryClose();
        }

        return Promise.resolve(true);
    }

    public toJSON(): object {
        return {
            id: this.id,
            content: this.contentPart.toJSON(),
            tab: this.headerPart.toJSON(),
            props: this.params.params,
            title: this.params.title,
            suppressClosable: this.params.suppressClosable,
            state: this.api.getState(),
        };
    }

    public update(params: PanelUpdateEvent): void {
        this.params.params = { ...this.params.params, ...params };

        this.contentPart.update(params);
        this.headerPart.update(params);
    }

    public init(params: IGroupPanelInitParameters): void {
        this.params = params;
        this.contentPart = params.contentPart;
        this.headerPart = params.headerPart;

        this.api.setState(this.params.state);
        if (this.content.init) {
            this.content.init({ ...params, api: this.api, accessor: null });
        }
        if (this.header.init) {
            this.header.init({ ...params, api: this.api, accessor: null });
        }
    }

    public setVisible(isGroupActive: boolean, group: IGroupview) {
        this._group = group;
        this.api.group = group;

        this.mutableDisposable.value = this._group.onDidGroupChange((ev) => {
            if (ev.kind === GroupChangeKind.GROUP_ACTIVE) {
                this.api._onDidGroupPanelVisibleChange.fire({
                    isVisible: this._group.isPanelActive(this),
                });
            }
        });

        this.api._onDidChangeFocus.fire({ isFocused: isGroupActive });
        this.api._onDidGroupPanelVisibleChange.fire({
            isVisible: this._group.isPanelActive(this),
        });

        this.api._onDidGroupPanelVisibleChange.fire({
            isVisible: this._group.isPanelActive(this),
        });

        if (this.headerPart.setVisible) {
            this.headerPart.setVisible(
                this._group.isPanelActive(this),
                isGroupActive
            );
        }
        if (this.contentPart.setVisible) {
            this.contentPart.setVisible(
                this._group.isPanelActive(this),
                isGroupActive
            );
        }
    }

    public layout(width: number, height: number) {
        // the obtain the correct dimensions of the content panel we must deduct the tab height
        this.api._onDidPanelDimensionChange.fire({
            width,
            height: height - (this.group?.tabHeight || 0),
        });
    }

    public dispose() {
        this.api.dispose();
        this.mutableDisposable.dispose();

        this.headerPart.dispose();
        this.contentPart.dispose();
    }
}
