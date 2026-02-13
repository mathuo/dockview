// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
}));

// Mock HTMLElement methods
HTMLElement.prototype.scrollIntoView = jest.fn();
HTMLElement.prototype.focus = jest.fn();
HTMLElement.prototype.blur = jest.fn();
