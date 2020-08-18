export function tail<T>(arr: T[]): [T[], T] {
  if (arr.length === 0) {
    throw new Error("Invalid tail call");
  }

  return [arr.slice(0, arr.length - 1), arr[arr.length - 1]];
}

export function last<T>(arr: T[]): T {
  return arr.length > 0 ? arr[arr.length - 1] : undefined;
}

export function sequenceEquals<T>(arr1: T[], arr2: T[]) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}
