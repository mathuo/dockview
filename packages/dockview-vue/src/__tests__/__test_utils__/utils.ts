import { ComponentInternalInstance, getCurrentInstance } from 'vue';

export function setMockRefElement() {
    const mockElement = document.createElement('div');
    mockElement.style.width = '1000px';
    mockElement.style.height = '800px';

    Object.defineProperty(mockElement, 'clientWidth', {
        configurable: true,
        value: 1000,
    });
    Object.defineProperty(mockElement, 'clientHeight', {
        configurable: true,
        value: 800,
    });
    Object.defineProperty(mockElement, 'offsetWidth', {
        configurable: true,
        value: 1000,
    });
    Object.defineProperty(mockElement, 'offsetHeight', {
        configurable: true,
        value: 800,
    });

    return mockElement;
}

export function createMockVueInstance(): ComponentInternalInstance {
    return {
        appContext: {
            app: {} as any,
            config: {} as any,
            mixins: [],
            components: {
                'test-component': {
                    props: {
                        params: Object,
                        api: Object,
                        containerApi: Object,
                    },
                    template: '<div>Test Component</div>',
                },
            },
            directives: {},
            provides: {},
            globalProperties: {},
        },
        parent: null,
        components: {
            'test-component': {
                props: { params: Object, api: Object, containerApi: Object },
                template: '<div>Test Component</div>',
            },
        },
        provides: {},
    } as any;
}
