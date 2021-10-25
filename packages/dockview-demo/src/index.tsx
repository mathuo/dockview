import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Application } from './layout-grid/application';
import { RecoilRoot } from 'recoil';
import './index.scss';

document.getElementById('app').classList.add('dockview-theme-dark');

ReactDOM.render(
    <RecoilRoot>
        <Application />
    </RecoilRoot>,
    document.getElementById('app')
);
