import { fromPartial } from '@total-typescript/shoehorn';

export function setupMockWindow() {
    const listeners: Record<string, (() => void)[]> = {};

    let width = 1000;
    let height = 2000;

    return fromPartial<Window>({
        addEventListener: (type: string, listener: () => void) => {
            if (!listeners[type]) {
                listeners[type] = [];
            }
            listeners[type].push(listener);
            if (type === 'load') {
                listener();
            }
        },
        removeEventListener: (type: string, listener: () => void) => {
            if (listeners[type]) {
                const index = listeners[type].indexOf(listener);
                if (index > -1) {
                    listeners[type].splice(index, 1);
                }
            }
        },
        dispatchEvent: (event: Event) => {
            const items = listeners[event.type];
            if (!items) {
                return;
            }
            items.forEach((item) => item());
        },
        document: document,
        close: () => {
            listeners['beforeunload']?.forEach((f) => f());
        },
        get innerWidth() {
            return width++;
        },
        get innerHeight() {
            return height++;
        },
    });
}
