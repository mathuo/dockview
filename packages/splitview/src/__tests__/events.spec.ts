import { Emitter, Event } from '../events';

describe('events', () => {
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
