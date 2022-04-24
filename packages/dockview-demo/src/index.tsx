import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Application } from './layout-grid/application';
import { RecoilRoot } from 'recoil';
import './index.scss';

document.getElementById('app').classList.add('dockview-theme-dark');

const root = ReactDOM.createRoot(document.getElementById('app'));

root.render(
    <RecoilRoot>
        <Application />
    </RecoilRoot>
);
