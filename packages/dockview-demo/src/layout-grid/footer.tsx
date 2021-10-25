import * as React from 'react';
import { IGridviewPanelProps } from 'dockview';
import { atom, useRecoilValue } from 'recoil';

export const selectedPanelAtom = atom<string>({
    key: 'selectedPanelAtom',
    default: '',
});

export const Footer = (props: IGridviewPanelProps) => {
    const selectedPanel = useRecoilValue(selectedPanelAtom);

    return (
        <div
            style={{
                height: '22px',
                backgroundColor: 'dodgerblue',
                display: 'flex',
                alignItems: 'center',
                padding: '0px 8px',
            }}
        >
            <span style={{ flexGrow: 1 }} />
            <span>{selectedPanel}</span>
        </div>
    );
};
