import type { CSSProperties } from 'react';

// Tokens for the demo's "Controls & Theme" side panel. These map to the docs'
// own `--dv-*` design tokens (and `--ifm-*`) so the panel matches the rest of
// the site and flips with its light/dark mode. Double fallbacks (--dv-* →
// --ifm-* → hard hex) keep it looking right in the standalone / CodeSandbox
// build where the docs variables don't exist.
export const SB = {
    // Surfaces
    bg: 'var(--ifm-background-surface-color, #14141d)', // panel body
    card: 'var(--ifm-background-color, #0d0d15)', // nested section cards
    surface: 'var(--ifm-hover-overlay, rgba(255,255,255,0.05))',
    surfaceHover:
        'var(--dv-accent-soft, var(--ifm-hover-overlay, rgba(255,255,255,0.08)))',
    inputBg: 'var(--ifm-background-color, rgba(255,255,255,0.04))',

    // Borders
    border: 'var(--dv-border, var(--ifm-toc-border-color, rgba(255,255,255,0.12)))',
    borderStrong:
        'var(--dv-border-strong, var(--ifm-color-emphasis-300, rgba(255,255,255,0.2)))',

    // Text
    heading: 'var(--ifm-heading-color, #f4f4f8)',
    text: 'var(--ifm-font-color-base, #c7c9d6)',
    muted: 'var(--ifm-color-content-secondary, rgba(255,255,255,0.6))',
    faint: 'var(--ifm-color-emphasis-500, rgba(255,255,255,0.42))',

    // Accent
    accent: 'var(--ifm-color-primary, #5d94f4)',
    accentContrast: 'var(--dv-accent-contrast, #ffffff)',
    accentSoft: 'var(--dv-accent-soft, rgba(93,148,244,0.16))',
    accentSoftHover: 'var(--dv-accent-soft-hover, rgba(93,148,244,0.28))',

    // Elevation
    shadowSm: 'var(--dv-shadow-sm, 0 1px 2px rgba(0,0,0,0.4))',
    shadowMd: 'var(--dv-shadow-md, 0 4px 14px rgba(0,0,0,0.4))',
    shadowLg: 'var(--dv-shadow-lg, 0 20px 44px -14px rgba(0,0,0,0.7))',
    glow: '0 2px 10px color-mix(in srgb, var(--ifm-color-primary, #5d94f4) 40%, transparent)',

    // Shape
    radius: 12,
    radiusSm: 8,
    radiusChip: 6,

    // Type
    ui: 'var(--ifm-font-family-base, "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif)',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

// Shared button styles (grid/panel/group action rows): the site's secondary /
// primary button recipe, so every button reads clearly in light and dark.
export const sbBtn: CSSProperties = {
    padding: '5px 11px',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: SB.ui,
    border: `1px solid ${SB.border}`,
    borderRadius: SB.radiusSm,
    background: SB.surface,
    color: SB.text,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
};

export const sbBtnActive: CSSProperties = {
    ...sbBtn,
    background: 'var(--ifm-color-primary, #5d94f4)',
    borderColor: SB.accent,
    color: SB.accentContrast,
    boxShadow: SB.glow,
};

export const sbIconBtn: CSSProperties = {
    ...sbBtn,
    padding: '4px 7px',
    color: SB.muted,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};
