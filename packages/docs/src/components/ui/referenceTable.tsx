import * as React from 'react';

export interface ReferenceProps {
    props: {
        prop: string;
        default?: string;
        type: string;
    }[];
}

export const ReferenceTable = (props: ReferenceProps) => {
    return (
        <table style={{ fontSize: '14px' }}>
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Default</th>
                </tr>
            </thead>
            <tbody>
                {props.props.map((property) => {
                    return (
                        <tr key={property.prop}>
                            <td>
                                <code>{property.prop}</code>
                            </td>
                            <td>
                                <code>{property.type}</code>
                            </td>
                            <td>
                                {property.default !== undefined && (
                                    <code>{property.default}</code>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
