import {
    Emitter,
    Event,
    addDisposableListener,
    addDisposableWindowListener,
} from '../events';

describe('events', () => {
    describe('emitter', () => {
        it('debug mode is off', () => {
            expect(Emitter.ENABLE_TRACKING).toBeFalsy();
        });

        it('should emit values', () => {
            const emitter = new Emitter<number>();
            let value: number | undefined = undefined;

            emitter.fire(-1);
            expect(value).toBeUndefined();

            const stream = emitter.event((x) => {
                value = x;
            });

            emitter.fire(0);
            expect(value).toBe(0);

            emitter.fire(1);
            expect(value).toBe(1);

            stream.dispose();
        });

        it('should stop emitting after dispose', () => {
            const emitter = new Emitter<number>();
            let value: number | undefined = undefined;

            const stream = emitter.event((x) => {
                value = x;
            });

            emitter.fire(0);
            expect(value).toBe(0);

            stream.dispose();

            value = undefined;
            emitter.fire(1);
            expect(value).toBeUndefined();
        });

        it('should stop emitting after dispose', () => {
            const emitter = new Emitter<number>();
            let value: number | undefined = undefined;

            const stream = emitter.event((x) => {
                value = x;
            });

            emitter.fire(0);
            expect(value).toBe(0);

            stream.dispose();

            value = undefined;
            emitter.fire(1);
            expect(value).toBeUndefined();
        });

        it('should relay last value in replay mode', () => {
            const emitter = new Emitter<number>({ replay: true });
            let value: number | undefined = undefined;

            emitter.fire(1);

            const stream = emitter.event((x) => {
                value = x;
            });
            expect(value).toBe(1);

            stream.dispose();
        });
    });

    it('should emit a value when any event fires', () => {
        const emitter1 = new Emitter<number>();
        const emitter2 = new Emitter<number>();
        const emitter3 = new Emitter<number>();

        let value: number | undefined = 0;

        const stream = Event.any(
            emitter1.event,
            emitter2.event,
            emitter3.event
        )((x) => {
            value = x;
        });

        emitter2.fire(2);
        expect(value).toBe(2);

        emitter1.fire(1);
        expect(value).toBe(1);

        emitter3.fire(3);
        expect(value).toBe(3);
    });

    it('addDisposableWindowListener with capture options', () => {
        const element = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        };

        const handler = jest.fn();

        const disposable = addDisposableWindowListener(
            element as any,
            'mousedown',
            handler,
            true
        );

        expect(element.addEventListener).toBeCalledTimes(1);
        expect(element.addEventListener).toHaveBeenCalledWith(
            'mousedown',
            handler,
            true
        );
        expect(element.removeEventListener).toBeCalledTimes(0);

        disposable.dispose();

        expect(element.addEventListener).toBeCalledTimes(1);
        expect(element.removeEventListener).toBeCalledTimes(1);
        expect(element.removeEventListener).toBeCalledWith(
            'mousedown',
            handler,
            true
        );
    });

    it('addDisposableWindowListener without capture options', () => {
        const element = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        };

        const handler = jest.fn();

        const disposable = addDisposableWindowListener(
            element as any,
            'mousedown',
            handler
        );

        expect(element.addEventListener).toBeCalledTimes(1);
        expect(element.addEventListener).toHaveBeenCalledWith(
            'mousedown',
            handler,
            undefined
        );
        expect(element.removeEventListener).toBeCalledTimes(0);

        disposable.dispose();

        expect(element.addEventListener).toBeCalledTimes(1);
        expect(element.removeEventListener).toBeCalledTimes(1);
        expect(element.removeEventListener).toBeCalledWith(
            'mousedown',
            handler,
            undefined
        );
    });

    it('addDisposableListener with capture options', () => {
        const element = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        };

        const handler = jest.fn();

        const disposable = addDisposableListener(
            element as any,
            'mousedown',
            handler,
            true
        );

        expect(element.addEventListener).toBeCalledTimes(1);
        expect(element.addEventListener).toHaveBeenCalledWith(
            'mousedown',
            handler,
            true
        );
        expect(element.removeEventListener).toBeCalledTimes(0);

        disposable.dispose();

        expect(element.addEventListener).toBeCalledTimes(1);
        expect(element.removeEventListener).toBeCalledTimes(1);
        expect(element.removeEventListener).toBeCalledWith(
            'mousedown',
            handler,
            true
        );
    });

    it('addDisposableListener without capture options', () => {
        const element = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        };

        const handler = jest.fn();

        const disposable = addDisposableListener(
            element as any,
            'mousedown',
            handler
        );

        expect(element.addEventListener).toBeCalledTimes(1);
        expect(element.addEventListener).toHaveBeenCalledWith(
            'mousedown',
            handler,
            undefined
        );
        expect(element.removeEventListener).toBeCalledTimes(0);

        disposable.dispose();

        expect(element.addEventListener).toBeCalledTimes(1);
        expect(element.removeEventListener).toBeCalledTimes(1);
        expect(element.removeEventListener).toBeCalledWith(
            'mousedown',
            handler,
            undefined
        );
    });
});
