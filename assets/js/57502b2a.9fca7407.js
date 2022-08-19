"use strict";(self.webpackChunkdockview_docs=self.webpackChunkdockview_docs||[]).push([[5996],{7491:(t,e,a)=>{a.d(e,{f:()=>o});var n=a(271),r=a(7294);const l={default:t=>r.createElement("div",{style:{padding:"20px"}},t.params.title)},o=()=>r.createElement(n.tu,{components:l,onReady:t=>{t.api.addPanel({id:"panel_1",component:"default",params:{title:"Panel 1"}}),t.api.addPanel({id:"panel_2",component:"default",params:{title:"Panel 2"}}),t.api.addPanel({id:"panel_3",component:"default",params:{title:"Panel 3"}}),t.api.addPanel({id:"panel_4",component:"default",params:{title:"Panel 4"},position:{referencePanel:"panel_1",direction:"right"}})},className:"dockview-theme-vs"})},924:(t,e,a)=>{a.r(e),a.d(e,{assets:()=>p,contentTitle:()=>i,default:()=>c,frontMatter:()=>o,metadata:()=>d,toc:()=>m});var n=a(7462),r=(a(7294),a(3905)),l=a(7491);const o={sidebar_position:3,description:"Theming Dockview Components"},i="Theme",d={unversionedId:"theme",id:"theme",title:"Theme",description:"Theming Dockview Components",source:"@site/docs/theme.mdx",sourceDirName:".",slug:"/theme",permalink:"/docs/next/theme",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/theme.mdx",tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3,description:"Theming Dockview Components"},sidebar:"tutorialSidebar",previous:{title:"Basics",permalink:"/docs/next/basics"},next:{title:"Examples",permalink:"/docs/next/examples"}},p={},m=[{value:"Introduction",id:"introduction",level:2},{value:"Provided themes",id:"provided-themes",level:2},{value:"Customizing Theme",id:"customizing-theme",level:2}],s={toc:m};function c(t){let{components:e,...a}=t;return(0,r.kt)("wrapper",(0,n.Z)({},s,a,{components:e,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"theme"},"Theme"),(0,r.kt)("h2",{id:"introduction"},"Introduction"),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"dockview")," requires some css to work correctly.\nThe css is exported as one file under ",(0,r.kt)("a",{parentName:"p",href:"https://unpkg.com/browse/dockview@latest/dist/styles/dockview.css"},(0,r.kt)("inlineCode",{parentName:"a"},"dockview/dict/styles/dockview.css")),"\nand depending can be imported"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-css"},"@import './node_modules/dockview/dist/styles/dockview.css';\n")),(0,r.kt)("h2",{id:"provided-themes"},"Provided themes"),(0,r.kt)("p",null,"The following are provided as classes that you can attached to your components for themeing"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},".dockview-theme-light")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},".dockview-theme-dark")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},".dockview-theme-abyss"))),(0,r.kt)("h2",{id:"customizing-theme"},"Customizing Theme"),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"dockview")," supports theming through the use of css properties.\nYou can view the built-in themes at ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/mathuo/dockview/blob/master/packages/dockview/src/theme.scss"},(0,r.kt)("inlineCode",{parentName:"a"},"dockview/src/theme.scss")),"\nand are free to build your own themes based on these css properties."),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"CSS Property"),(0,r.kt)("th",{parentName:"tr",align:null},"Description"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-paneview-active-outline-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-tabs-and-actions-container-font-size"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-tabs-and-actions-container-height"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-tab-close-icon"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-drag-over-background-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-drag-over-border-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-tabs-container-scrollbar-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null}),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-group-view-background-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null}),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-tabs-and-actions-container-background-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null}),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-activegroup-visiblepanel-tab-background-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-activegroup-hiddenpanel-tab-background-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-inactivegroup-visiblepanel-tab-background-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-inactivegroup-hiddenpanel-tab-background-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-tab-divider-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null}),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-activegroup-visiblepanel-tab-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-activegroup-hiddenpanel-tab-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-inactivegroup-visiblepanel-tab-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-inactivegroup-hiddenpanel-tab-color"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null}),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-separator-border"),(0,r.kt)("td",{parentName:"tr",align:null})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"--dv-paneview-header-border-color"),(0,r.kt)("td",{parentName:"tr",align:null})))),(0,r.kt)("p",null,"You can further customise the theme through adjusting class properties but this is up you.\nAs an example if you wanted to add a bottom border to the tab container for an active group in the ",(0,r.kt)("inlineCode",{parentName:"p"},"DockviewReact")," component you could write:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-css"},".groupview {\n    &.active-group {\n        > .tabs-and-actions-container {\n            border-bottom: 2px solid var(--dv-activegroup-visiblepanel-tab-background-color);\n        }\n    }\n    &.inactive-group {\n        > .tabs-and-actions-container {\n            border-bottom: 2px solid var(--dv-inactivegroup-visiblepanel-tab-background-color);\n        }\n    }\n}\n")),(0,r.kt)("div",{style:{height:"300px",backgroundColor:"rgb(30,30,30)",color:"white",margin:"20px 0px"}},(0,r.kt)(l.f,{mdxType:"CustomCSSDockview"})))}c.isMDXComponent=!0}}]);
//# sourceMappingURL=57502b2a.9fca7407.js.map