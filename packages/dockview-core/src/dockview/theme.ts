export interface DockviewTheme {
    /**
     *  The name of the theme
     */
    name: string;
    /**
     * The class name to apply to the theme containing the CSS variables settings.
     */
    className: string;
    /**
     * The gap between the groups
     */
    gap?: number;
    /**
     * The mouting position of the overlay shown when dragging a panel. `absolute`
     * will mount the overlay to root of the dockview component whereas `relative` will mount the overlay to the group container.
     */
    dndOverlayMounting?: 'absolute' | 'relative';
    /**
     * When dragging a panel, the overlay can either encompass the panel contents or the entire group including the tab header space.
     */
    dndPanelOverlay?: 'content' | 'group';
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
    dndPanelOverlay: 'group',
};

export const themeLightSpaced: DockviewTheme = {
    name: 'lightSpaced',
    className: 'dockview-theme-light-spaced',
    gap: 10,
    dndOverlayMounting: 'absolute',
    dndPanelOverlay: 'group',
};
