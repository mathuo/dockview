import * as React from 'react';

export type PanelColors = {
    isDark: boolean;
    bg: string;
    bgAlt: string;
    bgSubtle: string;
    surface: string;
    border: string;
    borderSubtle: string;
    text: string;
    textMuted: string;
    textFaint: string;
    textSecondary: string;
    green: string;
    red: string;
    blue: string;
    yellow: string;
    greenBg: string;
    redBg: string;
    blueBg: string;
    // Richer tokens for a layered "trading desk" look.
    elevated: string; // raised surface: headers, stat tiles
    headerGrad: string; // subtle top-lit gradient for panel headers
    accent: string;
    accentBg: string;
    posStrong: string; // stronger tint used for tick flashes
    negStrong: string;
    gridLine: string;
    shadow: string; // box-shadow used to lift headers/rows
    chip: string; // neutral chip background
    scrollThumb: string;
};

// Near-black background with vivid, saturated accents — a bank-terminal look
// (Citi Velocity / Bloomberg) where the strong green/red pops hard off black.
export const DARK_COLORS: PanelColors = {
    isDark: true,
    bg: '#06090f',
    bgAlt: '#04060c',
    bgSubtle: 'rgba(255,255,255,0.035)',
    surface: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.10)',
    borderSubtle: 'rgba(255,255,255,0.06)',
    text: '#f2f6fb',
    textMuted: 'rgba(255,255,255,0.6)',
    textFaint: 'rgba(255,255,255,0.4)',
    textSecondary: '#d6deea',
    green: '#1fe07d',
    red: '#ff3b4e',
    blue: '#3d9bff',
    yellow: '#ffc23a',
    greenBg: 'rgba(31,224,125,0.15)',
    redBg: 'rgba(255,59,78,0.15)',
    blueBg: 'rgba(61,155,255,0.13)',
    elevated: '#0c111b',
    headerGrad:
        'linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0))',
    accent: '#3d9bff',
    accentBg: 'rgba(61,155,255,0.16)',
    posStrong: 'rgba(31,224,125,0.34)',
    negStrong: 'rgba(255,59,78,0.34)',
    gridLine: 'rgba(255,255,255,0.05)',
    shadow: '0 1px 0 rgba(255,255,255,0.05), 0 6px 16px rgba(0,0,0,0.6)',
    chip: 'rgba(255,255,255,0.09)',
    scrollThumb: 'rgba(255,255,255,0.16)',
};

export const LIGHT_COLORS: PanelColors = {
    isDark: false,
    bg: '#ffffff',
    bgAlt: '#f8fafc',
    bgSubtle: 'rgba(0,0,0,0.02)',
    surface: 'rgba(0,0,0,0.05)',
    border: 'rgba(0,0,0,0.08)',
    borderSubtle: 'rgba(0,0,0,0.05)',
    text: '#0f172a',
    textMuted: 'rgba(15,23,42,0.62)',
    textFaint: 'rgba(15,23,42,0.44)',
    textSecondary: '#334155',
    green: '#0a9d4e',
    red: '#e11d2e',
    blue: '#1f6feb',
    yellow: '#c26a00',
    greenBg: 'rgba(10,157,78,0.11)',
    redBg: 'rgba(225,29,46,0.09)',
    blueBg: 'rgba(31,111,235,0.08)',
    elevated: '#ffffff',
    headerGrad:
        'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0))',
    accent: '#1f6feb',
    accentBg: 'rgba(31,111,235,0.11)',
    posStrong: 'rgba(10,157,78,0.24)',
    negStrong: 'rgba(225,29,46,0.20)',
    gridLine: 'rgba(0,0,0,0.05)',
    shadow: '0 1px 2px rgba(15,23,42,0.06), 0 1px 0 rgba(255,255,255,0.6) inset',
    chip: 'rgba(0,0,0,0.05)',
    scrollThumb: 'rgba(0,0,0,0.18)',
};

export const PanelColorsContext = React.createContext<PanelColors>(DARK_COLORS);
export const usePanelColors = () => React.useContext(PanelColorsContext);
