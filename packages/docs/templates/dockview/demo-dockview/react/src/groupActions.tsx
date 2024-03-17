import React from 'react';
import { DockviewApi } from 'dockview';

export const GroupActions = (props: {
    groups: string[];
    api?: DockviewApi;
    activeGroup?: string;
}) => {
    return (
        <div className="action-container">
            {props.groups.map((x) => {
                const onClick = () => {
                    props.api?.getGroup(x)?.focus();
                };
                return (
                    <div className="button-action">
                        <div style={{ display: 'flex' }}>
                            <button
                                onClick={onClick}
                                className={
                                    props.activeGroup === x
                                        ? 'demo-button selected'
                                        : 'demo-button'
                                }
                            >
                                {x}
                            </button>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <button
                                className="demo-icon-button"
                                onClick={() => {
                                    const panel = props.api?.getGroup(x);
                                    if (panel) {
                                        props.api?.addFloatingGroup(panel);
                                    }
                                }}
                            >
                                <span className="material-symbols-outlined">
                                    ad_group
                                </span>
                            </button>
                            <button
                                className="demo-icon-button"
                                onClick={() => {
                                    const panel = props.api?.getGroup(x);
                                    if (panel) {
                                        props.api?.addPopoutGroup(panel);
                                    }
                                }}
                            >
                                <span className="material-symbols-outlined">
                                    open_in_new
                                </span>
                            </button>
                            <button
                                className="demo-icon-button"
                                onClick={() => {
                                    const panel = props.api?.getGroup(x);
                                    if (panel?.api.isMaximized()) {
                                        panel.api.exitMaximized();
                                    } else {
                                        panel?.api.maximize();
                                    }
                                }}
                            >
                                <span className="material-symbols-outlined">
                                    fullscreen
                                </span>
                            </button>
                            <button
                                className="demo-icon-button"
                                onClick={() => {
                                    const panel = props.api?.getGroup(x);
                                    panel?.api.close();
                                }}
                            >
                                <span className="material-symbols-outlined">
                                    close
                                </span>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
