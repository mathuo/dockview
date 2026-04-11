import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import './examples.scss';

type Framework = 'react' | 'vue' | 'angular' | 'typescript';

interface Example {
    name: string;
    frameworks: Framework[];
}

interface ComponentGroup {
    component: string;
    label: string;
    description: string;
    examples: Example[];
}

const FRAMEWORK_META: Record<
    Framework,
    { label: string; icon: string; color: string }
> = {
    react: { label: 'React', icon: 'img/react-icon.svg', color: '#61dafb' },
    vue: { label: 'Vue', icon: 'img/vue-icon.svg', color: '#42b883' },
    angular: {
        label: 'Angular',
        icon: 'img/angular-icon.svg',
        color: '#dd0031',
    },
    typescript: {
        label: 'TypeScript',
        icon: 'img/js-icon.svg',
        color: '#f7df1e',
    },
};

const COMPONENTS: ComponentGroup[] = [
    {
        component: 'dockview',
        label: 'Dockview',
        description:
            'Full-featured docking layout with tabs, groups, drag & drop, floating panels, and popout windows.',
        examples: [
            { name: 'basic', frameworks: ['react', 'vue', 'angular', 'typescript'] },
            { name: 'constraints', frameworks: ['react', 'vue', 'angular'] },
            { name: 'context-menu', frameworks: ['react', 'vue', 'angular', 'typescript'] },
            { name: 'custom-header', frameworks: ['react', 'vue', 'angular', 'typescript'] },
            { name: 'demo-dockview', frameworks: ['react'] },
            { name: 'dnd-events', frameworks: ['react', 'vue'] },
            { name: 'dnd-external', frameworks: ['react', 'vue'] },
            { name: 'edge-groups', frameworks: ['react', 'vue', 'angular', 'typescript'] },
            { name: 'floating-groups', frameworks: ['react', 'vue', 'angular'] },
            { name: 'group-actions', frameworks: ['react', 'vue', 'angular', 'typescript'] },
            { name: 'layout', frameworks: ['react', 'vue'] },
            { name: 'locked', frameworks: ['react', 'vue', 'typescript'] },
            { name: 'maximize-group', frameworks: ['react', 'vue'] },
            { name: 'nested', frameworks: ['react', 'vue'] },
            { name: 'popout-group', frameworks: ['react', 'vue'] },
            { name: 'render-mode', frameworks: ['react', 'vue'] },
            { name: 'resize', frameworks: ['react', 'vue'] },
            { name: 'resize-container', frameworks: ['react', 'vue'] },
            { name: 'scrollbars', frameworks: ['react', 'vue', 'typescript'] },
            { name: 'tab-groups', frameworks: ['react'] },
            { name: 'tabview', frameworks: ['react', 'vue', 'typescript'] },
            { name: 'update-parameters', frameworks: ['react', 'vue', 'typescript'] },
            { name: 'update-title', frameworks: ['react', 'vue', 'typescript'] },
            { name: 'watermark', frameworks: ['react', 'vue', 'angular', 'typescript'] },
        ],
    },
    {
        component: 'splitview',
        label: 'Splitview',
        description: 'Resizable split panels arranged horizontally or vertically.',
        examples: [
            { name: 'basic', frameworks: ['react', 'vue', 'angular', 'typescript'] },
        ],
    },
    {
        component: 'gridview',
        label: 'Gridview',
        description: 'Grid-based layout with resizable rows and columns.',
        examples: [
            { name: 'basic', frameworks: ['react', 'vue', 'angular', 'typescript'] },
        ],
    },
    {
        component: 'paneview',
        label: 'Paneview',
        description: 'Collapsible accordion-style pane layout.',
        examples: [
            { name: 'basic', frameworks: ['react', 'vue', 'angular', 'typescript'] },
        ],
    },
];

function formatName(name: string): string {
    return name
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function ExampleCard({ component, example }: { component: string; example: Example }) {
    return (
        <div className="example-card">
            <div className="example-card-header">
                <h3 className="example-card-title">{formatName(example.name)}</h3>
            </div>
            <div className="example-card-frameworks">
                {example.frameworks.map((fw) => {
                    const meta = FRAMEWORK_META[fw];
                    return (
                        <a
                            key={fw}
                            href={`/templates/${component}/${example.name}/${fw}/index.html`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="example-fw-link"
                            title={`Open ${formatName(example.name)} in ${meta.label}`}
                        >
                            <img
                                src={useBaseUrl(meta.icon)}
                                width={16}
                                height={16}
                                alt=""
                            />
                            <span>{meta.label}</span>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}

function ComponentSection({ group }: { group: ComponentGroup }) {
    return (
        <section className="examples-component-section">
            <div className="examples-component-header">
                <h2 className="examples-component-title">{group.label}</h2>
                <p className="examples-component-description">
                    {group.description}
                </p>
            </div>
            <div className="examples-grid">
                {group.examples.map((ex) => (
                    <ExampleCard
                        key={ex.name}
                        component={group.component}
                        example={ex}
                    />
                ))}
            </div>
        </section>
    );
}

export default function Examples(): JSX.Element {
    return (
        <Layout
            title="Examples"
            description="Browse interactive examples for Dockview, Splitview, Gridview, and Paneview across React, Vue, Angular, and TypeScript."
        >
            <main className="examples-page">
                <div className="container">
                    <div className="examples-hero">
                        <h1>Examples</h1>
                        <p>
                            Interactive examples for every component and
                            framework. Each example opens in its own page where
                            you can view the source or edit in CodeSandbox.
                        </p>
                    </div>
                    {COMPONENTS.map((group) => (
                        <ComponentSection key={group.component} group={group} />
                    ))}
                </div>
            </main>
        </Layout>
    );
}
