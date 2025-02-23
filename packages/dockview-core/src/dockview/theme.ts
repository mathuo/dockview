export interface DockviewTheme {
    name: string;
    className: string;
    gap?: number;
    dndOverlayMounting?: 'absolute' | 'relative';
    includeHeaderWhenHoverOverContent?: boolean;
}

export const themeDark: DockviewTheme = {
    name: 'dark',
    className: 'dockview-theme-dark',
};

export const themeLight: DockviewTheme = {
    name: 'light',
    className: 'dockview-theme-light',
};

export const themeVisualStudio: DockviewTheme = {
    name: 'visualStudio',
    className: 'dockview-theme-vs',
};

export const themeAbyss: DockviewTheme = {
    name: 'abyss',
    className: 'dockview-theme-abyss',
};

export const themeDracula: DockviewTheme = {
    name: 'dracula',
    className: 'dockview-theme-dracula',
};

export const themeReplit: DockviewTheme = {
    name: 'replit',
    className: 'dockview-theme-replit',
    gap: 10,
};

export const themeAbyssSpaced: DockviewTheme = {
    name: 'abyssSpaced',
    className: 'dockview-theme-abyss-spaced',
    gap: 10,
    dndOverlayMounting: 'absolute',
    includeHeaderWhenHoverOverContent: true,
};

export const themeLightSpaced: DockviewTheme = {
    name: 'lightSpaced',
    className: 'dockview-theme-light-spaced',
    gap: 10,
    dndOverlayMounting: 'absolute',
    includeHeaderWhenHoverOverContent: true,
};
