import { Parameters } from "./panel/types";

export interface PanelParameters<T extends {} = Parameters> {
    params: T;
}

