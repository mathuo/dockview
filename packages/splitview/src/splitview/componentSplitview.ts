import { IDisposable } from "../lifecycle";
import { Orientation, SplitView } from "./splitview";
import {
  createComponent,
  ISerializableView,
  SplitPanelOptions,
} from "./options";

export interface IComponentSplitview extends IDisposable {
  addFromComponent(options: {
    id: string;
    component: string;
    params?: {
      [index: string]: any;
    };
  }): IDisposable;
  layout(width: number, height: number): void;
  onChange(cb: (event: { proportions: number[] }) => void): IDisposable;
  toJSON(): object;
  deserialize(data: any): void;
}

/**
 * A high-level implementation of splitview that works using 'panels'
 */
export class ComponentSplitview implements IComponentSplitview {
  private splitview: SplitView;

  constructor(
    private readonly element: HTMLElement,
    private readonly options: SplitPanelOptions
  ) {
    if (!options.components) {
      options.components = {};
    }
    if (!options.frameworkComponents) {
      options.frameworkComponents = {};
    }

    this.splitview = new SplitView(this.element, options);
  }

  addFromComponent(options: {
    id: string;
    component: string;
    params?: {
      [index: string]: any;
    };
  }): IDisposable {
    const view = createComponent(
      options.component,
      this.options.components,
      this.options.frameworkComponents,
      this.options.frameworkWrapper.createComponent
    );

    this.registerView(view);

    this.splitview.addView(view, { type: "distribute" });
    view.init({ params: options.params });
    return {
      dispose: () => {
        //
      },
    };
  }

  private registerView(view: ISerializableView) {
    //
  }

  layout(width: number, height: number): void {
    const [size, orthogonalSize] =
      this.splitview.orientation === Orientation.HORIZONTAL
        ? [width, height]
        : [height, width];
    this.splitview.layout(size, orthogonalSize);
  }

  onChange(cb: (event: { proportions: number[] }) => void): IDisposable {
    return this.splitview.onDidSashEnd(() => {
      cb({ proportions: this.splitview.proportions });
    });
  }
  toJSON(): object {
    const views = this.splitview.getViews().map((v: ISerializableView, i) => {
      const size = this.splitview.getViewSize(i);
      return { size, data: v.toJSON ? v.toJSON() : {} };
    });

    return {
      views,
      size: this.splitview.size,
      orientation: this.splitview.orientation,
    };
  }
  deserialize(data: any): void {
    const { views, orientation, size } = data;

    this.splitview.dispose();
    this.splitview = new SplitView(this.element, {
      orientation,
      descriptor: {
        size,
        views: views.map((v) => {
          const data = v.data;

          const view = createComponent(
            data.component,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkWrapper.createComponent
          );

          view.init({ params: v.props });

          return { size: v.size, view };
        }),
      },
    });

    this.splitview.orientation = orientation;
  }

  public dispose() {
    this.splitview.dispose();
  }
}
