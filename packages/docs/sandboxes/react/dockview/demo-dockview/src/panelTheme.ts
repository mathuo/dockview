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
};

export const DARK_COLORS: PanelColors = {
    isDark: true,
    bg: '#0d1117',
    bgAlt: '#0b0f19',
    bgSubtle: 'rgba(255,255,255,0.03)',
    surface: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.07)',
    borderSubtle: 'rgba(255,255,255,0.05)',
    text: '#e2e8f0',
    textMuted: 'rgba(255,255,255,0.4)',
    textFaint: 'rgba(255,255,255,0.2)',
    textSecondary: '#cbd5e1',
    green: '#4ade80',
    red: '#f87171',
    blue: '#60a5fa',
    yellow: '#facc15',
    greenBg: 'rgba(74,222,128,0.10)',
    redBg: 'rgba(248,113,113,0.10)',
    blueBg: 'rgba(96,165,250,0.08)',
};

export const LIGHT_COLORS: PanelColors = {
    isDark: false,
    bg: '#ffffff',
    bgAlt: '#f8fafc',
    bgSubtle: 'rgba(0,0,0,0.02)',
    surface: 'rgba(0,0,0,0.05)',
    border: 'rgba(0,0,0,0.08)',
    borderSubtle: 'rgba(0,0,0,0.05)',
    text: '#1e293b',
    textMuted: 'rgba(0,0,0,0.45)',
    textFaint: 'rgba(0,0,0,0.25)',
    textSecondary: '#475569',
    green: '#16a34a',
    red: '#dc2626',
    blue: '#2563eb',
    yellow: '#d97706',
    greenBg: 'rgba(22,163,74,0.08)',
    redBg: 'rgba(220,38,38,0.07)',
    blueBg: 'rgba(37,99,235,0.06)',
};

export const PanelColorsContext = React.createContext<PanelColors>(DARK_COLORS);
export const usePanelColors = () => React.useContext(PanelColorsContext);
