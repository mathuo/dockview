import * as React from "react";
import { Orientation } from "splitview";
import { IViewWithReactComponent } from "../splitview";

// component view

export interface IPaneComponentProps extends IViewWithReactComponent {
  setExpanded(expanded: boolean): void;
  orientation: Orientation;
  size: number;
  orthogonalSize: number;
  userprops?: { [index: string]: any };
}

export interface IPaneComponentRef {
  layout: (size: number, orthogonalSize: number) => void;
}

export type PaneComponent = React.RefForwardingComponent<
  IPaneComponentRef,
  IPaneComponentProps
>;

export interface IPaneHeaderComponentProps extends IViewWithReactComponent {
  setExpanded(expanded: boolean): void;
  isExpanded: boolean;
  userprops?: { [index: string]: any };
}

export type PaneHeaderComponent = React.RefForwardingComponent<
  {},
  IPaneHeaderComponentProps
>;

// component view facade

export interface IPaneRootProps {
  component: PaneComponent;
  props: {};
}

export interface IPaneHeaderRootProps {
  component: PaneHeaderComponent;
  props: {};
}

export interface IPaneRootRef extends IPaneComponentRef {
  updateProps: (props: Partial<IPaneComponentProps>) => void;
}

export interface IPaneHeaderRootRef {
  updateProps: (props: Partial<IPaneHeaderComponentProps>) => void;
}

export const PaneRoot = React.forwardRef(
  (props: IPaneRootProps, facadeRef: React.Ref<IPaneRootRef>) => {
    const ref = React.useRef<IPaneComponentRef>();
    const [facadeProps, setFacadeProps] = React.useState<IPaneComponentProps>();

    React.useImperativeHandle(
      facadeRef,
      () => {
        return {
          updateProps: (props) => {
            setFacadeProps((_props) => ({ ..._props, ...props }));
          },
          layout: (size, orthogonalSize) => {
            ref.current?.layout(size, orthogonalSize);
          },
        };
      },
      [ref]
    );

    const Component = React.useMemo(() => React.forwardRef(props.component), [
      props.component,
    ]);

    const _props = React.useMemo(
      () => ({ ...props.props, ...facadeProps, ref }),
      [props.props, facadeProps]
    );

    return React.createElement(Component, _props);
  }
);

export const PaneHeaderRoot = React.forwardRef(
  (props: IPaneHeaderRootProps, facadeRef: React.Ref<IPaneHeaderRootRef>) => {
    const [facadeProps, setFacadeProps] = React.useState<
      IPaneHeaderComponentProps
    >();

    React.useImperativeHandle(
      facadeRef,
      () => {
        return {
          updateProps: (props) => {
            setFacadeProps((_props) => ({ ..._props, ...props }));
          },
        };
      },
      []
    );

    const Component = React.useMemo(() => React.forwardRef(props.component), [
      props.component,
    ]);

    const _props = React.useMemo(() => ({ ...props.props, ...facadeProps }), [
      props.props,
      facadeProps,
    ]);

    return React.createElement(Component, _props);
  }
);
