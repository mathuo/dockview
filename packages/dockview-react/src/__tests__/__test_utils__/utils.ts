export function setMockRefElement(node: Partial<HTMLElement>): void {
    const mockRef = {
        get current() {
            return node;
        },
        set current(_value) {
            //noop
        },
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    jest.spyOn(require('react'), 'useRef').mockReturnValueOnce(mockRef);
}
