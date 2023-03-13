import { addGhostImage } from '../../dnd/ghost';

describe('ghost', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllTimers();
    });

    test('that a custom class is added, the element is added to the document and all is removed afterwards', () => {
        const dataTransferMock = jest.fn<Partial<DataTransfer>, []>(() => {
            return {
                setDragImage: jest.fn(),
            };
        });

        const element = document.createElement('div');
        const dataTransfer = <DataTransfer>new dataTransferMock();

        addGhostImage(dataTransfer, element);

        expect(element.className).toBe('dv-dragged');
        expect(element.parentElement).toBe(document.body);
        expect(dataTransfer.setDragImage).toBeCalledTimes(1);
        expect(dataTransfer.setDragImage).toBeCalledWith(element, 0, 0);

        jest.runAllTimers();

        expect(element.className).toBe('');
        expect(element.parentElement).toBe(null);
    });
});
