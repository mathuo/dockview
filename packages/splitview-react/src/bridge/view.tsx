import * as React from "react";
import { IViewWithReactComponent } from "../splitview";

// component view

export interface IViewComponentProps
  extends Omit<IViewWithReactComponent, "component"> {
  userprops?: { [index: string]: any };
}

export interface IViewComponentRef {
  layout: (size: number, orthogonalSize: number) => void;
}

export type ViewComponent = React.RefForwardingComponent<
  IViewComponentRef,
  IViewComponentProps
>;

// component view facade

export interface IViewRootProps {
  component: ViewComponent;
  props: {};
}

export interface IViewRootRef extends IViewComponentRef {
  updateProps: (props: Partial<IViewComponentProps>) => void;
}

export const ViewRoot = React.forwardRef(
  (props: IViewRootProps, facadeRef: React.Ref<IViewRootRef>) => {
    const ref = React.useRef<IViewComponentRef>();
    const [facadeProps, setFacadeProps] = React.useState<IViewComponentProps>();

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

    // return <Component ref={ref} {...props.props} {...facadeProps} />;
  }
);
