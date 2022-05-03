(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[159],{6542:function(e,d,i){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gridview",function(){return i(5767)}])},5767:function(e,d,i){"use strict";i.r(d);var s=i(2322),n=i(5392);d.default=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},d=function(){var d=Object.assign({h2:"h2",a:"a",span:"span",pre:"pre",code:"code",table:"table",thead:"thead",tr:"tr",th:"th",tbody:"tbody",td:"td"},(0,n.ah)(),e.components);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(d.h2,{id:"component-props",children:["Component Props",(0,s.jsx)(d.a,{"aria-hidden":"true",tabIndex:"-1",href:"#component-props",children:(0,s.jsx)(d.span,{className:"icon icon-link"})})]}),"\n",(0,s.jsx)(d.pre,{children:(0,s.jsx)(d.code,{className:"language-tsx",children:"import { ReactGridview } from 'dockview';\n"})}),"\n",(0,s.jsxs)(d.table,{children:[(0,s.jsx)(d.thead,{children:(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.th,{children:"Property"}),(0,s.jsx)(d.th,{children:"Type"}),(0,s.jsx)(d.th,{children:"Optional"}),(0,s.jsx)(d.th,{children:"Default"}),(0,s.jsx)(d.th,{children:"Description"})]})}),(0,s.jsxs)(d.tbody,{children:[(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onReady"}),(0,s.jsx)(d.td,{children:"(event: SplitviewReadyEvent) => void"}),(0,s.jsx)(d.td,{children:"No"}),(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"components"}),(0,s.jsx)(d.td,{children:"object"}),(0,s.jsx)(d.td,{children:"No"}),(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"orientation"}),(0,s.jsx)(d.td,{children:"Orientation"}),(0,s.jsx)(d.td,{children:"Yes"}),(0,s.jsx)(d.td,{children:"Orientation.HORIZONTAL"}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"proportionalLayout"}),(0,s.jsx)(d.td,{children:"boolean"}),(0,s.jsx)(d.td,{children:"Yes"}),(0,s.jsx)(d.td,{children:"true"}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"hideBorders"}),(0,s.jsx)(d.td,{children:"boolean"}),(0,s.jsx)(d.td,{children:"Yes"}),(0,s.jsx)(d.td,{children:"false"}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"className"}),(0,s.jsx)(d.td,{children:"string"}),(0,s.jsx)(d.td,{children:"Yes"}),(0,s.jsx)(d.td,{children:"''"}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"disableAutoResizing"}),(0,s.jsx)(d.td,{children:"boolean"}),(0,s.jsx)(d.td,{children:"Yes"}),(0,s.jsx)(d.td,{children:"false"}),(0,s.jsxs)(d.td,{children:["See ",(0,s.jsx)(d.a,{href:"/basics/#auto-resizing",children:"Auto resizing"})]})]})]})]}),"\n",(0,s.jsxs)(d.h2,{id:"gridview-api",children:["Gridview API",(0,s.jsx)(d.a,{"aria-hidden":"true",tabIndex:"-1",href:"#gridview-api",children:(0,s.jsx)(d.span,{className:"icon icon-link"})})]}),"\n",(0,s.jsx)(d.pre,{children:(0,s.jsx)(d.code,{className:"language-tsx",children:"const MyComponent = (props: IGridviewPanelProps<{ title: string }>) => {\n    // props.containerApi...\n\n    return <div>{`My first panel has the title: ${props.params.title}`}</div>;\n};\n"})}),"\n",(0,s.jsx)(d.pre,{children:(0,s.jsx)(d.code,{className:"language-tsx",children:"const onReady = (event: GridviewReadyEvent) => {\n    // event.api...\n};\n"})}),"\n",(0,s.jsxs)(d.table,{children:[(0,s.jsx)(d.thead,{children:(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.th,{children:"Property"}),(0,s.jsx)(d.th,{children:"Type"}),(0,s.jsx)(d.th,{children:"Description"})]})}),(0,s.jsxs)(d.tbody,{children:[(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"height"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"number"})}),(0,s.jsx)(d.td,{children:"Component pixel height"})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"width"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"number"})}),(0,s.jsx)(d.td,{children:"Component pixel width"})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"minimumHeight"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"number"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"maximumHeight"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"number"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"maximumWidth"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"number"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"maximumWidth"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"number"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"length"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"number"})}),(0,s.jsx)(d.td,{children:"Number of panels"})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"panels"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"ISplitviewPanel[]"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"orientation"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Orientation"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onDidLayoutChange"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Event<void>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onDidLayoutFromJSON"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Event<void>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onDidAddGroup"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Event<IGridviewPanel>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onDidRemoveGroup"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Event<IGridviewPanel>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onDidActiveGroupChange"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Event<IGridviewPanel | undefined>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"addPanel"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"addPanel(options: AddComponentOptions): IGridviewPanel"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"removePanel"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(panel: IGridviewPanel, sizing?: Sizing): void"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"movePanel"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(panel: IGridviewPanel, options: {direction: Direction, refernece:string, size?: number}): void"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"getPanel"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(id: string) | IGridviewPanel | undefined"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"updateOptions"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(options:SplitviewComponentUpdateOptions): void"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"setVisible"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(panel: IGridviewPanel, isVisible: boolean): void"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"focus"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(): void"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"setActive"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(panel: IGridviewPanel): void"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"toggleVisiblity"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(panel: IGridviewPanel): void"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"layout"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(width: number, height:number): void"})}),(0,s.jsxs)(d.td,{children:["See ",(0,s.jsx)(d.a,{href:"/basics/#auto-resizing",children:"Auto resizing"})]})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"resizeToFit"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(): void"})}),(0,s.jsxs)(d.td,{children:["See ",(0,s.jsx)(d.a,{href:"/basics/#auto-resizing",children:"Auto resizing"})]})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"fromJSON"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(data: SerializedGridview): void"})}),(0,s.jsxs)(d.td,{children:["See ",(0,s.jsx)(d.a,{href:"/basics/#serialization",children:"Serialization"})]})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"toJSON"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(): SerializedGridview"})}),(0,s.jsxs)(d.td,{children:["See ",(0,s.jsx)(d.a,{href:"/basics/#serialization",children:"Serialization"})]})]})]})]}),"\n",(0,s.jsxs)(d.h2,{id:"gridview-panel-api",children:["Gridview Panel API",(0,s.jsx)(d.a,{"aria-hidden":"true",tabIndex:"-1",href:"#gridview-panel-api",children:(0,s.jsx)(d.span,{className:"icon icon-link"})})]}),"\n",(0,s.jsx)(d.pre,{children:(0,s.jsx)(d.code,{className:"language-tsx",children:"const MyComponent = (props: IGridviewPanelProps<{ title: string }>) => {\n    // props.api...\n\n    return <div>{`My first panel has the title: ${props.params.title}`}</div>;\n};\n"})}),"\n",(0,s.jsxs)(d.table,{children:[(0,s.jsx)(d.thead,{children:(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.th,{children:"Property"}),(0,s.jsx)(d.th,{children:"Type"}),(0,s.jsx)(d.th,{children:"Description"})]})}),(0,s.jsxs)(d.tbody,{children:[(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"id"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"string"})}),(0,s.jsx)(d.td,{children:"Panel id"})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"isFocused"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"boolean"})}),(0,s.jsx)(d.td,{children:"Is panel focsed"})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"isActive"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"boolean"})}),(0,s.jsx)(d.td,{children:"Is panel active"})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"isVisible"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"boolean"})}),(0,s.jsx)(d.td,{children:"Is panel visible"})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"width"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"number"})}),(0,s.jsx)(d.td,{children:"Panel width"})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"height"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"number"})}),(0,s.jsx)(d.td,{children:"Panel height"})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onDidDimensionsChange"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Event<PanelDimensionChangeEvent>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onDidFocusChange"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Event<FocusEvent>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onDidVisibilityChange"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Event<VisibilityEvent>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onDidActiveChange"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Event<ActiveEvent>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onFocusEvent"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"Event<void>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"onDidConstraintsChange"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"onDidConstraintsChange: Event<PanelConstraintChangeEvent>"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"setVisible"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(isVisible: boolean): void"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"setActive"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(): void"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"setConstraints"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(value: PanelConstraintChangeEvent2): void;"})}),(0,s.jsx)(d.td,{})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"setSize"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"(event: SizeEvent): void"})}),(0,s.jsx)(d.td,{})]})]})]})]})},i=Object.assign({},(0,n.ah)(),e.components),r=i.wrapper;return r?(0,s.jsx)(r,Object.assign({},e,{children:(0,s.jsx)(d,{})})):d()}}},function(e){e.O(0,[774,888,179],(function(){return d=6542,e(e.s=d);var d}));var d=e.O();_N_E=d}]);