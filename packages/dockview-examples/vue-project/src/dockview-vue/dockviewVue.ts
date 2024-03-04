import { defineComponent, h, type ComponentOptionsBase, type PropType } from 'vue'
import {
  DockviewComponent,
  DockviewApi,
  type IContentRenderer,
  type ITabRenderer,
  type IWatermarkRenderer
} from 'dockview-core'
import { VueContentRenderer, VueTabRenderer, VueWatermarkRenderer } from './utils'

type ComponentInterface = ComponentOptionsBase<any, any, any, any, any, any, any, any>

export interface DockviewReadyEvent {
  api: DockviewApi
}

export type DVProps = {
  readonly components: { [index: string]: any }
  readonly tabComponents?: { [index: string]: any }
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
        type: Object as PropType<{ [index: string]: any }>,
        required: true
      },
      tabComponents: Object as PropType<{ [index: string]: any }>
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

      this.$props.components

      console.log('dockview-vue: mounted vue wrapper', this.$props.components)

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

              return new VueContentRenderer(component as ComponentInterface)
            }
          },
          tab: {
            createComponent: (id: string, componentId: string, component: any): ITabRenderer => {
              return new VueTabRenderer(component as ComponentInterface)
            }
          },
          watermark: {
            createComponent: (
              id: string,
              componentId: string,
              component: any
            ): IWatermarkRenderer => {
              return new VueWatermarkRenderer(component as ComponentInterface)
            }
          }
        }
      })

      const api = new DockviewApi(instance)

      

      this.$emit('ready', { api });

      // this.$emit('')

      // this.name // type: string | undefined
      // this.msg // type: string
      // this.count // type: number
    }
  }
)
