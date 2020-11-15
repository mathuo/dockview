import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.scss';
import { Application } from './layout-grid/application';

document.getElementById('app').classList.add('dockview-theme-dark');

ReactDOM.render(<Application />, document.getElementById('app'));
