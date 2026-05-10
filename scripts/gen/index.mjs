import { generateDockviewCoreExports } from './dockview-core-exports.mjs';

const generators = [
    {
        name: 'dockview-core-exports',
        fn: generateDockviewCoreExports,
    },
];

for (const gen of generators) {
    console.log(`Running generator: ${gen.name}`);
    gen.fn();
    console.log(`Done: ${gen.name}`);
}
