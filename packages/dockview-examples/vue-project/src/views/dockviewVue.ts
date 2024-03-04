import {
  defineComponent,
  createVNode,
  getCurrentInstance,
  h,
  onMounted,
  watch,
  ref,
  toRef,
  type ComponentOptionsBase,
  render
} from 'vue'
import {
  DockviewComponent,
  DockviewApi,
  type IContentRenderer,
  type ITabRenderer,
  type IWatermarkRenderer
} from 'dockview-core'

type ComponentInterface = ComponentOptionsBase<any, any, any, any, any, any, any, any>

export interface DockviewReadyEvent {
  api: DockviewApi
}

export type DVProps = {
  readonly keyA: number
  readonly components: { [index: string]: any }
}

export type DVEmits = {
  onReady(event: { api: DockviewApi }): void
}

type RawBindings = {}

// function mountComponent() {
//   createVNode()
// }

export default defineComponent(
  // <DVProps, RawBindings, {}, {}, {}, {}, {}, DVEmits>
  {
    props: {
      components: {
        type: Object
      }
    },
    // type inference enabled
    render() {
      return h('div')
    },
    methods: {},
    // setup(props, ctx) {
    //   // called once
    //   // return () => {
    //   //   // called on re-render
    //   // }
    // },
    data() {
      return {
        count: 1
      }
    },
    setup(props, ctx) {
      // getCurrentInstance()
      // console.log('props', props.keyA)
      // watch(
      //   () => props.keyA,
      //   (a, b) => {
      //     console.log('asaa')
      //   }
      // )
    },
    watch: {
      props: {
        handler(a, b) {
          console.log('a,b')
        }
      }
    },
    mounted() {
      const element = this.$el as HTMLElement

      console.log('dockview-vue: mounted vue wrapper', this.$props.components)
      const components = this.$props.components as Record<string, ComponentInterface>

      const instance = new DockviewComponent({
        parentElement: element,
        frameworkComponents: this.$props.components,
        frameworkComponentFactory: {
          content: {
            createComponent: (
              id: string,
              componentId: string,
              component: any
            ): IContentRenderer => {
              console.log('dockview-vue: createComponent', this.$props.components)

              const instance = component as ComponentInterface
              const customProps = {}

              const vNode = createVNode(instance, customProps)

              const element = document.createElement('div')

              render(vNode, element)

              return {
                element: element,
                focus: () => {
                  //
                },
                init: (parameters) => {
                  //
                },
                dispose: () => {
                  render(null, element)
                }
              }
            }
          },
          tab: {
            createComponent: (id: string, componentId: string, component: any): ITabRenderer => {
              return null as any
            }
          },
          watermark: {
            createComponent: (
              id: string,
              componentId: string,
              component: any
            ): IWatermarkRenderer => {
              return null as any
            }
          }
        }
      })

      const api = new DockviewApi(instance)

      this.$emit('onReady', { api })

      // this.$emit('')

      // this.name // type: string | undefined
      // this.msg // type: string
      // this.count // type: number
    }
  }
)
