import { createComponent } from '../../panel/componentFactory';

describe('componentFactory', () => {
    describe('createComponent', () => {
        test('valid component and framework component', () => {
            const mock = jest.fn();
            const mock2 = jest.fn();

            expect(() =>
                createComponent(
                    'id-1',
                    'component-1',
                    { 'component-1': mock },
                    { 'component-1': mock2 }
                )
            ).toThrow(
                "Cannot create 'id-1'. component 'component-1' registered as both a component and frameworkComponent"
            );
        });

        test('valid framework component but no factory', () => {
            const mock = jest.fn();

            expect(() =>
                createComponent(
                    'id-1',
                    'component-1',
                    {},
                    { 'component-1': mock }
                )
            ).toThrow(
                "Cannot create 'id-1' for framework component 'component-1'. you must register a frameworkPanelWrapper to use framework components"
            );
        });

        test('valid framework component', () => {
            const component = jest.fn();
            const createComponentFn = jest
                .fn()
                .mockImplementation(() => component);
            const frameworkComponent = jest.fn();

            expect(
                createComponent(
                    'id-1',
                    'component-1',
                    {},
                    { 'component-1': frameworkComponent },
                    {
                        createComponent: createComponentFn,
                    }
                )
            ).toBe(component);

            expect(createComponentFn).toHaveBeenCalledWith(
                'id-1',
                'component-1',
                frameworkComponent
            );
        });

        test('no valid component with fallback', () => {
            const mock = jest.fn();

            expect(
                createComponent(
                    'id-1',
                    'component-1',
                    {},
                    {},
                    {
                        createComponent: () => null,
                    },
                    () => mock
                )
            ).toBe(mock);
        });

        test('no valid component', () => {
            expect(() =>
                createComponent('id-1', 'component-1', {}, {})
            ).toThrow(
                "Cannot create 'id-1', no component 'component-1' provided"
            );
        });

        test('valid component', () => {
            const component = jest.fn();

            const componentResult = createComponent(
                'id-1',
                'component-1',
                { 'component-1': component },
                {}
            );

            expect(component).toHaveBeenCalled();

            expect(componentResult instanceof component).toBeTruthy();
        });
    });
});
