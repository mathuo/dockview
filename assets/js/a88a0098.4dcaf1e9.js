"use strict";(self.webpackChunkdockview_docs=self.webpackChunkdockview_docs||[]).push([[5199],{1029:(t,e,n)=>{n.d(e,{B:()=>r});var a=n(9084),l=n(2784);const i={default:t=>l.createElement("div",{style:{padding:"20px"}},t.params.title)},r=t=>l.createElement(a.TU,{components:i,proportionalLayout:t.proportional,onReady:t=>{t.api.addPanel({id:"panel_1",component:"default",params:{title:"Panel 1"},minimumSize:100}),t.api.addPanel({id:"panel_2",component:"default",params:{title:"Panel 2"},minimumSize:100}),t.api.addPanel({id:"panel_3",component:"default",params:{title:"Panel 3"},minimumSize:100})},orientation:a.i5.HORIZONTAL,className:"dockview-theme-abyss"})},5827:(t,e,n)=>{n.d(e,{H:()=>r});var a=n(9084),l=n(2784);const i={default:t=>{const[e,n]=l.useState(t.api.isActive),[a,i]=l.useState(t.api.isVisible),[r,p]=l.useState(t.api.isFocused),[d,o]=l.useState({height:t.api.height,width:t.api.width});return l.useEffect((()=>{const e=t.api.onDidActiveChange((t=>n(t.isActive))),a=t.api.onDidVisibilityChange((t=>i(t.isVisible))),l=t.api.onDidFocusChange((t=>p(t.isFocused))),r=t.api.onDidDimensionsChange((t=>{o({height:t.height,width:t.width})}));return()=>{e.dispose(),a.dispose(),l.dispose(),r.dispose()}}),[]),l.createElement("div",{style:{padding:"20px",display:"grid",gridTemplateColumns:"100px 100px",lineHeight:"20px",gridTemplateRows:"repeat(6, 20px)"}},l.createElement("span",null,"Panel ID: "),l.createElement("span",null,t.api.id),l.createElement("span",null,"Height: "),l.createElement("span",null,`${d.height}px`),l.createElement("span",null,"Width: "),l.createElement("span",null,`${d.width}px`),l.createElement("span",null,"Focused: "),l.createElement("span",{style:{color:r?"green":"red"}},""+(r?"True":"False")),l.createElement("span",null,"Active: "),l.createElement("span",{style:{color:e?"green":"red"}},""+(e?"True":"False")),l.createElement("span",null,"Visible: "),l.createElement("span",{style:{color:a?"green":"red"}},""+(a?"True":"False")))}},r=t=>{const[e,n]=l.useState([]),r=l.useCallback((t=>{t.api.onDidAddView((e=>n(t.api.panels))),t.api.onDidRemoveView((e=>n(t.api.panels))),t.api.addPanel({id:"panel_1",component:"default",params:{title:"Panel 1"},minimumSize:100}),t.api.addPanel({id:"panel_2",component:"default",params:{title:"Panel 2"},minimumSize:100}),t.api.addPanel({id:"panel_3",component:"default",params:{title:"Panel 3"},minimumSize:100})}),[]);return l.createElement(l.Fragment,null,l.createElement("div",{style:{height:"150px",backgroundColor:"rgb(30,30,30)",color:"white"}},l.createElement(a.TU,{components:i,proportionalLayout:t.proportional,onReady:r,orientation:a.i5.HORIZONTAL,className:"dockview-theme-abyss"})),l.createElement("div",{style:{height:"20px",display:"flex"}},e.map((t=>l.createElement("div",{style:{padding:"0px 20px"}},l.createElement("div",null,t.id),l.createElement("div",null,l.createElement("button",{onClick:()=>t.api.setVisible(!t.api.isVisible)},"Toggle Visiblity"),l.createElement("button",{onClick:()=>t.api.setActive()},"Set Active")))))))}},4586:(t,e,n)=>{n.r(e),n.d(e,{assets:()=>s,contentTitle:()=>o,default:()=>g,frontMatter:()=>d,metadata:()=>m,toc:()=>u});var a=n(7896),l=(n(2784),n(876)),i=n(1029),r=n(5827),p=n(9817);const d={description:"Splitview Documentation"},o="Splitview",m={unversionedId:"components/splitview",id:"components/splitview",title:"Splitview",description:"Splitview Documentation",source:"@site/docs/components/splitview.mdx",sourceDirName:"components",slug:"/components/splitview",permalink:"/docs/next/components/splitview",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/components/splitview.mdx",tags:[],version:"current",frontMatter:{description:"Splitview Documentation"},sidebar:"tutorialSidebar",previous:{title:"Paneview",permalink:"/docs/next/components/paneview"}},s={},u=[{value:"Introduction",id:"introduction",level:2},{value:"SplitviewReact Component",id:"splitviewreact-component",level:2},{value:"Splitview API",id:"splitview-api",level:2},{value:"Splitview Panel API",id:"splitview-panel-api",level:2},{value:"Advanced Features",id:"advanced-features",level:2},{value:"Visibility",id:"visibility",level:3},{value:"Active",id:"active",level:3},{value:"Contraints",id:"contraints",level:3}],k={toc:u},N="wrapper";function g(t){let{components:e,...n}=t;return(0,l.kt)(N,(0,a.Z)({},k,n,{components:e,mdxType:"MDXLayout"}),(0,l.kt)("h1",{id:"splitview"},"Splitview"),(0,l.kt)("h2",{id:"introduction"},"Introduction"),(0,l.kt)("p",null,"A Splitview is a collection of resizable horizontally or vertically stacked panels."),(0,l.kt)("div",{style:{height:"100px",backgroundColor:"rgb(30,30,30)",color:"white",margin:"20px 0px"}},(0,l.kt)(i.B,{mdxType:"SimpleSplitview"})),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx",metastring:'title="Simple Splitview example"',title:'"Simple',Splitview:!0,'example"':!0},"import {\n    ISplitviewPanelProps,\n    Orientation,\n    SplitviewReact,\n    SplitviewReadyEvent,\n} from 'dockview';\n\nconst components = {\n    default: (props: ISplitviewPanelProps<{ title: string }>) => {\n        return <div style={{ padding: '20px' }}>{props.params.title}</div>;\n    },\n};\n\nexport const SimpleSplitview = () => {\n    const onReady = (event: SplitviewReadyEvent) => {\n        event.api.addPanel({\n            id: 'panel_1',\n            component: 'default',\n            params: {\n                title: 'Panel 1',\n            },\n        });\n\n        event.api.addPanel({\n            id: 'panel_2',\n            component: 'default',\n            params: {\n                title: 'Panel 2',\n            },\n        });\n\n        event.api.addPanel({\n            id: 'panel_3',\n            component: 'default',\n            params: {\n                title: 'Panel 3',\n            },\n        });\n    };\n\n    return (\n        <SplitviewReact\n            components={components}\n            onReady={onReady}\n            orientation={Orientation.HORIZONTAL}\n            className=\"dockview-theme-abyss\"\n        />\n    );\n};\n")),(0,l.kt)("h2",{id:"splitviewreact-component"},"SplitviewReact Component"),(0,l.kt)("p",null,"You can create a Splitview through the use of the ",(0,l.kt)("inlineCode",{parentName:"p"},"ReactSplitview")," component."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx"},"import { ReactSplitview } from 'dockview';\n")),(0,l.kt)("p",null,"Using the ",(0,l.kt)("inlineCode",{parentName:"p"},"onReady")," prop you can access to the component ",(0,l.kt)("inlineCode",{parentName:"p"},"api")," and add panels either through deserialization or the individual addition of panels."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Property"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Optional"),(0,l.kt)("th",{parentName:"tr",align:null},"Default"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"onReady"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(event: SplitviewReadyEvent) => void")),(0,l.kt)("td",{parentName:"tr",align:null},"No"),(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null},"Function")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"components"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Record<string, ISplitviewPanelProps>")),(0,l.kt)("td",{parentName:"tr",align:null},"No"),(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null},"Panel renderers")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"orientation"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Orientation")),(0,l.kt)("td",{parentName:"tr",align:null},"Yes"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Orientation.HORIZONTAL")),(0,l.kt)("td",{parentName:"tr",align:null},"Orientation of the Splitview")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"proportionalLayout"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"boolean")),(0,l.kt)("td",{parentName:"tr",align:null},"Yes"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"true")),(0,l.kt)("td",{parentName:"tr",align:null},"See ",(0,l.kt)(p.Z,{to:"../basics/#proportional-layout",mdxType:"Link"},"Proportional layout"))),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"hideBorders"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"boolean")),(0,l.kt)("td",{parentName:"tr",align:null},"Yes"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"false")),(0,l.kt)("td",{parentName:"tr",align:null},"Hide the borders between panels")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"className"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"string")),(0,l.kt)("td",{parentName:"tr",align:null},"Yes"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"''")),(0,l.kt)("td",{parentName:"tr",align:null},"Attaches a classname")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"disableAutoResizing"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"boolean")),(0,l.kt)("td",{parentName:"tr",align:null},"Yes"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"false")),(0,l.kt)("td",{parentName:"tr",align:null},"See ",(0,l.kt)(p.Z,{to:"../basics/#auto-resizing",mdxType:"Link"},"Auto Resizing"))))),(0,l.kt)("h2",{id:"splitview-api"},"Splitview API"),(0,l.kt)("p",null,"The Splitview API is exposed both at the ",(0,l.kt)("inlineCode",{parentName:"p"},"onReady")," event and on each panel through ",(0,l.kt)("inlineCode",{parentName:"p"},"props.containerApi"),".\nThrough this API you can control general features of the component and access all added panels."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx",metastring:'title="Splitview API via Panel component"',title:'"Splitview',API:!0,via:!0,Panel:!0,'component"':!0},"const MyComponent = (props: ISplitviewPanelProps<{ title: string }>) => {\n    // props.containerApi...\n\n    return <div>{`My first panel has the title: ${props.params.title}`}</div>;\n};\n")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx",metastring:'title="Splitview API via the onReady callback"',title:'"Splitview',API:!0,via:!0,the:!0,onReady:!0,'callback"':!0},"const onReady = (event: SplitviewReadyEvent) => {\n    // event.api...\n};\n")),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Property"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"height"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"number")),(0,l.kt)("td",{parentName:"tr",align:null},"Component pixel height")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"width"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"number")),(0,l.kt)("td",{parentName:"tr",align:null},"Component pixel width")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"minimumSize"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"number")),(0,l.kt)("td",{parentName:"tr",align:null},"The sum of the ",(0,l.kt)("inlineCode",{parentName:"td"},"minimumSize")," property for each panel")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"maximumSize"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"number")),(0,l.kt)("td",{parentName:"tr",align:null},"The sum of the ",(0,l.kt)("inlineCode",{parentName:"td"},"maximumSize")," property for each panel")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"length"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"number")),(0,l.kt)("td",{parentName:"tr",align:null},"Number of panels")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"panels"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"ISplitviewPanel[]")),(0,l.kt)("td",{parentName:"tr",align:null},"All panels")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"onDidLayoutChange"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Event<void>")),(0,l.kt)("td",{parentName:"tr",align:null},"Fires on layout change")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"onDidLayoutFromJSON"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Event<void>")),(0,l.kt)("td",{parentName:"tr",align:null},"Fires of layout change caused by a fromJSON deserialization call")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"onDidAddView"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Event<IView>")),(0,l.kt)("td",{parentName:"tr",align:null},"Fires when a view is added")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"onDidRemoveView"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Event<IView>")),(0,l.kt)("td",{parentName:"tr",align:null},"Fires when a view is removed")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"addPanel"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"addPanel(options: AddSplitviewComponentOptions): ISplitviewPanel")),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"removePanel"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(panel: ISplitviewPanel, sizing?: Sizing): void")),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"getPanel"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(id:string): ISplitviewPanel \\| undefined")),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"movePanel"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(from: number, to: number): void")),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"updateOptions"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(options: SplitviewComponentUpdateOptions): void")),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"focus"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(): void")),(0,l.kt)("td",{parentName:"tr",align:null},"Focus the active panel, if exists")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"layout"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(width: number, height:number): void")),(0,l.kt)("td",{parentName:"tr",align:null},"See ",(0,l.kt)(p.Z,{to:"../basics/#auto-resizing",mdxType:"Link"},"Auto Resizing"))),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"fromJSON"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(data: SerializedSplitview): void")),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)(p.Z,{to:"../basics/#serialization",mdxType:"Link"},"Serialization"))),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"toJSON"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(): SerializedSplitview")),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)(p.Z,{to:"../basics/#serialization",mdxType:"Link"},"Serialization"))),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"clear"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(): void")),(0,l.kt)("td",{parentName:"tr",align:null},"Clears the current layout")))),(0,l.kt)("h2",{id:"splitview-panel-api"},"Splitview Panel API"),(0,l.kt)("p",null,"The Splitview panel API is exposed on each panel containing actions and variables specific to that panel."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx",metastring:'title="Splitview panel API via Panel component"',title:'"Splitview',panel:!0,API:!0,via:!0,Panel:!0,'component"':!0},"const MyComponent = (props: ISplitviewPanelProps<{ title: string }>) => {\n    // props.api...\n\n    return <div>{`My first panel has the title: ${props.params.title}`}</div>;\n};\n")),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Property"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"id"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"string")),(0,l.kt)("td",{parentName:"tr",align:null},"Panel id")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"isFocused"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"boolean")),(0,l.kt)("td",{parentName:"tr",align:null},"Is panel focsed")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"isActive"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"boolean")),(0,l.kt)("td",{parentName:"tr",align:null},"Is panel active")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"isVisible"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"boolean")),(0,l.kt)("td",{parentName:"tr",align:null},"Is panel visible")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"width"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"number")),(0,l.kt)("td",{parentName:"tr",align:null},"Panel width")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"height"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"number")),(0,l.kt)("td",{parentName:"tr",align:null},"Panel height")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"onDidDimensionsChange"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Event<PanelDimensionChangeEvent>")),(0,l.kt)("td",{parentName:"tr",align:null},"Fires when panel dimensions change")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"onDidFocusChange"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Event<FocusEvent>")),(0,l.kt)("td",{parentName:"tr",align:null},"Fire when panel is focused and blurred")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"onDidVisibilityChange"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Event<VisibilityEvent>")),(0,l.kt)("td",{parentName:"tr",align:null},"Fires when the panels visiblity property is changed (see ",(0,l.kt)(p.Z,{to:"./splitview/#visibility",mdxType:"Link"},"Panel Visibility"),")")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"onDidActiveChange"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"Event<ActiveEvent>")),(0,l.kt)("td",{parentName:"tr",align:null},"Fires when the panels active property is changed (see ",(0,l.kt)(p.Z,{to:"./splitview/#active",mdxType:"Link"},"Active Panel"),")")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"onDidConstraintsChange"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"onDidConstraintsChange: Event<PanelConstraintChangeEvent>")),(0,l.kt)("td",{parentName:"tr",align:null},"Fires when the panels size contrainsts change (see ",(0,l.kt)(p.Z,{to:"./splitview/#contraints",mdxType:"Link"},"Panel Constraints"),")")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"setVisible"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(isVisible: boolean): void")),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"setActive"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(): void")),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null}),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"setConstraints"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(value: PanelConstraintChangeEvent2): void;")),(0,l.kt)("td",{parentName:"tr",align:null})),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"setSize"),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"(event: PanelSizeEvent): void")),(0,l.kt)("td",{parentName:"tr",align:null})))),(0,l.kt)("h2",{id:"advanced-features"},"Advanced Features"),(0,l.kt)("p",null,"Listed below are some functionalities avalaible through both the panel and component APIs. The live demo shows examples of these in real-time."),(0,l.kt)("div",{style:{height:"200px",margin:"20px 0px"}},(0,l.kt)(r.H,{mdxType:"SplitviewExample1"})),(0,l.kt)("h3",{id:"visibility"},"Visibility"),(0,l.kt)("p",null,"A panels visibility can be controlled and monitored through the following code.\nA panel with visibility set to ",(0,l.kt)("inlineCode",{parentName:"p"},"false")," will remain as a part of the components list of panels but will not be rendered."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx"},"const disposable = props.api.onDidVisibilityChange(({ isVisible }) => {\n    //\n});\n")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx"},"api.setVisible(true);\n")),(0,l.kt)("h3",{id:"active"},"Active"),(0,l.kt)("p",null,"Only one panel in the ",(0,l.kt)("inlineCode",{parentName:"p"},"splitview")," can be the active panel at any one time.\nSetting a panel as active will set all the others as inactive.\nA focused panel is always the active panel but an active panel is not always focused."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx"},"const disposable = props.api.onDidActiveChange(({ isActive }) => {\n    //\n});\n")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx"},"api.setActive();\n")),(0,l.kt)("h3",{id:"contraints"},"Contraints"),(0,l.kt)("p",null,"When adding a panel you can specify pixel size contraints"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx"},"event.api.addPanel({\n    id: 'panel_3',\n    component: 'default',\n    minimumSize: 100,\n    maximumSize: 1000,\n});\n")),(0,l.kt)("p",null,"These contraints can be updated throughout the lifecycle of the ",(0,l.kt)("inlineCode",{parentName:"p"},"splitview")," using the panel API"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx"},"props.api.onDidConstraintsChange(({ maximumSize, minimumSize }) => {\n    //\n});\n")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-tsx"},"api.setConstraints({\n    maximumSize: 200,\n    minimumSize: 400,\n});\n")))}g.isMDXComponent=!0}}]);
//# sourceMappingURL=a88a0098.4dcaf1e9.js.map