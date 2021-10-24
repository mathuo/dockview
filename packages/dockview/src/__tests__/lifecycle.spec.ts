import { MutableDisposable } from '../lifecycle';

describe('lifecycle', () => {
    test('mutable disposable', () => {
        const mutableDisposable = new MutableDisposable();

        let disposed = 0;

        const disposable = () => ({
            dispose: () => {
                disposed++;
            },
        });

        mutableDisposable.value = disposable();
        expect(disposed).toBe(0);

        mutableDisposable.value = disposable();
        expect(disposed).toBe(1);

        mutableDisposable.dispose();
        expect(disposed).toBe(2);

        mutableDisposable.dispose();
    });
});
