import { SimpleSplitview } from './simpleSplitview';
import * as React from 'react';

export const SimpleSplitview2 = (props: { proportional?: boolean }) => {
    const [value, setValue] = React.useState<number>(50);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(Number(event.target.value));
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100px',
                margin: '10px 0px',
            }}
        >
            <div
                style={{
                    height: '25px',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <input
                    type={'range'}
                    min={20}
                    max={100}
                    defaultValue={50}
                    value={value}
                    onChange={onChange}
                />
                <span style={{ padding: '0px 8px' }}>
                    Slide to resize the splitview container
                </span>
            </div>
            <div
                style={{
                    flexGrow: 1,
                    display: 'grid',
                    gridTemplateColumns: `${value}fr ${100 - value}fr`,
                }}
            >
                <div
                    style={{
                        backgroundColor: 'rgb(30,30,30)',
                        color: 'white',
                        flexGrow: 1,
                        border: '1px solid grey',
                    }}
                >
                    <SimpleSplitview proportional={props.proportional} />
                </div>
                <div></div>
            </div>
        </div>
    );
};
