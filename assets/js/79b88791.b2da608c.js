"use strict";(self.webpackChunkdockview_docs=self.webpackChunkdockview_docs||[]).push([[7820],{5399:(e,c,o)=>{o.r(c),o.d(c,{assets:()=>t,contentTitle:()=>s,default:()=>h,frontMatter:()=>r,metadata:()=>d,toc:()=>l});var n=o(3188),i=o(7832);const r={slug:"dockview-1.13.0-release",title:"Dockview 1.13.0",tags:["release"]},s="Release Notes",d={permalink:"/blog/dockview-1.13.0-release",editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/blog/2024-04-27-dockview-1.13.0.md",source:"@site/blog/2024-04-27-dockview-1.13.0.md",title:"Dockview 1.13.0",description:"Please reference docs @ dockview.dev.",date:"2024-04-27T00:00:00.000Z",formattedDate:"April 27, 2024",tags:[{label:"release",permalink:"/blog/tags/release"}],readingTime:1.235,hasTruncateMarker:!1,authors:[],frontMatter:{slug:"dockview-1.13.0-release",title:"Dockview 1.13.0",tags:["release"]},unlisted:!1,nextItem:{title:"Dockview 1.12.0",permalink:"/blog/dockview-1.12.0-release"}},t={authorsImageUrls:[]},l=[{value:"\ud83d\ude80 Features",id:"-features",level:2},{value:"\ud83d\udee0 Miscs",id:"-miscs",level:2},{value:"\ud83d\udd25 Breaking changes",id:"-breaking-changes",level:2}];function a(e){const c={a:"a",code:"code",h2:"h2",li:"li",p:"p",ul:"ul",...(0,i.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(c.p,{children:["Please reference docs @ ",(0,n.jsx)(c.a,{href:"https://dockview.dev",children:"dockview.dev"}),"."]}),"\n",(0,n.jsx)(c.p,{children:"The majority of the changes in this release are internal changes to support the upcoming support of multiple frameworks, starting with Vue.js."}),"\n",(0,n.jsx)(c.h2,{id:"-features",children:"\ud83d\ude80 Features"}),"\n",(0,n.jsxs)(c.ul,{children:["\n",(0,n.jsxs)(c.li,{children:["\n",(0,n.jsxs)(c.p,{children:["Add ",(0,n.jsx)(c.code,{children:"onDidActivePanelChange"})," event to group api ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/541",children:"#541"})]}),"\n"]}),"\n",(0,n.jsxs)(c.li,{children:["\n",(0,n.jsxs)(c.p,{children:["Add ",(0,n.jsx)(c.code,{children:"inactive"})," property to ",(0,n.jsx)(c.code,{children:"addPanel"})," method to add panels without making them active ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/issues/572",children:"#572"})]}),"\n"]}),"\n"]}),"\n",(0,n.jsx)(c.h2,{id:"-miscs",children:"\ud83d\udee0 Miscs"}),"\n",(0,n.jsxs)(c.ul,{children:["\n",(0,n.jsxs)(c.li,{children:["\n",(0,n.jsxs)(c.p,{children:["Bug: width and height set incorrectly on floating groups when resized ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/issues/580",children:"#580"})]}),"\n"]}),"\n",(0,n.jsxs)(c.li,{children:["\n",(0,n.jsxs)(c.p,{children:["Create framework packages in preperation for multiple framework support ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/541",children:"#541"}),"\nThese are still in active development and will be offically support soon."]}),"\n",(0,n.jsxs)(c.ul,{children:["\n",(0,n.jsxs)(c.li,{children:["Create ",(0,n.jsx)(c.code,{children:"dockview-react"})," package"]}),"\n",(0,n.jsxs)(c.li,{children:["Create ",(0,n.jsx)(c.code,{children:"dockview-angular"})," package"]}),"\n",(0,n.jsxs)(c.li,{children:["Create ",(0,n.jsx)(c.code,{children:"dockview-vue"})," package"]}),"\n"]}),"\n"]}),"\n",(0,n.jsxs)(c.li,{children:["\n",(0,n.jsxs)(c.p,{children:["Move various type definitions from ",(0,n.jsx)(c.code,{children:"dockview"})," to ",(0,n.jsx)(c.code,{children:"dockview-core"})," in preperation for multiple framework support ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/541",children:"#541"})]}),"\n",(0,n.jsxs)(c.ul,{children:["\n",(0,n.jsxs)(c.li,{children:["Move ",(0,n.jsx)(c.code,{children:"IGroupPanelBaseProps"})," from ",(0,n.jsx)(c.code,{children:"dockview"})," to ",(0,n.jsx)(c.code,{children:"dockview-core"})]}),"\n",(0,n.jsxs)(c.li,{children:["Move ",(0,n.jsx)(c.code,{children:"IDockviewPanelHeaderProps"})," from ",(0,n.jsx)(c.code,{children:"dockview"})," to ",(0,n.jsx)(c.code,{children:"dockview-core"})]}),"\n",(0,n.jsxs)(c.li,{children:["Move ",(0,n.jsx)(c.code,{children:"IDockviewPanelProps"})," from ",(0,n.jsx)(c.code,{children:"dockview"})," to ",(0,n.jsx)(c.code,{children:"dockview-core"})]}),"\n",(0,n.jsxs)(c.li,{children:["Move ",(0,n.jsx)(c.code,{children:"IDockviewHeaderActionsProps "})," from ",(0,n.jsx)(c.code,{children:"dockview"})," to ",(0,n.jsx)(c.code,{children:"dockview-core"})]}),"\n",(0,n.jsxs)(c.li,{children:["Move ",(0,n.jsx)(c.code,{children:"IGroupHeaderProps"})," from ",(0,n.jsx)(c.code,{children:"dockview"})," to ",(0,n.jsx)(c.code,{children:"dockview-core"})]}),"\n",(0,n.jsxs)(c.li,{children:["Move ",(0,n.jsx)(c.code,{children:"IWatermarkPanelProps"})," from ",(0,n.jsx)(c.code,{children:"dockview"})," to ",(0,n.jsx)(c.code,{children:"dockview-core"})]}),"\n",(0,n.jsxs)(c.li,{children:["Move ",(0,n.jsx)(c.code,{children:"DockviewReadyEvent"})," from ",(0,n.jsx)(c.code,{children:"dockview"})," to ",(0,n.jsx)(c.code,{children:"dockview-core"})]}),"\n"]}),"\n"]}),"\n",(0,n.jsxs)(c.li,{children:["\n",(0,n.jsxs)(c.p,{children:["[dockview] Depreciate ",(0,n.jsx)(c.code,{children:"canDisplayOverlay"})," in favour of the ",(0,n.jsx)(c.code,{children:"onUnhandledDragOverEvent"})," api event ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/541",children:"#541"})]}),"\n"]}),"\n"]}),"\n",(0,n.jsx)(c.h2,{id:"-breaking-changes",children:"\ud83d\udd25 Breaking changes"}),"\n",(0,n.jsxs)(c.ul,{children:["\n",(0,n.jsxs)(c.li,{children:["[dockview-core] Replace DockviewComponent ",(0,n.jsx)(c.code,{children:"canDisplayOverlay"})," option with ",(0,n.jsx)(c.code,{children:"onUnhandledDragOverEvent"})," event ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/541",children:"#541"})]}),"\n",(0,n.jsxs)(c.li,{children:["[dockview-core] Rename ",(0,n.jsx)(c.code,{children:"createRightHeaderActionsElement"})," to ",(0,n.jsx)(c.code,{children:"createRightHeaderActionElement"})," ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/576",children:"#576"})]}),"\n",(0,n.jsxs)(c.li,{children:["[dockview-core] Rename ",(0,n.jsx)(c.code,{children:"createLeftHeaderActionsElement"})," to ",(0,n.jsx)(c.code,{children:"createLeftHeaderActionElement"})," ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/576",children:"#576"})]}),"\n",(0,n.jsxs)(c.li,{children:["[dockview-core] Rename ",(0,n.jsx)(c.code,{children:"createPrefixHeaderActionsElement"})," to ",(0,n.jsx)(c.code,{children:"createPrefixHeaderActionElement"})," ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/576",children:"#576"})]}),"\n",(0,n.jsxs)(c.li,{children:["[dockview-core] Remove ",(0,n.jsx)(c.code,{children:"frameworkTabComponents"})," and ",(0,n.jsx)(c.code,{children:"tabComponents"}),", replaced by ",(0,n.jsx)(c.code,{children:"createTabComponent"})," ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/576",children:"#576"})]}),"\n",(0,n.jsxs)(c.li,{children:["[dockview-core] Remove ",(0,n.jsx)(c.code,{children:"frameworkComponents"})," and ",(0,n.jsx)(c.code,{children:"components"}),", replaced by ",(0,n.jsx)(c.code,{children:"createComponent"})," ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/576",children:"#576"})]}),"\n",(0,n.jsxs)(c.li,{children:["[dockview-core] Remove ",(0,n.jsx)(c.code,{children:"watermarkFrameworkComponent"})," and ",(0,n.jsx)(c.code,{children:"watermarkComponent"}),", replaced by ",(0,n.jsx)(c.code,{children:"createWatermarkComponent"})," ",(0,n.jsx)(c.a,{href:"https://github.com/mathuo/dockview/pull/576",children:"#576"})]}),"\n"]})]})}function h(e={}){const{wrapper:c}={...(0,i.a)(),...e.components};return c?(0,n.jsx)(c,{...e,children:(0,n.jsx)(a,{...e})}):a(e)}},7832:(e,c,o)=>{o.d(c,{Z:()=>d,a:()=>s});var n=o(6204);const i={},r=n.createContext(i);function s(e){const c=n.useContext(r);return n.useMemo((function(){return"function"==typeof e?e(c):{...c,...e}}),[c,e])}function d(e){let c;return c=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:s(e.components),n.createElement(r.Provider,{value:c},e.children)}}}]);
//# sourceMappingURL=79b88791.b2da608c.js.map