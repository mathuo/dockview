import * as React from 'react';
import { convertMarkdown } from '../util/markdown';
import { themeConfig } from '../config/theme.config';
import { cssVariableConfig } from '../config/cssVariable.config';

type Description = { key: string; text: string };

export const Table = (props: { title: string; values: Description[] }) => {
    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>{props.title}</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {props.values.map((value) => {
                        return (
                            <tr key={value.key}>
                                <td>
                                    {
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: convertMarkdown(
                                                    value.key
                                                ),
                                            }}
                                        />
                                    }
                                </td>
                                <td>
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: convertMarkdown(value.text),
                                        }}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </>
    );
};

export const CSSVariablesTable = () => {
    return <Table title="Variable" values={cssVariableConfig} />;
};

export const ThemeTable = () => {
    return <Table title="Theme" values={themeConfig} />;
};
