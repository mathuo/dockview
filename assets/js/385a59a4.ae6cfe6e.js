"use strict";(self.webpackChunkdockview_docs=self.webpackChunkdockview_docs||[]).push([[7199],{5389:(e,t,n)=>{n.d(t,{B:()=>l});var a=n(271),i=n(7294);const o={default:e=>i.createElement("div",{style:{padding:"20px"}},e.params.title)},l=e=>i.createElement(a.TU,{components:o,proportionalLayout:e.proportional,onReady:e=>{e.api.addPanel({id:"panel_1",component:"default",params:{title:"Panel 1"},minimumSize:100}),e.api.addPanel({id:"panel_2",component:"default",params:{title:"Panel 2"},minimumSize:100}),e.api.addPanel({id:"panel_3",component:"default",params:{title:"Panel 3"},minimumSize:100})},orientation:a.i5.HORIZONTAL,className:"dockview-theme-abyss"})},9913:(e,t,n)=>{n.d(t,{t:()=>o});var a=n(5389),i=n(7294);const o=e=>{const[t,n]=i.useState(50);return i.createElement("div",{style:{display:"flex",flexDirection:"column",height:"100px",margin:"10px 0px"}},i.createElement("div",{style:{height:"25px",display:"flex",alignItems:"center"}},i.createElement("input",{type:"range",min:20,max:100,defaultValue:50,value:t,onChange:e=>{n(Number(e.target.value))}}),i.createElement("span",{style:{padding:"0px 8px"}},"Slide to resize the splitview container")),i.createElement("div",{style:{flexGrow:1,display:"grid",gridTemplateColumns:t+"fr "+(100-t)+"fr"}},i.createElement("div",{style:{backgroundColor:"rgb(30,30,30)",color:"white",flexGrow:1,border:"1px solid grey"}},i.createElement(a.B,{proportional:e.proportional})),i.createElement("div",null)))}},1400:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>r,default:()=>u,frontMatter:()=>l,metadata:()=>p,toc:()=>d});var a=n(7462),i=(n(7294),n(3905)),o=(n(5389),n(9913));const l={sidebar_position:1,description:"How to get started with Dockview"},r="Basics",p={unversionedId:"basics",id:"version-1.5.1/basics",title:"Basics",description:"How to get started with Dockview",source:"@site/versioned_docs/version-1.5.1/basics.mdx",sourceDirName:".",slug:"/basics",permalink:"/docs/basics",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/versioned_docs/version-1.5.1/basics.mdx",tags:[],version:"1.5.1",sidebarPosition:1,frontMatter:{sidebar_position:1,description:"How to get started with Dockview"},sidebar:"tutorialSidebar",previous:{title:"Introduction",permalink:"/docs/"},next:{title:"Theme",permalink:"/docs/theme"}},s={},d=[{value:"Panels",id:"panels",level:2},{value:"Adding a panel with parameters",id:"adding-a-panel-with-parameters",level:3},{value:"API",id:"api",level:2},{value:"Serialization",id:"serialization",level:3},{value:"Auto resizing",id:"auto-resizing",level:2},{value:"Events",id:"events",level:2},{value:"Proportional layout",id:"proportional-layout",level:2},{value:"Browser support",id:"browser-support",level:2}],c={toc:d};function u(e){let{components:t,...n}=e;return(0,i.kt)("wrapper",(0,a.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"basics"},"Basics"),(0,i.kt)("p",null,"asd\nThis section will take you through a number of concepts that can be applied to all dockview components."),(0,i.kt)("h2",{id:"panels"},"Panels"),(0,i.kt)("p",null,"The below examples use ",(0,i.kt)("inlineCode",{parentName:"p"},"ReactSplitview")," but the logic holds for ",(0,i.kt)("inlineCode",{parentName:"p"},"ReactPaneview"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"ReactGridview")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"ReactDockview")," using their respective implementations and interfaces.\nAll components require you to provide an ",(0,i.kt)("inlineCode",{parentName:"p"},"onReady")," prop which you can use to build and control your component."),(0,i.kt)("h3",{id:"adding-a-panel-with-parameters"},"Adding a panel with parameters"),(0,i.kt)("p",null,"You can pass parameters to a panel through the ",(0,i.kt)("inlineCode",{parentName:"p"},"params")," object"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-tsx"},"const onReady = (event: SplitviewReadyEvent) => {\n    event.api.addPanel({\n        id: 'panel_1',\n        component: 'myComponent',\n        params: {\n            title: 'My Title',\n        },\n    });\n};\n")),(0,i.kt)("p",null,"and you can access those properties through the ",(0,i.kt)("inlineCode",{parentName:"p"},"props.params")," object. The TypeScript interface accepts an optional generic type ",(0,i.kt)("inlineCode",{parentName:"p"},"T")," that corresponds to the params objects type."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-tsx"},"const MyComponent = (props: ISplitviewPanelProps<{ title: string }>) => {\n    return <div>{`My first panel has the title: ${props.params.title}`}</div>;\n};\n")),(0,i.kt)("h2",{id:"api"},"API"),(0,i.kt)("p",null,"There are two types of API you will interact with using ",(0,i.kt)("inlineCode",{parentName:"p"},"dockview"),"."),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"The ",(0,i.kt)("inlineCode",{parentName:"li"},"panel API")," is accessible via ",(0,i.kt)("inlineCode",{parentName:"li"},"props.api")," in user defined panels and via the ",(0,i.kt)("inlineCode",{parentName:"li"},".api")," variable found on panel instances. This API contains actions and variable related to the the individual panel."),(0,i.kt)("li",{parentName:"ul"},"The ",(0,i.kt)("inlineCode",{parentName:"li"},"container API")," is accessible via ",(0,i.kt)("inlineCode",{parentName:"li"},"event.api")," in the ",(0,i.kt)("inlineCode",{parentName:"li"},"onReady")," events and ",(0,i.kt)("inlineCode",{parentName:"li"},"props.containerApi")," in user defined panels. This API contains actions and variable related to the component as a whole.")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-tsx"},"const MyComponent = (props: ISplitviewPanelProps<{ title: string }>) => {\n    React.useEffect(() => {\n        const disposable = props.api.onDidActiveChange((event) => {\n            console.log(`is panel active: ${event.isActive}`);\n        });\n\n        return () => {\n            disposable.dispose(); // remember to dispose of any subscriptions\n        };\n    }, [props.api]);\n\n    const addAnotherPanel = React.useCallback(() => {\n        props.containerApi.addPanel({\n            id: 'another_id',\n            component: 'anotherComponent',\n        });\n    }, [props.containerApi]);\n\n    return (\n        <div>\n            <span>{`My first panel has the title: ${props.params.title}`}</span>\n            <button onClick={addAnotherPanel}>Add Panel</button>\n        </div>\n    );\n};\n")),(0,i.kt)("h3",{id:"serialization"},"Serialization"),(0,i.kt)("p",null,"All components support ",(0,i.kt)("inlineCode",{parentName:"p"},"toJSON(): T")," which returns a Typed object representation of the components state. This same Typed object can be used to deserialize a view using ",(0,i.kt)("inlineCode",{parentName:"p"},"fromJSON(object: T): void"),"."),(0,i.kt)("h2",{id:"auto-resizing"},"Auto resizing"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"SplitviewReact"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"GridviewReact"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"PaneviewReact")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"DockviewReact")," will all automatically resize to fill the size of their parent element.\nInternally this is achieved using a ",(0,i.kt)("a",{parentName:"p",href:"https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver"},"ResizeObserver")," which some users may need to polyfill.\nYou can disable this by settings the ",(0,i.kt)("inlineCode",{parentName:"p"},"disableAutoResizing")," prop to be ",(0,i.kt)("inlineCode",{parentName:"p"},"true"),"."),(0,i.kt)("p",null,"You can manually resize a component using the API method ",(0,i.kt)("inlineCode",{parentName:"p"},"layout(width: number, height: number): void"),".\nAn advanced case may use this in conjunction with ",(0,i.kt)("inlineCode",{parentName:"p"},"disableAutoResizing=true")," to allow a parent component to have ultimate control over the dimensions of the component."),(0,i.kt)("h2",{id:"events"},"Events"),(0,i.kt)("p",null,"Many API properties can be listened on using the ",(0,i.kt)("inlineCode",{parentName:"p"},"Event")," pattern. For example ",(0,i.kt)("inlineCode",{parentName:"p"},"api.onDidFocusChange(() => {...})"),".\nYou should dispose of any event listeners you create cleaning up any listeners you would have created."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-tsx"},"React.useEffect(() => {\n    const disposable = api.onDidFocusChange(() => {\n        // write some code\n    });\n\n    return () => {\n        disposable.dispose();\n    };\n}, []);\n")),(0,i.kt)("h2",{id:"proportional-layout"},"Proportional layout"),(0,i.kt)("p",null,"The ",(0,i.kt)("inlineCode",{parentName:"p"},"proportionalLayout")," property indicates the expected behaviour of the component as it's container resizes, should all views resize equally or should just one view expand to fill the new space. ",(0,i.kt)("inlineCode",{parentName:"p"},"proportionalLayout")," can be set as a property on ",(0,i.kt)("inlineCode",{parentName:"p"},"SplitviewReact")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"GridviewReact")," components.\nAlthough not configurable on ",(0,i.kt)("inlineCode",{parentName:"p"},"DockviewReact")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"PaneviewReact")," these both behave as if ",(0,i.kt)("inlineCode",{parentName:"p"},"proportionalLayout=true")," was set for them."),(0,i.kt)(o.t,{proportional:!1,mdxType:"SimpleSplitview2"}),(0,i.kt)(o.t,{proportional:!0,mdxType:"SimpleSplitview2"}),(0,i.kt)("h2",{id:"browser-support"},"Browser support"),(0,i.kt)("p",null,"dockview is intended to support all major browsers. Some users may require a polyfill for ",(0,i.kt)("a",{parentName:"p",href:"https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver"},"ResizeObserver"),"."))}u.isMDXComponent=!0}}]);
//# sourceMappingURL=385a59a4.ae6cfe6e.js.map