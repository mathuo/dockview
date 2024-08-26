import { fireEvent, render, screen } from '@testing-library/react';
import { DockviewDefaultTab } from '../../dockview/defaultTab';
import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewApi, DockviewPanelApi, TitleEvent } from 'dockview-core';
import { Emitter } from 'dockview-core/dist/cjs/events';
import { act } from 'react-dom/test-utils';
import { Disposable } from 'dockview-core/dist/cjs/lifecycle';

describe('defaultTab', () => {
    test('has close button by default', async () => {
        const api = fromPartial<DockviewPanelApi>({
            onDidTitleChange: jest.fn().mockImplementation(() => Disposable.NONE),
        });
        const containerApi = fromPartial<DockviewApi>({});
        const params = {};

        render(
            <DockviewDefaultTab
                api={api}
                containerApi={containerApi}
                params={params}
            />
        );

        const element = await screen.getByTestId('dockview-dv-default-tab');
        expect(element.querySelector('.dv-default-tab-action')).toBeTruthy();
    });

    test('that title is displayed', async () => {
        const api = fromPartial<DockviewPanelApi>({
            title: 'test_title',
            onDidTitleChange: jest.fn().mockImplementation(() => Disposable.NONE),
        });
        const containerApi = fromPartial<DockviewApi>({});
        const params = {};

        render(
            <DockviewDefaultTab
                api={api}
                containerApi={containerApi}
                params={params}
            />
        );

        const element = await screen.getByTestId('dockview-dv-default-tab');
        expect(
            element.querySelector('.dv-default-tab-content')?.textContent
        ).toBe('test_title');
    });

    test('that title is updated', async () => {
        const onDidTitleChange = new Emitter<TitleEvent>();

        const api = fromPartial<DockviewPanelApi>({
            title: 'test_title',
            onDidTitleChange: onDidTitleChange.event,
        });
        const containerApi = fromPartial<DockviewApi>({});
        const params = {};

        render(
            <DockviewDefaultTab
                api={api}
                containerApi={containerApi}
                params={params}
            />
        );

        let element = await screen.getByTestId('dockview-dv-default-tab');
        expect(
            element.querySelector('.dv-default-tab-content')?.textContent
        ).toBe('test_title');

        act(() => {
            onDidTitleChange.fire({ title: 'test_title_2' });
        });

        element = await screen.getByTestId('dockview-dv-default-tab');
        expect(
            element.querySelector('.dv-default-tab-content')?.textContent
        ).toBe('test_title_2');
    });

    test('has no close button when hideClose=true', async () => {
        const api = fromPartial<DockviewPanelApi>({
            onDidTitleChange: jest.fn().mockImplementation(() => Disposable.NONE),
        });
        const containerApi = fromPartial<DockviewApi>({});
        const params = {};

        render(
            <DockviewDefaultTab
                api={api}
                containerApi={containerApi}
                params={params}
                hideClose={true}
            />
        );

        const element = await screen.getByTestId('dockview-dv-default-tab');
        expect(element.querySelector('.dv-default-tab-action')).toBeNull();
    });

    test('that settings closeActionOverride skips api.close()', async () => {
        const api = fromPartial<DockviewPanelApi>({
            close: jest.fn(),
            onDidTitleChange: jest.fn().mockImplementation(() => Disposable.NONE),
        });
        const containerApi = fromPartial<DockviewApi>({});
        const params = {};

        const closeActionOverride = jest.fn();

        render(
            <DockviewDefaultTab
                api={api}
                containerApi={containerApi}
                params={params}
                closeActionOverride={closeActionOverride}
            />
        );

        const element = await screen.getByTestId('dockview-dv-default-tab');
        const btn = element.querySelector(
            '.dv-default-tab-action'
        ) as HTMLElement;
        fireEvent.click(btn);

        expect(closeActionOverride).toHaveBeenCalledTimes(1);
        expect(api.close).toHaveBeenCalledTimes(0);
    });

    test('that clicking close calls api.close()', async () => {
        const api = fromPartial<DockviewPanelApi>({
            close: jest.fn(),
            onDidTitleChange: jest.fn().mockImplementation(() => Disposable.NONE),
        });
        const containerApi = fromPartial<DockviewApi>({});
        const params = {};

        render(
            <DockviewDefaultTab
                api={api}
                containerApi={containerApi}
                params={params}
            />
        );

        const element = await screen.getByTestId('dockview-dv-default-tab');
        const btn = element.querySelector(
            '.dv-default-tab-action'
        ) as HTMLElement;
        fireEvent.click(btn);

        expect(api.close).toHaveBeenCalledTimes(1);
    });

    test('has close button when hideClose=false', async () => {
        const api = fromPartial<DockviewPanelApi>({
            onDidTitleChange: jest.fn().mockImplementation(() => Disposable.NONE),
        });
        const containerApi = fromPartial<DockviewApi>({});
        const params = {};

        render(
            <DockviewDefaultTab
                api={api}
                containerApi={containerApi}
                params={params}
                hideClose={false}
            />
        );

        const element = await screen.getByTestId('dockview-dv-default-tab');
        expect(element.querySelector('.dv-default-tab-action')).toBeTruthy();
    });

    test('that pointerDown on close button prevents panel becoming active', async () => {
        const api = fromPartial<DockviewPanelApi>({
            setActive: jest.fn(),
            onDidTitleChange: jest.fn().mockImplementation(() => Disposable.NONE),
        });
        const containerApi = fromPartial<DockviewApi>({});
        const params = {};

        render(
            <DockviewDefaultTab
                api={api}
                containerApi={containerApi}
                params={params}
            />
        );

        const element = await screen.getByTestId('dockview-dv-default-tab');
        const btn = element.querySelector(
            '.dv-default-tab-action'
        ) as HTMLElement;

        fireEvent.pointerDown(btn);
        expect(api.setActive).toHaveBeenCalledTimes(0);

        fireEvent.click(element);
        expect(api.setActive).toHaveBeenCalledTimes(1);
    });
});
