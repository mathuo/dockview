import { vi } from 'vitest';

const ResizeObserverMock = vi.fn(function (this: any) {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
});

global.ResizeObserver = ResizeObserverMock as any;
