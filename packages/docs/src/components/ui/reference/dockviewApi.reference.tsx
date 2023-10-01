import { ReactPropDocsTable } from '../referenceTable';
import * as React from 'react';

export default () => (
    <ReactPropDocsTable
        title="Dockview API"
        url="https://dockview.dev/typedocs/classes/dockview_core.DockviewApi.html"
        data={[
            {
                property: 'id',
                propertyDescription:
                    'The unique id associated with the dock instance',
                type: 'string',
            },
            {
                property: 'width',
                type: 'number',
            },
            {
                property: 'height',
                type: 'number',
            },
            {
                property: 'minimumHeight',
                type: 'number',
            },
            {
                property: 'maximumHeight',
                type: 'number',
            },
            {
                property: 'minimumWidth',
                type: 'number',
            },
            {
                property: 'maximumWidth',
                type: 'number',
            },
            {
                property: 'size',
                propertyDescription: 'Total number of groups',
                type: 'number',
            },
            {
                property: 'totalPanels',
                propertyDescription: 'Total number of panels',
                type: 'number',
            },
            {
                property: 'onDidActiveGroupChange',
                type: 'Event<DockviewGroupPanel | undefined>',
            },
            {
                property: 'onDidAddGroup',
                type: 'Event<DockviewGroupPanel>',
            },
            {
                property: 'onDidRemoveGroup',
                type: 'Event<DockviewGroupPanel>',
            },
            {
                property: 'onDidActivePanelChange',
                type: 'Event<IDockviewPanel | undefined>',
            },
            {
                property: 'onDidAddPanel',
                type: 'Event<IDockviewPanel>',
            },
            {
                property: 'onDidRemovePanel',
                type: 'Event<IDockviewPanel>',
            },
            {
                property: 'onDidLayoutFromJSON',
                type: 'Event<void>',
            },
            {
                property: 'onDidLayoutChange',
                type: 'Event<void>',
            },
            {
                property: 'onDidDrop',
                type: 'Event<DockviewDropEvent>',
            },
            {
                property: 'onWillDragGroup',
                type: 'Event<GroupDragEvent>',
            },
            {
                property: 'onWillDragPanel',
                type: 'Event<TabDragEvent>',
            },
            {
                property: 'panels',
                type: 'IDockviewPanel[]',
            },
            {
                property: 'groups',
                type: 'DockviewGroupPanel[]',
            },
            {
                property: 'activePanel',
                type: 'IDockviewPanel | undefined',
            },
            {
                property: 'activeGroup',
                type: 'DockviewGroupPanel | undefined',
            },
            {
                property: 'focus',
                type: '(): void',
            },
            {
                property: 'getPanel',
                type: '(id: string): IDockviewPanel | undefined',
            },
            {
                property: 'layout',
                type: '(width: number, height: number): void',
            },
            {
                property: 'addPanel',
                type: 'addPanel(options: AddPanelOptions): void',
            },
            {
                property: 'removePanel',
                type: '(panel: IDockviewPanel): void',
            },
            {
                property: 'addGroup',
                type: '(options?: AddGroupOptions): DockviewGroupPanel',
            },
            {
                property: 'moveToNext',
                type: '(options?: MovementOptions): void',
            },
            {
                property: 'moveToPrevious',
                type: '(options?: MovementOptions): void',
            },
            {
                property: 'closeAllGroups',
                type: '(): void',
            },
            {
                property: 'removeGroup',
                type: '(group: IDockviewGroupPanel): void ',
            },
            {
                property: 'getGroup',
                type: '(id: string): DockviewGroupPanel | undefined',
            },
            {
                property: 'addFloatingGroup',
                type: '(item: IDockviewPanel | DockviewGroupPanel, coord?: { x: number, y: number }): void',
            },
            {
                property: 'fromJSON',
                type: '(data: SerializedDockview): void',
            },
            {
                property: 'toJSON',
                type: '(): SerializedDockview ',
            },
            {
                property: 'clear',
                type: '(): void',
            },
        ]}
    />
);
