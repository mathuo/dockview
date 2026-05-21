// jsdom does not implement PointerEvent or document.elementsFromPoint.
// These shims provide the minimal surface dockview's pointer drag tests need.

if (typeof window.PointerEvent === 'undefined') {
    class PointerEvent extends MouseEvent {
        constructor(type, init = {}) {
            super(type, init);
            this.pointerId = init.pointerId !== undefined ? init.pointerId : 0;
            this.pointerType = init.pointerType || '';
            this.isPrimary =
                init.isPrimary !== undefined ? init.isPrimary : true;
            this.width = init.width !== undefined ? init.width : 1;
            this.height = init.height !== undefined ? init.height : 1;
            this.pressure = init.pressure !== undefined ? init.pressure : 0;
            this.tangentialPressure = 0;
            this.tiltX = 0;
            this.tiltY = 0;
            this.twist = 0;
        }
    }
    window.PointerEvent = PointerEvent;
}

// Polyfill on Document.prototype so any document (including popout
// stand-ins created via `document.implementation.createHTMLDocument`)
// inherits these. Tests that need a specific element under the pointer
// override per-instance via `jest.spyOn(theDoc, 'elementsFromPoint')`.
if (typeof Document.prototype.elementsFromPoint !== 'function') {
    Document.prototype.elementsFromPoint = function () {
        return [];
    };
}

if (typeof Document.prototype.elementFromPoint !== 'function') {
    Document.prototype.elementFromPoint = function () {
        return null;
    };
}
