// import * as React from "react";
// import {
//   SplitViewComponent,
//   ViewComponent,
//   SerializedConfig,
// } from "splitview-react";
// import { Orientation } from "splitview";

// const components: { [index: string]: ViewComponent } = {
//   default: (props, ref) => {
//     return (
//       <div style={{ backgroundColor: "lightblue", height: "100%" }}>
//         <div>{`hello from ${props.userprops.text}`}</div>
//         <pre>{JSON.stringify(props, null, 4)}</pre>
//       </div>
//     );
//   },
// };

// const config: SerializedConfig = {
//   views: [
//     {
//       id: "default",
//       minimumSize: 100,
//       maximumSize: 1000,
//       size: 500,
//       props: {
//         text: "test",
//       },
//     },
//     {
//       id: "default",
//       minimumSize: 100,
//       maximumSize: 1000,
//       props: {
//         text: "test2",
//       },
//     },
//     {
//       id: "default",
//       minimumSize: 100,
//       maximumSize: 1000,
//       props: {
//         text: "test3",
//       },
//     },
//   ],
// };

// export const LoadFromConfig = () => {
//   return (
//     <SplitViewComponent
//       orientation={Orientation.HORIZONTAL}
//       size={500}
//       orthogonalSize={300}
//       initialLayout={config}
//       components={components}
//     />
//   );
// };
