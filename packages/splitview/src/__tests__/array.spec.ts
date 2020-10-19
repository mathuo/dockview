import { last, pushToEnd, pushToStart, range, tail } from '../array';

describe('array', () => {
    it('tail', () => {
        expect(tail([1, 2, 3, 4, 5])).toEqual([[1, 2, 3, 4], 5]);
        expect(tail([1, 2])).toEqual([[1], 2]);
        expect(tail([1])).toEqual([[], 1]);
    });

    it('last', () => {
        expect(last([1, 2, 3, 4])).toBe(4);
        expect(last([])).toBeUndefined();
    });

    it('pushToEnd', () => {
        let arr1 = [1, 2, 3, 4];
        pushToEnd(arr1, 3);
        expect(arr1).toEqual([1, 2, 4, 3]);
        pushToEnd(arr1, 5);
        expect(arr1).toEqual([1, 2, 4, 3]);
    });

    it('pushToStart', () => {
        let arr1 = [1, 2, 3, 4];
        pushToStart(arr1, 3);
        expect(arr1).toEqual([3, 1, 2, 4]);
        pushToStart(arr1, 5);
        expect(arr1).toEqual([3, 1, 2, 4]);
    });

    it('range', () => {
        expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
        expect(range(5, 0)).toEqual([5, 4, 3, 2, 1]);
        expect(range(5)).toEqual([0, 1, 2, 3, 4]);
    });
});
