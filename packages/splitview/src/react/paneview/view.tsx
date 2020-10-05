import * as React from 'react';
import { CompositeDisposable } from '../../lifecycle';
import { Pane } from '../../paneview/paneview';
import { ReactPortalStore } from '../dockview/dockview';
import { ReactPart } from '../react';
import { IPaneviewPanelProps } from './paneview';

const DefaultHeader = (props: IPaneviewPanelProps) => {
    const [url, setUrl] = React.useState<string>(
        props.api.isExpanded
            ? 'https://fonts.gstatic.com/s/i/materialicons/expand_more/v6/24px.svg'
            : 'https://fonts.gstatic.com/s/i/materialicons/chevron_right/v7/24px.svg'
    );
    const onClick = () => {
        props.api.setExpanded(!props.api.isExpanded);
    };

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidExpansionChange((event) => {
                setUrl(
                    event.isExpanded
                        ? 'https://fonts.gstatic.com/s/i/materialicons/expand_more/v6/24px.svg'
                        : 'https://fonts.gstatic.com/s/i/materialicons/chevron_right/v7/24px.svg'
                );
            })
        );

        return () => {
            disposable.dispose();
        };
    });

    return (
        <div
            style={{
                display: 'flex',
                fontSize: '11px',
                textTransform: 'uppercase',
                cursor: 'pointer',
            }}
            onClick={onClick}
        >
            <div style={{ width: '20px' }}>
                <a
                    style={{
                        WebkitMask: `url(${url}) 50% 50% / 100% 100% no-repeat`,
                        height: '100%',
                        display: 'block',
                        backgroundColor: 'lightgray',
                    }}
                />
            </div>
            <span>{props.title}</span>
        </div>
    );
};

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
            { ...this.params.params, title: this.params.title }
        );
    }

    getHeaderComponent() {
        return new ReactPart(
            this.header,
            this.api,
            this.reactPortalStore,
            DefaultHeader,
            { ...this.params.params, title: this.params.title }
        );
    }
}
