import * as React from 'react';

export const BrowserHeader = () => (
    <div
        style={{
            height: '30px',
            borderBottom: '1px solid #BABABA',
            backgroundColor: '#DCDCDC',
            borderTopLeftRadius: '15px',
            borderTopRightRadius: '15px',
            padding: '0px 15px',
            display: 'flex',
            alignItems: 'center',
        }}
    >
        <div
            style={{
                height: '14px',
                width: '14px',
                borderRadius: '100%',
                backgroundColor: '#FD605E',
                marginRight: 7,
            }}
        />
        <div
            style={{
                height: '14px',
                width: '14px',
                borderRadius: '100%',
                backgroundColor: '#FBBC3F',
                marginRight: 7,
            }}
        />
        <div
            style={{
                height: '14px',
                width: '14px',
                borderRadius: '100%',
                backgroundColor: '#34C942',
                marginRight: 7,
            }}
        />
    </div>
);
