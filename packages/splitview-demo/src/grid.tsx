// import * as React from "react";
// import { IGridView, Layout, IPanelProps, IGroupview } from "splitview";
// import "./grid.scss";

// const createView = (text: string): IGridView => {
//   const el = document.createElement("div");
//   el.textContent = text;
//   el.style.backgroundColor = `rgb(${Math.floor(
//     Math.random() * 256
//   )},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`;
//   el.style.height = "100%";
//   el.style.width = "100%";

//   return {
//     element: el,
//     minimumHeight: 100,
//     maximumHeight: Number.MAX_SAFE_INTEGER,
//     minimumWidth: 200,
//     maximumWidth: 1000,
//     layout: (size, orthogonalSize) => {
//       //
//     },
//   };
// };

// let id = 0;

// export interface IInnerGridProps {}

// export interface IInnerGridRef {
//   gridview: Layout;
// }

// export const InnerGrid = React.forwardRef(
//   (props: {}, _ref: React.RefObject<IInnerGridRef>) => {
//     const ref = React.useRef<HTMLDivElement>();
//     const gridview = React.useRef<Layout>();

//     React.useImperativeHandle(
//       _ref,
//       () => {
//         return { gridview: gridview.current };
//       },
//       [gridview.current]
//     );

//     React.useEffect(() => {
//       gridview.current = new Layout();
//       ref.current.appendChild(gridview.current.element);

//       const create = (title: string) => {
//         const color = `rgb(${Math.floor(Math.random() * 256)},${Math.floor(
//           Math.random() * 256
//         )},${Math.floor(Math.random() * 256)})`;

//         const header = document.createElement("div");
//         const headertext = document.createElement("span");
//         headertext.textContent = title;
//         header.className = "header";
//         header.style.backgroundColor = color;
//         header.style.height = "100%";
//         header.appendChild(headertext);

//         const body = document.createElement("div");
//         body.textContent = "body";
//         body.style.backgroundColor = color;
//         body.style.height = "100%";
//         body.style.padding = "2px";
//         body.style.boxSizing = "border-box";

//         return {
//           header: { element: header },
//           content: { element: body },
//           focus: () => {
//             /** */
//           },
//           onHide: () => {
//             /** */
//           },
//           setVisible: (visible: boolean, group: IGroupview) => {
//             /** */
//           },
//           dispose: () => {
//             /** */
//           },
//         };
//       };

//       gridview.current.addPanel({ id: "1", ...create("Item 1") });
//       gridview.current.addPanel({ id: "2", ...create("Item 2") });

//       //
//       const { width, height } = ref.current.getBoundingClientRect();

//       gridview.current.layout(width, height);
//     }, []);

//     return <div style={{ height: "100%", width: "100%" }} ref={ref}></div>;
//   }
// );

// export const Grid = () => {
//   const ref = React.useRef<HTMLDivElement>();
//   const gridview = React.useRef<Layout>();

//   const [portals, setPortals] = React.useState<React.ReactPortal[]>([]);

//   React.useEffect(() => {
//     gridview.current = new Layout();
//     ref.current.appendChild(gridview.current.element);

//     gridview.current.layout(800, 500);

//     // gridview.current.addView(createView("1"), 200, [0]);
//     // gridview.current.addView(createView("2"), 200, [0]);
//     // gridview.current.addView(createView("3"), 200, [0]);

//     const createComponent = (title: string, inner?: boolean) => {
//       const backgroundColor = `rgb(${Math.floor(
//         Math.random() * 256
//       )},${Math.floor(Math.random() * 256)},${Math.floor(
//         Math.random() * 256
//       )})`;

//       return new ReactJS_Panel((id++).toString(), {
//         header: {
//           component: (props: IPanelProps & { [key: string]: any }) => {
//             const [state, setState] = React.useState<{
//               isGroupActive: boolean;
//               isPanelVisible: boolean;
//             }>({ isPanelVisible: false, isGroupActive: false });

//             React.useEffect(() => {
//               const listener = props.api.onDidPanelStateChange((ev) => {
//                 const { isGroupActive, isPanelVisible } = ev;
//                 setState({ isGroupActive, isPanelVisible });
//               });
//               return () => {
//                 listener.dispose();
//               };
//             }, []);

//             const onClick = () => {
//               props.api.close();
//             };

//             const activeAndFocused =
//               state.isGroupActive && state.isPanelVisible;

//             const mask = `url(https://fonts.gstatic.com/s/i/materialicons/close/v8/24px.svg) 50% 50% / 90% 90% no-repeat`;
//             const color = activeAndFocused
//               ? "white"
//               : state.isGroupActive
//               ? "#969696"
//               : state.isPanelVisible
//               ? "#8F8F8F"
//               : "#626262";
//             return (
//               <div
//                 className={`my-tab ${
//                   state.isPanelVisible ? "my-active-tab" : "my-inactive-tab"
//                 }`}
//                 style={{
//                   position: "relative",
//                   backgroundColor: state.isPanelVisible ? "#1E1E1E" : "#2D2D2D",
//                   height: "100%",
//                   display: "flex",
//                   minWidth: "80px",
//                   alignItems: "center",
//                   paddingLeft: "10px",
//                   whiteSpace: "nowrap",
//                   textOverflow: "elipsis",
//                   fontSize: "13px",
//                   // width: "60px",
//                   // minWidth: "fit-content",
//                   color,
//                 }}
//               >
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: 0,
//                     right: 0,
//                     backgroundColor: "black",
//                     color: "white",
//                     fontSize: "9px",
//                     lineHeight: "9px",
//                   }}
//                 >
//                   {state.isGroupActive && <div>{`G`}</div>}
//                   {state.isPanelVisible && <div>{`P`}</div>}
//                 </div>
//                 <span style={{ flexGrow: 1 }}>{props.title}</span>
//                 <div
//                   onMouseDown={(ev) => {
//                     ev.preventDefault();
//                   }}
//                   style={{
//                     textAlign: "right",
//                     width: "28px",
//                   }}
//                 >
//                   <ul
//                     className="tab-list"
//                     style={{
//                       display: "flex",
//                       padding: "0px",
//                       margin: "0px",
//                       justifyContent: "flex-end",
//                     }}
//                   >
//                     <a
//                       onClick={onClick}
//                       style={{
//                         height: "16px",
//                         width: "16px",
//                         display: "block",
//                         WebkitMask: mask,
//                         mask,
//                         backgroundColor: color,
//                         marginRight: "0.5em",
//                       }}
//                     ></a>
//                   </ul>
//                 </div>
//               </div>
//             );
//           },
//           props: { title },
//         },
//         content: {
//           component: (props: IPanelProps & { [key: string]: any }) => {
//             const [state, setState] = React.useState<{
//               isGroupActive: boolean;
//               isPanelVisible: boolean;
//             }>({ isPanelVisible: false, isGroupActive: false });

//             const ig = React.useRef<{ gridview: Layout }>();

//             React.useEffect(() => {
//               const listener = props.api.onDidPanelStateChange((ev) => {
//                 const { isGroupActive, isPanelVisible } = ev;
//                 setState({ isGroupActive, isPanelVisible });
//               });

//               const dimList = props.api.onDidPanelDimensionChange((ev) => {
//                 // console.log(
//                 //   `onPanelDimChange ${(ev.height, ev.width)} ig=${!!ig.current}`
//                 // );
//                 if (ig.current?.gridview) {
//                   console.log(ev.width, ev.height);
//                   ig.current.gridview.layout(ev.width, ev.height);
//                 }
//               });

//               return () => {
//                 listener.dispose();
//                 dimList.dispose();
//               };
//             }, [ig]);

//             return (
//               <div
//                 style={{
//                   position: "relative",
//                   height: "100%",
//                   backgroundColor,
//                 }}
//               >
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: 0,
//                     right: 0,
//                     backgroundColor: "black",
//                     color: "white",
//                     fontSize: "9px",
//                     lineHeight: "9px",
//                   }}
//                 >
//                   {state.isGroupActive && <div>{`G`}</div>}
//                   {state.isPanelVisible && <div>{`P`}</div>}
//                 </div>

//                 {inner ? (
//                   <InnerGrid ref={ig} />
//                 ) : (
//                   <div>{`body of ${props.title}`}</div>
//                 )}
//               </div>
//             );
//           },
//           props: { title },
//         },
//         addPortal: (portal) => {
//           setPortals((_) => [..._, portal]);
//           return {
//             dispose: () => {
//               setPortals((_) => _.filter((p) => p !== portal));
//             },
//           };
//         },
//       });
//     };

//     const create = (title: string) => {
//       const color = `rgb(${Math.floor(Math.random() * 256)},${Math.floor(
//         Math.random() * 256
//       )},${Math.floor(Math.random() * 256)})`;

//       const header = document.createElement("div");
//       const headertext = document.createElement("span");
//       headertext.textContent = title;
//       header.className = "header";
//       header.style.backgroundColor = color;
//       header.style.height = "100%";
//       header.appendChild(headertext);

//       const body = document.createElement("div");
//       body.textContent = "body";
//       body.style.backgroundColor = color;
//       body.style.height = "100%";
//       body.style.padding = "2px";
//       body.style.boxSizing = "border-box";
//       return { tab: header, content: body };
//     };

//     gridview.current.addPanel(createComponent("Item 1"));
//     gridview.current.addPanel(createComponent("Item 2"));
//     gridview.current.addPanel(createComponent("Item 3"));
//     gridview.current.addPanel(createComponent("Item 4"));
//     gridview.current.addPanel(createComponent("Item 5", true));

//     gridview.current.layout(800, 500);
//   }, []);

//   return (
//     <div style={{ height: "500px", width: "800px" }} ref={ref}>
//       {portals}
//     </div>
//   );
// };
