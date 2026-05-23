import {
    ref,
    onMounted,
    watch,
    onBeforeUnmount,
    markRaw,
    getCurrentInstance,
    type ComponentInternalInstance,
} from 'vue';
import type { DockviewIDisposable } from 'dockview-core';
import { findComponent } from '../utils';

export interface ViewComponentConfig<
    TApi,
    TOptions,
    TProps,
    TEvents,
    TView,
    TFrameworkOptions,
> {
    componentName: string;
    propertyKeys: readonly (keyof TOptions)[];
    createApi: (
        element: HTMLElement,
        options: TOptions & TFrameworkOptions
    ) => TApi;
    createView: (
        id: string,
        name: string | undefined,
        component: any,
        instance: ComponentInternalInstance
    ) => TView;
    extractCoreOptions: (props: TProps) => TOptions;
    onApiCreated?: (api: TApi) => DockviewIDisposable[];
}

export function useViewComponent<
    TApi extends {
        dispose(): void;
        updateOptions(options: Partial<TOptions>): void;
        layout(width: number, height: number): void;
    },
    TOptions,
    TProps,
    TEvents,
    TView,
    TFrameworkOptions,
>(
    config: ViewComponentConfig<
        TApi,
        TOptions,
        TProps,
        TEvents,
        TView,
        TFrameworkOptions
    >,
    props: TProps,
    emit: (event: 'ready', payload: { api: TApi }) => void
) {
    const el = ref<HTMLElement | null>(null);
    const instance = ref<TApi | null>(null);
    const eventDisposables: DockviewIDisposable[] = [];

    config.propertyKeys.forEach((coreOptionKey) => {
        watch(
            () => (props as any)[coreOptionKey],
            (newValue) => {
                if (instance.value) {
                    instance.value.updateOptions({
                        [coreOptionKey]: newValue,
                    } as Partial<TOptions>);
                }
            }
        );
    });

    watch(
        () => (props as any).components,
        () => {
            if (instance.value) {
                const inst = getCurrentInstance();
                if (!inst) {
                    throw new Error(
                        `${config.componentName}: getCurrentInstance() returned null`
                    );
                }

                instance.value.updateOptions({
                    createComponent: (options: {
                        id: string;
                        name?: string;
                    }) => {
                        const component = findComponent(
                            inst,
                            options.name!,
                            (props as any).components
                        );
                        return config.createView(
                            options.id,
                            options.name,
                            component! as any,
                            inst
                        );
                    },
                } as unknown as Partial<TOptions>);
            }
        }
    );

    onMounted(() => {
        if (!el.value) {
            throw new Error(`${config.componentName}: element is not mounted`);
        }

        const inst = getCurrentInstance();

        if (!inst) {
            throw new Error(
                `${config.componentName}: getCurrentInstance() returned null`
            );
        }

        const frameworkOptions = {
            createComponent(options: { id: string; name?: string }) {
                const component = findComponent(
                    inst,
                    options.name!,
                    (props as any).components
                );
                return config.createView(
                    options.id,
                    options.name,
                    component! as any,
                    inst
                );
            },
        } as TFrameworkOptions;

        const api = config.createApi(el.value, {
            ...config.extractCoreOptions(props),
            ...frameworkOptions,
        });

        const { clientWidth, clientHeight } = el.value;
        api.layout(clientWidth, clientHeight);

        instance.value = markRaw(api) as any;

        if (config.onApiCreated) {
            eventDisposables.push(...config.onApiCreated(api));
        }

        emit('ready', { api });
    });

    onBeforeUnmount(() => {
        eventDisposables.forEach((d) => d.dispose());
        eventDisposables.length = 0;
        if (instance.value) {
            instance.value.dispose();
        }
    });

    return {
        el,
        instance,
    };
}
