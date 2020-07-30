import { IView } from "./splitview/splitview";

export const range = (from: number, to: number) => {
  const result: number[] = [];

  if (from <= to) {
    for (let i = from; i < to; i++) {
      result.push(i);
    }
  } else {
    for (let i = from; i > to; i--) {
      result.push(i);
    }
  }

  return result;
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(value, min));
};

export const clampView = (view: IView, size: number) => {
  const result = clamp(size, view.minimumSize, view.maximumSize);

  if (typeof view.snapSize !== "number" || size >= view.minimumSize) {
    return result;
  }

  const snapSize = Math.min(view.snapSize, view.minimumSize);
  return size < snapSize ? 0 : view.minimumSize;
};

// export interface IDimensionView {
//   minimumSize: number;
//   maximumSize: number;
//   snapSize?: number;
// }

// export const resizeView = <T extends IDimensionView>(
//   index: number,
//   size: number,
//   views: T[],
//   _size: number
// ) => {
//   let values = [...views].map((_) => ({ ..._ }));

//   if (index < 0 || index >= values.length) {
//     return values;
//   }

//   const item = values[index];
//   size = Math.round(size);
//   // size = clamp(size, item.minimumSize, item.maximumSize);
//   size = clamp(size, item.minimumSize, Math.min(item.maximumSize, _size));

//   let delta = size - item.size;

//   if (delta !== 0 && index < values.length - 1) {
//     const downIndexes = range(index + 1, values.length);
//     const collapseDown = downIndexes.reduce(
//       (r, i) => r + (values[i].size - values[i].minimumSize),
//       0
//     );
//     const expandDown = downIndexes.reduce(
//       (r, i) => r + (values[i].maximumSize - values[i].size),
//       0
//     );
//     const deltaDown = clamp(delta, -expandDown, collapseDown);

//     values = resize(
//       index,
//       deltaDown,
//       values,
//       values.map((x) => x.size)
//     );
//     delta -= deltaDown;
//   }

//   if (delta !== 0 && index > 0) {
//     const upIndexes = range(index - 1, -1);
//     const collapseUp = upIndexes.reduce(
//       (r, i) => r + (values[i].size - values[i].minimumSize),
//       0
//     );
//     const expandUp = upIndexes.reduce(
//       (r, i) => r + (values[i].maximumSize - values[i].size),
//       0
//     );
//     const deltaUp = clamp(-delta, -collapseUp, expandUp);

//     values = resize(
//       index - 1,
//       deltaUp,
//       values,
//       values.map((x) => x.size)
//     );
//   }

//   return values;
// };

// export const resize = <T extends IDimensionView>(
//   index: number,
//   delta: number,
//   views: T[],
//   sizes: number[]
// ): T[] => {
//   const values = views; // [...views].map(_ => ({ ..._ }));

//   if (index < 0 || index > values.length) {
//     return values;
//   }

//   const upIndexes = range(index, -1);
//   const downIndexes = range(index + 1, values.length);
//   //
//   const upItems = upIndexes.map((i) => values[i]);
//   const upSizes = upIndexes.map((i) => sizes[i]);
//   //
//   const downItems = downIndexes.map((i) => values[i]);
//   const downSizes = downIndexes.map((i) => sizes[i]);
//   //
//   const minDeltaUp = upIndexes.reduce(
//     (_, i) =>
//       _ +
//       (typeof values[i].snapSize === "number" ? 0 : values[i].minimumSize) -
//       sizes[i],
//     0
//   );
//   const maxDeltaUp = upIndexes.reduce(
//     (_, i) => _ + values[i].maximumSize - sizes[i],
//     0
//   );
//   //
//   const maxDeltaDown =
//     downIndexes.length === 0
//       ? Number.POSITIVE_INFINITY
//       : downIndexes.reduce(
//           (_, i) =>
//             _ +
//             sizes[i] -
//             (typeof values[i].snapSize === "number"
//               ? 0
//               : values[i].minimumSize),
//           0
//         );
//   const minDeltaDown =
//     downIndexes.length === 0
//       ? Number.NEGATIVE_INFINITY
//       : downIndexes.reduce((_, i) => _ + sizes[i] - values[i].maximumSize, 0);
//   //
//   const minDelta = Math.max(minDeltaUp, minDeltaDown);
//   const maxDelta = Math.min(maxDeltaDown, maxDeltaUp);
//   //
//   const tentativeDelta = clamp(delta, minDelta, maxDelta);
//   let actualDelta = 0;
//   //
//   let deltaUp = tentativeDelta;
//   for (let i = 0; i < upItems.length; i++) {
//     const item = upItems[i];
//     const size = clampView(item, upSizes[i] + deltaUp);
//     const viewDelta = size - upSizes[i];

//     actualDelta += viewDelta;
//     deltaUp -= viewDelta;
//     item.size = size;
//   }
//   //
//   let deltaDown = actualDelta;
//   for (let i = 0; i < downItems.length; i++) {
//     const item = downItems[i];
//     const size = clampView(item, downSizes[i] - deltaDown);
//     const viewDelta = size - downSizes[i];

//     deltaDown += viewDelta;
//     item.size = size;
//   }
//   //
//   return values;
// };

// export const distributeEmptySpace = <T extends IDimensionView>(
//   values: T[],
//   size: number
// ) => {
//   const views = values; // [...values].map((_) => ({ ..._ }));

//   let contentSize = views.reduce((r, i) => r + i.size, 0);
//   let emptyDelta = size - contentSize;

//   for (let i = views.length - 1; emptyDelta !== 0 && i >= 0; i--) {
//     const item = views[i];
//     const size = clampView(item, item.size + emptyDelta);
//     const viewDelta = size - item.size;

//     emptyDelta -= viewDelta;
//     item.size = size;
//   }

//   return views;
// };

/**
 * Pushes an element to the start of the array, if found.
 */
export function pushToStart<T>(arr: T[], value: T): void {
  const index = arr.indexOf(value);

  if (index > -1) {
    arr.splice(index, 1);
    arr.unshift(value);
  }
}

/**
 * Pushes an element to the end of the array, if found.
 */
export function pushToEnd<T>(arr: T[], value: T): void {
  const index = arr.indexOf(value);

  if (index > -1) {
    arr.splice(index, 1);
    arr.push(value);
  }
}
