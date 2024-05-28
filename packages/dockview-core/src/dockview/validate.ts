// import { SerializedGridObject } from '../gridview/gridview';
// import { Orientation } from '../splitview/splitview';
// import { SerializedDockview } from './dockviewComponent';
// import { GroupPanelViewState } from './dockviewGroupPanelModel';

// function typeValidate3(data: GroupPanelViewState, path: string): void {
//     if (typeof data.id !== 'string') {
//         throw new Error(`${path}.id must be a string`);
//     }

//     if (
//         typeof data.activeView !== 'string' ||
//         typeof data.activeView !== 'undefined'
//     ) {
//         throw new Error(`${path}.activeView must be a string of undefined`);
//     }
// }

// function typeValidate2(
//     data: SerializedGridObject<GroupPanelViewState>,
//     path: string
// ): void {
//     if (typeof data.size !== 'number' && typeof data.size !== 'undefined') {
//         throw new Error(`${path}.size must be a number or undefined`);
//     }

//     if (
//         typeof data.visible !== 'boolean' &&
//         typeof data.visible !== 'undefined'
//     ) {
//         throw new Error(`${path}.visible must be a boolean or undefined`);
//     }

//     if (data.type === 'leaf') {
//         if (
//             typeof data.data !== 'object' ||
//             data.data === null ||
//             Array.isArray(data.data)
//         ) {
//             throw new Error('object must be a non-null object');
//         }

//         typeValidate3(data.data, `${path}.data`);
//     } else if (data.type === 'branch') {
//         if (!Array.isArray(data.data)) {
//             throw new Error(`${path}.data must be an array`);
//         }
//     } else {
//         throw new Error(`${path}.type must be onew of {'branch', 'leaf'}`);
//     }
// }

// function typeValidate(data: SerializedDockview): void {
//     if (typeof data !== 'object' || data === null) {
//         throw new Error('object must be a non-null object');
//     }

//     const { grid, panels, activeGroup, floatingGroups } = data;

//     if (typeof grid !== 'object' || grid === null) {
//         throw new Error("'.grid' must be a non-null object");
//     }

//     if (typeof grid.height !== 'number') {
//         throw new Error("'.grid.height' must be a number");
//     }

//     if (typeof grid.width !== 'number') {
//         throw new Error("'.grid.width' must be a number");
//     }

//     if (typeof grid.root !== 'object' || grid.root === null) {
//         throw new Error("'.grid.root' must be a non-null object");
//     }

//     if (grid.root.type !== 'branch') {
//         throw new Error(".grid.root.type must be of type 'branch'");
//     }

//     if (
//         grid.orientation !== Orientation.HORIZONTAL &&
//         grid.orientation !== Orientation.VERTICAL
//     ) {
//         throw new Error(
//             `'.grid.width' must be one of {${Orientation.HORIZONTAL}, ${Orientation.VERTICAL}}`
//         );
//     }

//     typeValidate2(grid.root, '.grid.root');
// }
