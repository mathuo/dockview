import { fromPartial } from "@total-typescript/shoehorn";

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
        dispatchEvent: (event: Event) => {
            const items = listeners[event.type];
            if (!items) {
                return;
            }
            items.forEach((item) => item());
        },
        document: document,
        close: jest.fn(),
        get innerWidth() {
            return width++;
        },
        get innerHeight() {
            return height++;
        },
    });
}
