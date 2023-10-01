import * as React from 'react';
import './referenceTable.scss';

export interface ReferenceProps {
    title?: string;
    url?: string;
    data: {
        property: string;
        propertyDescription?: string;
        default?: string;
        type: string;
        typeDescription?: string;
    }[];
}

import * as Popover from '@radix-ui/react-popover';
import { InfoCircledIcon } from '@radix-ui/react-icons';

export const ReactPropDocsTable = (props: ReferenceProps) => {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {props.title && <span>{props.title}</span>}
                {props.url && (
                    <button>
                        <a href={props.url}>{'See API documentation'}</a>
                    </button>
                )}
            </div>
            <table className="ref-table">
                <thead>
                    <tr>
                        <th className="ref-table-property">Property</th>
                        <th className="ref-table-type">Type</th>
                        <th className="ref-table-default">Default</th>
                    </tr>
                </thead>
                <tbody>
                    {props.data.map((item) => {
                        return (
                            <tr key={item.property}>
                                <td className="ref-table-property">
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <code>{item.property}</code>
                                        {item.propertyDescription && (
                                            <Popover.Root>
                                                <Popover.Trigger>
                                                    <InfoCircledIcon className="ref-table-icon" />
                                                </Popover.Trigger>
                                                <Popover.Portal>
                                                    <Popover.Content className="ref-table-popover">
                                                        <div>
                                                            {
                                                                item.propertyDescription
                                                            }
                                                        </div>
                                                    </Popover.Content>
                                                </Popover.Portal>
                                            </Popover.Root>
                                        )}
                                    </span>
                                </td>
                                <td className="ref-table-type">
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <code>{item.type}</code>
                                        {item.typeDescription && (
                                            <Popover.Root>
                                                <Popover.Trigger>
                                                    <InfoCircledIcon className="ref-table-icon" />
                                                </Popover.Trigger>
                                                <Popover.Portal>
                                                    <Popover.Content className="ref-table-popover">
                                                        <div>
                                                            <code>
                                                                {
                                                                    item.typeDescription
                                                                }
                                                            </code>
                                                        </div>
                                                    </Popover.Content>
                                                </Popover.Portal>
                                            </Popover.Root>
                                        )}
                                    </span>
                                </td>
                                <td className="ref-table-default">
                                    {item.default ? (
                                        <code>{item.default}</code>
                                    ) : (
                                        <span>{'-'}</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export const ClassDocsTable = (props: ReferenceProps) => {
    return (
        <div>
            <div>{props.title && <span>{props.title}</span>}</div>
            <table className="ref-table">
                <thead>
                    <tr>
                        <th className="ref-table-property">Property</th>
                        <th className="ref-table-type">Type</th>
                        <th className="ref-table-default">Default</th>
                    </tr>
                </thead>
                <tbody>
                    {props.data.map((item) => {
                        return (
                            <tr key={item.property}>
                                <td className="ref-table-property">
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <code>{item.property}</code>
                                        {item.propertyDescription && (
                                            <Popover.Root>
                                                <Popover.Trigger>
                                                    <InfoCircledIcon className="ref-table-icon" />
                                                </Popover.Trigger>
                                                <Popover.Portal>
                                                    <Popover.Content className="ref-table-popover">
                                                        <div>
                                                            {
                                                                item.propertyDescription
                                                            }
                                                        </div>
                                                    </Popover.Content>
                                                </Popover.Portal>
                                            </Popover.Root>
                                        )}
                                    </span>
                                </td>
                                <td className="ref-table-type">
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <code>{item.type}</code>
                                        {item.typeDescription && (
                                            <Popover.Root>
                                                <Popover.Trigger>
                                                    <InfoCircledIcon className="ref-table-icon" />
                                                </Popover.Trigger>
                                                <Popover.Portal>
                                                    <Popover.Content className="ref-table-popover">
                                                        <div>
                                                            <code>
                                                                {
                                                                    item.typeDescription
                                                                }
                                                            </code>
                                                        </div>
                                                    </Popover.Content>
                                                </Popover.Portal>
                                            </Popover.Root>
                                        )}
                                    </span>
                                </td>
                                <td className="ref-table-default">
                                    {item.default ? (
                                        <code>{item.default}</code>
                                    ) : (
                                        <span>{'-'}</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
