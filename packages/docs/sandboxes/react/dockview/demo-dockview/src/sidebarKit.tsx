import * as React from 'react';
import { SB, sbBtn, sbBtnActive, sbIconBtn } from './sidebarTheme';

// A small design-system for the "Controls & Theme" side panel, built on the
// site's --dv-* tokens (via SB) so both tabs share one slick, consistent look.

export const IconChip: React.FC<{ icon: string; size?: number }> = ({
    icon,
    size = 28,
}) => (
    <span
        style={{
            width: size,
            height: size,
            borderRadius: 8,
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: SB.accentSoft,
            border: `1px solid ${SB.accentSoftHover}`,
            color: SB.accent,
        }}
    >
        <span
            className="material-symbols-outlined"
            style={{ fontSize: Math.round(size * 0.56) }}
        >
            {icon}
        </span>
    </span>
);

// Collapsible section card (icon chip + title + chevron), matching the site's
// feature-card motif.
export const Card: React.FC<{
    title: string;
    icon: string;
    defaultOpen?: boolean;
    right?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, icon, defaultOpen = true, right, children }) => {
    const [open, setOpen] = React.useState(defaultOpen);
    return (
        <div
            style={{
                background: SB.card,
                border: `1px solid ${SB.border}`,
                borderRadius: SB.radius,
                boxShadow: SB.shadowSm,
                overflow: 'hidden',
                // The panel body is a flex column; without this a flex item
                // shrinks below its content when the stack overflows (clipping
                // the just-expanded card) instead of letting the body scroll.
                flexShrink: 0,
            }}
        >
            <button
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 11px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: SB.ui,
                }}
            >
                <IconChip icon={icon} />
                <span
                    style={{
                        flex: 1,
                        fontSize: 12.5,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        color: SB.heading,
                    }}
                >
                    {title}
                </span>
                {right}
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: 20,
                        color: SB.faint,
                        transform: open ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                    }}
                >
                    expand_more
                </span>
            </button>
            {open && (
                <div
                    style={{
                        padding: '4px 11px 10px',
                        borderTop: `1px solid ${SB.border}`,
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export const Slider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    format?: (v: number) => string;
    onChange: (v: number) => void;
}> = ({ label, value, min, max, step, unit, format, onChange }) => {
    const pct = ((value - min) / (max - min || 1)) * 100;
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '7px 2px',
            }}
        >
            <span
                style={{
                    flex: 1,
                    fontSize: 12,
                    color: SB.text,
                    fontFamily: SB.ui,
                }}
            >
                {label}
            </span>
            <input
                type="range"
                className="dv-sb-slider"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={
                    {
                        width: 104,
                        '--fill': `${pct}%`,
                    } as React.CSSProperties
                }
            />
            <span
                style={{
                    minWidth: 42,
                    textAlign: 'right',
                    fontSize: 11,
                    color: SB.muted,
                    fontFamily: SB.mono,
                    fontVariantNumeric: 'tabular-nums',
                }}
            >
                {format ? format(value) : value}
                {unit ?? ''}
            </span>
        </div>
    );
};

export const Segmented: React.FC<{
    label?: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '7px 2px',
        }}
    >
        {label && (
            <span
                style={{ flex: 1, fontSize: 12, color: SB.text, fontFamily: SB.ui }}
            >
                {label}
            </span>
        )}
        <div
            style={{
                display: 'flex',
                background: SB.surface,
                border: `1px solid ${SB.border}`,
                borderRadius: SB.radiusSm,
                padding: 2,
                gap: 2,
            }}
        >
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        onClick={() => onChange(o.value)}
                        style={{
                            padding: '3px 10px',
                            fontSize: 11,
                            fontWeight: active ? 600 : 500,
                            fontFamily: SB.ui,
                            border: 'none',
                            borderRadius: 5,
                            cursor: 'pointer',
                            outline: 'none',
                            background: active ? SB.accent : 'transparent',
                            color: active ? SB.accentContrast : SB.muted,
                            boxShadow: active ? SB.glow : 'none',
                            transition: 'background 0.12s, color 0.12s',
                        }}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    </div>
);

export const Switch: React.FC<{
    label: string;
    icon?: string;
    checked: boolean;
    onChange: () => void;
}> = ({ label, icon, checked, onChange }) => (
    <button
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '7px 2px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: SB.ui,
        }}
    >
        {icon && (
            <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: SB.muted }}
            >
                {icon}
            </span>
        )}
        <span
            style={{
                flex: 1,
                fontSize: 12,
                color: SB.text,
                textAlign: 'left',
            }}
        >
            {label}
        </span>
        <span
            style={{
                width: 34,
                height: 20,
                borderRadius: 999,
                flexShrink: 0,
                position: 'relative',
                background: checked ? SB.accent : SB.surface,
                border: `1px solid ${checked ? SB.accent : SB.border}`,
                transition: 'background 0.15s, border-color 0.15s',
            }}
        >
            <span
                style={{
                    position: 'absolute',
                    top: 2,
                    left: checked ? 16 : 2,
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: checked ? SB.accentContrast : SB.muted,
                    boxShadow: SB.shadowSm,
                    transition: 'left 0.15s',
                }}
            />
        </span>
    </button>
);

export const Field: React.FC<{
    label?: string;
    children: React.ReactNode;
}> = ({ label, children }) => (
    <div style={{ padding: '5px 2px' }}>
        {label && (
            <div
                style={{
                    fontSize: 11.5,
                    color: SB.muted,
                    marginBottom: 5,
                    fontFamily: SB.ui,
                }}
            >
                {label}
            </div>
        )}
        {children}
    </div>
);

export const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: SB.inputBg,
    border: `1px solid ${SB.border}`,
    borderRadius: SB.radiusSm,
    padding: '6px 9px',
    color: SB.text,
    fontSize: 11.5,
    fontFamily: SB.mono,
    outline: 'none',
};

export const Btn: React.FC<{
    onClick?: () => void;
    primary?: boolean;
    icon?: string;
    title?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}> = ({ onClick, primary, icon, title, style, children }) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            ...(primary ? sbBtnActive : sbBtn),
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            ...style,
        }}
    >
        {icon && (
            <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
            >
                {icon}
            </span>
        )}
        {children}
    </button>
);

export const IconBtn: React.FC<{
    onClick?: () => void;
    icon: string;
    title?: string;
    active?: boolean;
}> = ({ onClick, icon, title, active }) => (
    <button
        onClick={onClick}
        title={title}
        style={active ? sbBtnActive : sbIconBtn}
    >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {icon}
        </span>
    </button>
);
