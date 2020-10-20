import { Emitter, Event } from '../events';

describe('events', () => {
    describe('emitter', () => {
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
});
