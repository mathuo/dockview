import { DockviewApi } from '../../../../api/component.api';
import { DockviewPanelApi, TitleEvent } from '../../../../api/dockviewPanelApi';
import { DefaultTab } from '../../../../dockview/components/tab/defaultTab';
import { fromPartial } from '@total-typescript/shoehorn';
import { Emitter } from '../../../../events';
import { fireEvent } from '@testing-library/dom';

describe('defaultTab', () => {
    test('that title updates', () => {
        const cut = new DefaultTab();

        let el = cut.element.querySelector('.dv-default-tab-content');
        expect(el).toBeTruthy();
        expect(el!.textContent).toBe('');

        const onDidTitleChange = new Emitter<TitleEvent>();

        const api = fromPartial<DockviewPanelApi>({
            onDidTitleChange: onDidTitleChange.event,
        });
        const containerApi = fromPartial<DockviewApi>({});

        cut.init({
            api,
            containerApi,
            params: {},
            title: 'title_abc',
        });

        el = cut.element.querySelector('.dv-default-tab-content');
        expect(el).toBeTruthy();
        expect(el!.textContent).toBe('title_abc');

        onDidTitleChange.fire({ title: 'title_def' });

        expect(el!.textContent).toBe('title_def');
    });

    test('that click closes tab', () => {
        const cut = new DefaultTab();

        const api = fromPartial<DockviewPanelApi>({
            onDidTitleChange: jest.fn(),
            close: jest.fn(),
        });
        const containerApi = fromPartial<DockviewApi>({});

        cut.init({
            api,
            containerApi,
            params: {},
            title: 'title_abc',
        });

        let el = cut.element.querySelector('.dv-default-tab-action');

        fireEvent.pointerDown(el!);
        expect(api.close).toHaveBeenCalledTimes(0);

        fireEvent.click(el!);
        expect(api.close).toHaveBeenCalledTimes(1);
    });

    test('that close button prevents default behavior', () => {
        const cut = new DefaultTab();

        const api = fromPartial<DockviewPanelApi>({
            onDidTitleChange: jest.fn(),
            close: jest.fn(),
        });
        const containerApi = fromPartial<DockviewApi>({});

        cut.init({
            api,
            containerApi,
            params: {},
            title: 'title_abc',
        });

        let el = cut.element.querySelector('.dv-default-tab-action');

        // Create a custom event to verify preventDefault is called
        const clickEvent = new Event('click', { cancelable: true });
        const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

        el!.dispatchEvent(clickEvent);

        expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
        expect(api.close).toHaveBeenCalledTimes(1);
    });

    test('that close button respects already prevented events', () => {
        const cut = new DefaultTab();

        const api = fromPartial<DockviewPanelApi>({
            onDidTitleChange: jest.fn(),
            close: jest.fn(),
        });
        const containerApi = fromPartial<DockviewApi>({});

        cut.init({
            api,
            containerApi,
            params: {},
            title: 'title_abc',
        });

        let el = cut.element.querySelector('.dv-default-tab-action');

        // Create a custom event and prevent it before dispatching
        const clickEvent = new Event('click', { cancelable: true });
        clickEvent.preventDefault();

        el!.dispatchEvent(clickEvent);

        // Close should not be called if event was already prevented
        expect(api.close).not.toHaveBeenCalled();
    });

    test('that close button is visible by default', () => {
        const cut = new DefaultTab();

        const api = fromPartial<DockviewPanelApi>({
            onDidTitleChange: jest.fn(),
            close: jest.fn(),
        });
        const containerApi = fromPartial<DockviewApi>({});

        cut.init({
            api,
            containerApi,
            params: {},
            title: 'title_abc',
        });

        let el = cut.element.querySelector(
            '.dv-default-tab-action'
        ) as HTMLElement;
        expect(el).toBeTruthy();
        expect(el.style.display).not.toBe('none');
    });
});
