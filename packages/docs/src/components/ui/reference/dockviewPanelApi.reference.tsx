import { ReactPropDocsTable } from '../referenceTable';
import * as React from 'react';

export default () => (
    <ReactPropDocsTable
        title="Dockview Panel API"
        url="https://dockview.dev/typedocs/interfaces/dockview_core.DockviewPanelApi.html"
        data={[
            {
                property: 'group',
                type: 'DockviewGroupPanel',
            },
            {
                property: 'isGroupActive',
                type: 'boolean',
            },
            {
                property: 'title',
                type: 'string | undefined',
            },
            {
                property: 'group',
                type: 'DockviewGroupPanel',
            },
            {
                property: 'onDidActiveGroupChange',
                type: 'Event<void>',
            },
            {
                property: 'onDidGroupChange',
                type: 'Event<void>',
            },
            {
                property: 'close',
                type: '(): void',
            },
            {
                property: 'setTitle',
                type: '(title: string): void',
            },
            {
                property: 'moveTo',
                type: '(options: { group: DockviewGroupPanel, position?: Position, index?: number }): void',
            },
            {
                property: 'setSize',
                type: '(event: SizeEvent): void',
            },
            {
                property: 'onDidDimensionsChange',
                type: 'Event<PanelDimensionChangeEvent>',
            },
            {
                property: 'onDidFocusChange',
                type: 'Event<FocusEvent>',
            },
            {
                property: 'onDidVisibilityChange',
                type: 'Event<VisibilityEvent>',
            },
            {
                property: 'onDidActiveChange',
                type: 'Event<ActiveEvent>',
            },
            {
                property: 'setVisible',
                type: '(isVisible: boolean): void',
            },
            {
                property: 'setActive',
                type: '(): void',
            },
            {
                property: 'updateParameters',
                type: '(parameters: Parameters): void',
            },
            {
                property: 'id',
                type: 'string',
            },
            {
                property: 'isFocused',
                type: 'boolean',
            },
            {
                property: 'isActive',
                type: 'boolean',
            },
            {
                property: 'isVisible',
                type: 'boolean',
            },
            {
                property: 'width',
                type: 'number',
            },
            {
                property: 'height',
                type: 'number',
            },
        ]}
    />
);
