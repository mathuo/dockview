import { OverflowObserver } from '../../../dom';
import {
    CompositeDisposable,
    Disposable,
    MutableDisposable,
} from '../../../lifecycle';
import { createExpandMoreButton } from '../../../svg';
import { DockviewComponent } from '../../dockviewComponent';
import { Tab } from '../tab/tab';

export class TabsPanel extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly _tabsList: HTMLElement;
    private readonly _overflowDropdown: HTMLElement;

    private _tabs: Tab[] = [];
    private _selectedIndex = -1;

    private _dropdownHandle = new MutableDisposable();

    get element(): HTMLElement {
        return this._element;
    }

    get tabs(): Tab[] {
        return this._tabs;
    }

    constructor(private readonly accessor: DockviewComponent) {
        super();

        this._element = document.createElement('div');
        this._element.className = 'tabs-container';

        this._tabsList = document.createElement('div');
        this._tabsList.className = 'dv-tabs-list';

        this._overflowDropdown = document.createElement('div');
        this._overflowDropdown.className = 'dv-tabs-list-overflow';

        this._element.appendChild(this._tabsList);
        this._element.appendChild(this._overflowDropdown);

        const btn = createExpandMoreButton();
        this._overflowDropdown.appendChild(btn);
        this._overflowDropdown.addEventListener('click', () => {
            this.createDropdown();
        });

        const tabsContainerOverflowObserver = new OverflowObserver(
            this._tabsList
        );

        this.addDisposables(
            this._dropdownHandle,
            tabsContainerOverflowObserver,
            tabsContainerOverflowObserver.onDidChange((e) => {
                this.toggleObstructedTabs();
            }),
            Disposable.from(() => {
                for (const tab of this.tabs) {
                    tab.dispose();
                }
                this._tabs = [];
            })
        );
    }

    private _obstructedTabs: number = -1;

    toggleObstructedTabs(): void {
        const containerScrollLeft = this._tabsList.offsetLeft;
        const trueWidth = this._tabsList.clientWidth;

        const runningTotal = -containerScrollLeft;

        this._obstructedTabs = this.tabs.findIndex((tab, i) => {
            const right =
                tab.element.offsetLeft +
                tab.element.clientWidth -
                containerScrollLeft;
            const isObstructed = right > trueWidth;
            return isObstructed;
        });

        for (let i = 0; i < this.tabs.length; i++) {
            const element = this.tabs[i].element;

            if (this._obstructedTabs !== -1 && i >= this._obstructedTabs) {
                if (element.parentElement === this._tabsList) {
                    element.remove();
                }
            } else {
                if (element.parentElement !== this._tabsList) {
                    this._tabsList.append(element);
                }
            }
        }
    }

    private createDropdown(): void {
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'dv-dropdown-container';

        for (let i = this._obstructedTabs; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const dropdownItemContainer = document.createElement('div');
            dropdownItemContainer.className = 'dv-dropdown-item';
            dropdownContainer.appendChild(tab.element);
        }

        this._dropdownHandle.value = Disposable.from(() => {
            dropdownContainer.remove();
        });

        this.accessor.element
            .querySelector('.dv-dockview')!
            .appendChild(dropdownContainer);
    }

    isActive(tab: Tab): boolean {
        return (
            this._selectedIndex > -1 && this.tabs[this._selectedIndex] === tab
        );
    }

    removeTab(id: string): void {
        const index = this.tabs.findIndex((tab) => tab.panel.id === id);

        const tabToRemove = this.tabs.splice(index, 1)[0];

        tabToRemove.dispose();
        tabToRemove.element.remove();
    }

    addTab(tab: Tab, index = this._tabs.length): void {
        if (index < 0 || index > this._tabs.length) {
            throw new Error('invalid location');
        }

        this._tabsList.insertBefore(
            tab.element,
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

        this.toggleObstructedTabs();
    }
}
