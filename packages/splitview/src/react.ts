import { IPanel, ClosePanelResult } from "./groupview/group";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Event, Emitter } from "./events";
import { IGroupItem, IGroupview, GroupChangeKind } from "./groupview/groupview";
import { IDisposable, MutableDisposable } from "./types";

type PanelStateChangeEvent = {
  isPanelVisible: boolean;
  isGroupActive: boolean;
};

type PanelApi = {
  onDidPanelStateChange: Event<PanelStateChangeEvent>;
  isPanelVisible: boolean;
  isGroupActive: boolean;
  group: IGroupview;
  close: () => Promise<void>;
};

class PanelApiImpl implements PanelApi {
  private _isPanelVisible: boolean;
  private _isGroupActive: boolean;
  private _group: IGroupview;

  get onDidPanelStateChange() {
    return this._event;
  }

  get isGroupActive() {
    return this._isGroupActive;
  }

  get isPanelVisible() {
    return this._isPanelVisible;
  }

  set group(value: IGroupview) {
    this._group = value;
  }

  get group() {
    return this._group;
  }

  constructor(
    private _event: Event<PanelStateChangeEvent>,
    private panel: IPanel,
    group: IGroupview
  ) {
    this._group = group;

    this._event((event) => {
      this._isGroupActive = event.isGroupActive;
      this._isPanelVisible = event.isPanelVisible;
    });
  }

  public close() {
    return this.group.closePanel(this.panel);
  }
}

export interface IPanelProps {
  api: PanelApi;
}

export class ReactJS_Panel implements IPanel {
  private mutableDisposable = new MutableDisposable();
  private readonly _onDidPanelStateChange = new Emitter<PanelStateChangeEvent>({
    emitLastValue: true,
  });
  private readonly api: PanelApi;
  private group: IGroupview;

  private _header: HTMLElement;
  private _content: HTMLElement;
  //
  private headerPortal: { portal: React.ReactPortal; disposable: IDisposable };
  private contentPortal: { portal: React.ReactPortal; disposable: IDisposable };
  //

  get header() {
    return this._header;
  }

  get content() {
    return this._content;
  }

  constructor(
    public readonly id: string,
    private readonly options: {
      header: {
        component: React.FunctionComponent<IPanelProps & {}>;
        props: {};
      };
      content: {
        component: React.FunctionComponent<IPanelProps & {}>;
        props: {};
      };
      addPortal: (portal: React.ReactPortal) => IDisposable;
    }
  ) {
    this.api = new PanelApiImpl(
      this._onDidPanelStateChange.event,
      this,
      this.group
    );

    this._content = document.createElement("div");
    this._header = document.createElement("div");

    const headerPortal = ReactDOM.createPortal(
      React.createElement(this.options.header.component, {
        api: this.api,
        ...this.options.header.props,
      } as IPanelProps),
      this.header
    );

    const contentPortal = ReactDOM.createPortal(
      React.createElement(this.options.content.component, {
        api: this.api,
        ...this.options.header.props,
      } as IPanelProps),
      this.content
    );

    this.headerPortal = {
      portal: headerPortal,
      disposable: this.options.addPortal(headerPortal),
    };
    this.contentPortal = {
      portal: contentPortal,
      disposable: this.options.addPortal(contentPortal),
    };
  }

  public async close() {
    if (confirm("Are you sure you want to close this panel?")) {
      return Promise.resolve(ClosePanelResult.CLOSE);
    } else {
      return Promise.resolve(ClosePanelResult.DONT_CLOSE);
    }
  }

  public setVisible(visible: boolean, group: IGroupview) {
    this.group = group;
    this.api.group = group;

    const isGroupActive = group.active;

    this.mutableDisposable.value = this.group.onDidGroupChange((ev) => {
      if (ev.kind === GroupChangeKind.GROUP_ACTIVE) {
        //
        this._onDidPanelStateChange.fire({
          isGroupActive: visible,
          isPanelVisible: this.group.isActive(this),
        });
      }
    });

    this._onDidPanelStateChange.fire({
      isGroupActive,
      isPanelVisible: visible,
    });
  }

  public onHide() {}

  public focus() {}

  public dispose() {
    this.mutableDisposable.dispose();
    this._onDidPanelStateChange.dispose();

    this.headerPortal.disposable.dispose();
    this.contentPortal.disposable.dispose();

    this.headerPortal = undefined;
    this.contentPortal = undefined;
  }
}
