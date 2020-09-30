import * as React from 'react';
import { Pane } from '../../paneview/paneview';
import { ReactPortalStore } from '../dockview/dockview';
import { ReactPart } from '../react';
import { IPaneviewPanelProps } from './paneview';

export class PaneReact extends Pane {
    constructor(
        id: string,
        component: string,
        private readonly reactComponent: React.FunctionComponent<
            IPaneviewPanelProps
        >,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        super(id, component);

        this.addDisposables(
            this.onDidChangeExpansionState((isExpanded) => {
                this.api._onDidExpansionChange.fire({ isExpanded });
            })
        );
    }

    getComponent() {
        return new ReactPart(
            this.body,
            this.api,
            this.reactPortalStore,
            this.reactComponent,
            this.params
        );
    }

    getHeaderComponent() {
        return new ReactPart(
            this.header,
            this.api,
            this.reactPortalStore,
            (props: IPaneviewPanelProps) => {
                const onClick = () => {
                    props.api.setExpanded(!props.api.isExpanded);
                };
                return <div onClick={onClick}>header</div>;
            },
            this.params
        );
    }
}
