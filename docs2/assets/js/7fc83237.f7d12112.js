"use strict";(self.webpackChunkdockview_docs=self.webpackChunkdockview_docs||[]).push([[854],{3905:function(e,t,r){r.d(t,{Zo:function(){return s},kt:function(){return m}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var c=n.createContext({}),u=function(e){var t=n.useContext(c),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},s=function(e){var t=u(e.components);return n.createElement(c.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,c=e.parentName,s=l(e,["components","mdxType","originalType","parentName"]),d=u(r),m=a,f=d["".concat(c,".").concat(m)]||d[m]||p[m]||o;return r?n.createElement(f,i(i({ref:t},s),{},{components:r})):n.createElement(f,i({ref:t},s))}));function m(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,i=new Array(o);i[0]=d;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:a,i[1]=l;for(var u=2;u<o;u++)i[u]=r[u];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},4837:function(e,t,r){r.r(t),r.d(t,{assets:function(){return s},contentTitle:function(){return c},default:function(){return m},frontMatter:function(){return l},metadata:function(){return u},toc:function(){return p}});var n=r(7462),a=r(3366),o=(r(7294),r(3905)),i=["components"],l={slug:"dockview-1.4.2-release",title:"Dockview 1.4.2",tags:["release"]},c="Release Notes",u={permalink:"/dockview/docs2/blog/dockview-1.4.2-release",editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/blog/2022-05-16-dockview-1.4.2.mdx",source:"@site/blog/2022-05-16-dockview-1.4.2.mdx",title:"Dockview 1.4.2",description:"\ud83d\ude80 Features",date:"2022-05-16T00:00:00.000Z",formattedDate:"May 16, 2022",tags:[{label:"release",permalink:"/dockview/docs2/blog/tags/release"}],readingTime:.19,truncated:!1,authors:[],frontMatter:{slug:"dockview-1.4.2-release",title:"Dockview 1.4.2",tags:["release"]},prevItem:{title:"math/math",permalink:"/dockview/docs2/blog/math/math"},nextItem:{title:"Dockview 1.4.1",permalink:"/dockview/docs2/blog/dockview-1.4.1-release"}},s={authorsImageUrls:[]},p=[{value:"\ud83d\ude80 Features",id:"-features",level:2},{value:"\ud83d\udd25 Breaking changes",id:"-breaking-changes",level:2}],d={toc:p};function m(e){var t=e.components,r=(0,a.Z)(e,i);return(0,o.kt)("wrapper",(0,n.Z)({},d,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h2",{id:"-features"},"\ud83d\ude80 Features"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"Fix deserialization issue where previously active panel wasn't display correctly after deserialization ",(0,o.kt)("a",{parentName:"li",href:"https://github.com/mathuo/dockview/pull/108"},"#108"))),(0,o.kt)("h2",{id:"-breaking-changes"},"\ud83d\udd25 Breaking changes"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"Rename ",(0,o.kt)("inlineCode",{parentName:"li"},"onDidAddGroup")," to ",(0,o.kt)("inlineCode",{parentName:"li"},"onDidAddPanel"),", ",(0,o.kt)("inlineCode",{parentName:"li"},"onDidRemoveGroup")," to ",(0,o.kt)("inlineCode",{parentName:"li"},"onDidRemovePanel")," and ",(0,o.kt)("inlineCode",{parentName:"li"},"onDidActiveGroupChange")," to ",(0,o.kt)("inlineCode",{parentName:"li"},"onDidActivePanelChange")," on the Gridview API ",(0,o.kt)("a",{parentName:"li",href:"https://github.com/mathuo/dockview/pull/106"},"#106"))))}m.isMDXComponent=!0}}]);