import './styles.css';
import 'dockview-core/dist/styles/dockview.css';

import { attach } from './app';

const rootElement = document.getElementById('root');

if (rootElement) {
    attach(rootElement);
}
