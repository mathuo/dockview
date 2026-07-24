import * as React from 'react';
import './container.scss';

const themes = [
    'dockview-theme-abyss',
    'dockview-theme-dark',
    'dockview-theme-light',
    'dockview-theme-vs',
    'dockview-theme-dracula',

    'dockview-theme-kraken',
];

export const ThemePicker = () => {
    const [theme, setTheme] = React.useState<string>(
        localStorage.getItem('dv-theme-class-name') || themes[0]
    );

    React.useEffect(() => {
        localStorage.setItem('dv-theme-class-name', theme);
        window.dispatchEvent(new StorageEvent('storage'));
    }, [theme]);

    return (
        <div
            style={{
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                padding: '0px 0px 0px 4px',
            }}
        >
            <span style={{ paddingRight: '4px' }}>{'Theme: '}</span>
            <select
                style={{ backgroundColor: 'inherit', color: 'inherit' }}
                onChange={(e) => setTheme(e.target.value)}
                value={theme}
            >
                {themes.map((theme) => (
                    <option key={theme} value={theme}>
                        {theme}
                    </option>
                ))}
            </select>
        </div>
    );
};
