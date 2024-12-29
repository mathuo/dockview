"use strict";(self.webpackChunkdockview_docs=self.webpackChunkdockview_docs||[]).push([[2736],{7e3:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>a,contentTitle:()=>i,default:()=>h,frontMatter:()=>r,metadata:()=>t,toc:()=>d});var o=s(3188),c=s(7832);const r={slug:"dockview-3.0.0-release",title:"Dockview 3.0.0",tags:["release"]},i="Release Notes",t={permalink:"/blog/dockview-3.0.0-release",source:"@site/blog/2024-12-29-dockview-3.0.0.md",title:"Dockview 3.0.0",description:"This is a major release version due to some breaking changes in the dockview-core package. If you use the react or vue versions of dockview you should not see any breaking changes when upgrading. There are no new features in this release.",date:"2024-12-29T00:00:00.000Z",formattedDate:"December 29, 2024",tags:[{label:"release",permalink:"/blog/tags/release"}],readingTime:.695,hasTruncateMarker:!1,authors:[],frontMatter:{slug:"dockview-3.0.0-release",title:"Dockview 3.0.0",tags:["release"]},unlisted:!1,nextItem:{title:"Dockview 2.1.4",permalink:"/blog/dockview-2.1.4-release"}},a={authorsImageUrls:[]},d=[{value:"\ud83d\ude80 Features",id:"-features",level:2},{value:"\ud83d\udee0 Miscs",id:"-miscs",level:2},{value:"\ud83d\udd25 Breaking changes",id:"-breaking-changes",level:2}];function l(e){const n={a:"a",code:"code",h2:"h2",li:"li",p:"p",ul:"ul",...(0,c.a)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)(n.p,{children:["This is a major release version due to some breaking changes in the ",(0,o.jsx)(n.code,{children:"dockview-core"})," package. If you use the react or vue versions of dockview you should not see any breaking changes when upgrading. There are no new features in this release."]}),"\n",(0,o.jsxs)(n.p,{children:["Please reference docs @ ",(0,o.jsx)(n.a,{href:"https://dockview.dev",children:"dockview.dev"}),"."]}),"\n",(0,o.jsx)(n.h2,{id:"-features",children:"\ud83d\ude80 Features"}),"\n",(0,o.jsx)(n.h2,{id:"-miscs",children:"\ud83d\udee0 Miscs"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"dockview-vue"})," vue3 peerDependency ",(0,o.jsx)(n.a,{href:"https://github.com/mathuo/dockview/issues/808",children:"#808"})]}),"\n",(0,o.jsxs)(n.li,{children:["Bug: correct enablement of ",(0,o.jsx)(n.code,{children:"dv-single-tab"})," class ",(0,o.jsx)(n.a,{href:"https://github.com/mathuo/dockview/issues/811",children:"#811"})]}),"\n"]}),"\n",(0,o.jsx)(n.h2,{id:"-breaking-changes",children:"\ud83d\udd25 Breaking changes"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:["Standardize ",(0,o.jsx)(n.code,{children:"dockview-core"})," components for generic framework extensions following the pattern in ",(0,o.jsx)(n.code,{children:"DockviewComponent"})," ",(0,o.jsx)(n.a,{href:"https://github.com/mathuo/dockview/issues/810",children:"#810"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"SplitviewComponent"}),": Replace ",(0,o.jsx)(n.code,{children:"components"})," and ",(0,o.jsx)(n.code,{children:"frameworkComponents"})," with ",(0,o.jsx)(n.code,{children:"createComponent"})]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"PaneviewComponent"}),": Replace ",(0,o.jsx)(n.code,{children:"components"})," and ",(0,o.jsx)(n.code,{children:"frameworkComponents"})," with ",(0,o.jsx)(n.code,{children:"createComponent"})," and replace ",(0,o.jsx)(n.code,{children:"headerComponents"})," and ",(0,o.jsx)(n.code,{children:"headerFrameworkComponents"})," with ",(0,o.jsx)(n.code,{children:"createHeaderComponent"})]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"GridviewComponent"}),": Replace ",(0,o.jsx)(n.code,{children:"components"})," and ",(0,o.jsx)(n.code,{children:"frameworkComponents"})," with ",(0,o.jsx)(n.code,{children:"createComponent"})]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:["rename class ",(0,o.jsx)(n.code,{children:"dockview-react-part"})," to ",(0,o.jsx)(n.code,{children:"dv-react-part"})," ",(0,o.jsx)(n.a,{href:"https://github.com/mathuo/dockview/issues/806",children:"#806"})]}),"\n",(0,o.jsxs)(n.li,{children:["rename type ",(0,o.jsx)(n.code,{children:"PaneviewDropEvent"})," to ",(0,o.jsx)(n.code,{children:"PaneviewDidDropEvent"})," ",(0,o.jsx)(n.a,{href:"https://github.com/mathuo/dockview/issues/812",children:"#812"})]}),"\n",(0,o.jsxs)(n.li,{children:["remove ",(0,o.jsx)(n.code,{children:"showDndOverlay"})," from ",(0,o.jsx)(n.code,{children:"PaneviewComponent"})," in favour of ",(0,o.jsx)(n.code,{children:"api.onUnhandledDragOverEvent"})," ",(0,o.jsx)(n.a,{href:"https://github.com/mathuo/dockview/issues/812",children:"#812"})]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,c.a)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(l,{...e})}):l(e)}},7832:(e,n,s)=>{s.d(n,{Z:()=>t,a:()=>i});var o=s(6204);const c={},r=o.createContext(c);function i(e){const n=o.useContext(r);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function t(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(c):e.components||c:i(e.components),o.createElement(r.Provider,{value:n},e.children)}}}]);
//# sourceMappingURL=36ad4211.38abd85c.js.map