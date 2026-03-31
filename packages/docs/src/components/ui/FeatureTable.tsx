import React from 'react';
import { Checkmark } from './Checkmark';
import styles from './FeatureTable.module.scss';

const categories = [
    {
        title: 'Core Layout Components',
        features: [
            { name: 'Dockview', description: 'Full docking environment with tabs, groups, and window management.' },
            { name: 'Gridview', description: '2-dimensional resizable grid of panels for dashboard layouts.' },
            { name: 'Splitview', description: '1-dimensional resizable layouts (horizontal or vertical).' },
            { name: 'Paneview', description: 'Accordion-style expandable/collapsible sections.' },
        ],
    },
    {
        title: 'Tab Management',
        features: [
            { name: 'Tab Reordering', description: 'Drag and drop tabs within or between groups.' },
            { name: 'Tab Overflow', description: 'Gracefully handles many tabs with a dropdown menu.' },
            { name: 'Smooth Animation', description: 'Chrome-like animations during tab reordering.' },
            { name: 'Custom Components', description: 'Use framework-specific components for tabs.' },
            { name: 'Header Actions', description: 'Customizable buttons/components in the tab bar.' },
            { name: 'Context Menus', description: 'Fully customizable right-click menus for tabs.' },
            { name: 'Single Tab Mode', description: 'Options to hide or expand the tab bar when only one tab exists.' },
            { name: 'Tooltips', description: 'Hover information for every tab.' },
        ],
    },
    {
        title: 'Advanced Windowing',
        features: [
            { name: 'Floating Groups', description: 'Detachable groups that float freely over the layout.' },
            { name: 'Popout Windows', description: 'Move groups into separate browser windows.' },
            { name: 'Edge Panels', description: 'Fixed panels docked to container edges (IDE sidebars).' },
            { name: 'Watermarks', description: 'Custom content shown when a group is empty.' },
            { name: 'Locked Groups', description: 'Prevent resizing or dragging into/out of specific groups.' },
            { name: 'Constraints', description: 'Set minimum and maximum dimensions for panels.' },
            { name: 'Proportional Resize', description: 'Panels maintain relative sizes during container resize.' },
        ],
    },
    {
        title: 'Drag & Drop (DND)',
        features: [
            { name: 'Internal DND', description: 'Built-in movement of tabs and groups.' },
            { name: 'External DND', description: 'Handle drag events from outside the browser or app.' },
            { name: 'Cross-Window DND', description: 'Drag panels between different browser windows.' },
            { name: 'Drop Validation', description: 'Programmatically control where panels can be dropped.' },
            { name: 'Visual Overlays', description: 'High-performance drop target indicators.' },
            { name: 'Edge Drop Zones', description: 'Drop panels onto the edges of groups or containers.' },
        ],
    },
    {
        title: 'Persistence & State',
        features: [
            { name: 'JSON Serialization', description: 'Save the entire layout to a simple JSON object.' },
            { name: 'Custom Parameters', description: 'Preserve custom panel data across sessions.' },
            { name: 'Resilient Deserialization', description: 'Backward compatibility and safe restoration of saved layouts.' },
            { name: 'Deferred Mounting', description: 'Optimize performance by only mounting panels when needed.' },
        ],
    },
    {
        title: 'UX & Framework Support',
        features: [
            { name: 'Theming', description: 'Built-in light/dark themes and CSS variable support.' },
            { name: 'Framework Support', description: 'Dedicated packages for React, Vue, and Angular.' },
            { name: 'Zero Dependencies', description: 'Core library has no external runtime dependencies.' },
            { name: 'Touch Support', description: 'Optimized for touch-screen resizing and DND.' },
            { name: 'Accessibility', description: 'ARIA-compliant and keyboard navigation ready.' },
            { name: 'Custom Scrollbars', description: 'High-performance internal scrollbar implementation.' },
        ],
    },
];

export const FeatureTable = () => {
    return (
        <div className={styles.tableContainer}>
            {categories.map((category, idx) => (
                <div key={idx} className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>{category.title}</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Feature</th>
                                <th style={{ width: '60%' }}>Description</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>Available</th>
                            </tr>
                        </thead>
                        <tbody>
                            {category.features.map((feature, fIdx) => (
                                <tr key={fIdx}>
                                    <td className={styles.featureName}>{feature.name}</td>
                                    <td className={styles.featureDescription}>{feature.description}</td>
                                    <td className={styles.checkCell}>
                                        <Checkmark />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};
