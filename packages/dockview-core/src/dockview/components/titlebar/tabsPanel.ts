import { OverflowObserver } from '../../../dom';
import {
    addDisposableListener,
    addDisposableWindowListener,
} from '../../../events';
import {
    CompositeDisposable,
    Disposable,
    IValueDisposable,
    MutableDisposable,
} from '../../../lifecycle';
import { DockviewComponent } from '../../dockviewComponent';
import { Tab } from '../tab/tab';

class Dropdown {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.height = '200px';
        this._element.style.width = '200px';
        this._element.style.position = 'absolute';
        this._element.style.top = '0px';
        this._element.style.right = '0px';
        this._element.style.backgroundColor = 'yellow';
    }
}

export class TabsPanel extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly _tabsList: HTMLElement;

    private _tabs: IValueDisposable<Tab>[] = [];
    private _selectedIndex = -1;
    private _hasOverflow = false;
    private _dropdownAnchor: HTMLElement | null = null;

    get element(): HTMLElement {
        return this._element;
    }

    get panels(): string[] {
        return this._tabs.map((_) => _.value.panel.id);
    }

    get length(): number {
        return this._tabs.length;
    }

    get tabs(): Tab[] {
        return this._tabs.map((tab) => tab.value);
    }

    constructor(private readonly accessor: DockviewComponent) {
        super();
        this._element = document.createElement('div');
        this._element.className = 'dv-tabs-panel';
        this._element.style.display = 'flex';
        this._element.style.overflow = 'auto';
        this._tabsList = document.createElement('div');
        this._tabsList.className = 'dv-tabs-container';
        this._element.appendChild(this._tabsList);

        const overflowObserver = new OverflowObserver(this._tabsList);

        this.addDisposables(
            overflowObserver,
            overflowObserver.onDidChange((event) => {
                const hasOverflow = event.hasScrollX || event.hasScrollY;
                if (this._hasOverflow !== hasOverflow) {
                    this.toggleDropdown(hasOverflow);
                }
            }),
            Disposable.from(() => {
                for (const { value, disposable } of this._tabs) {
                    disposable.dispose();
                    value.dispose();
                }

                this._tabs = [];
            })
        );
    }

    toggleDropdown(show: boolean): void {
        this._hasOverflow = show;
        if (this._dropdownAnchor) {
            this._dropdownAnchor.remove();
            this._dropdownAnchor = null;
        }

        if (!show) {
            return;
        }

        this._dropdownAnchor = document.createElement('div');
        this._dropdownAnchor.style.width = '10px';
        this._dropdownAnchor.style.height = '100%';
        this._dropdownAnchor.style.flexShrink = '0';
        this._dropdownAnchor.style.backgroundColor = 'red';

        this.element.appendChild(this._dropdownAnchor);

        addDisposableListener(this._dropdownAnchor, 'click', (event) => {
            const el = document.createElement('div');
            el.style.width = '200px';
            el.style.maxHeight = '600px';
            el.style.overflow = 'auto';
            el.style.backgroundColor = 'lightgreen';

            this.tabs.map((tab) => {
                const tabEl = document.createElement('div');
                tabEl.textContent = tab.panel.api.title ?? '-';
                el.appendChild(tabEl);
            });

            this.accessor.popupService.openPopover(el, {
                x: event.clientX,
                y: event.clientY,
            });
        });
    }

    addTab(tab: IValueDisposable<Tab>, index: number = this.length): void {
        if (index < 0 || index > this.length) {
            throw new Error('invalid location');
        }

        this._tabsList.insertBefore(
            tab.value.element,
            this._tabsList.children[index]
        );

        this._tabs = [
            ...this._tabs.slice(0, index),
            tab,
            ...this._tabs.slice(index),
        ];

        if (this._selectedIndex < 0) {
            this._selectedIndex = index;
        }
    }

    delete(id: string): void {
        const index = this.tabs.findIndex((tab) => tab.panel.id === id);

        const tabToRemove = this._tabs.splice(index, 1)[0];

        const { value, disposable } = tabToRemove;

        disposable.dispose();
        value.dispose();
        value.element.remove();
    }

    isActive(tab: Tab): boolean {
        return (
            this._selectedIndex > -1 &&
            this._tabs[this._selectedIndex].value === tab
        );
    }

    indexOf(id: string): number {
        return this._tabs.findIndex((tab) => tab.value.panel.id === id);
    }
}
