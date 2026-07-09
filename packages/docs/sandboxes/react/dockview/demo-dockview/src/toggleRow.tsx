import * as React from 'react';
import { Segmented } from './sidebarKit';

// Labelled segmented toggle used by the theme builder. Thin wrapper over the
// shared kit `Segmented` so every toggle reads identically across both tabs.
export const ToggleRow = (props: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) => (
    <Segmented
        label={props.label}
        value={props.value}
        options={props.options}
        onChange={props.onChange}
    />
);
