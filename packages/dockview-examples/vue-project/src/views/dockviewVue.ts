import { DefineComponent, defineComponent, h } from 'vue'
import { DockviewComponent, DockviewApi } from 'dockview-core'

export interface DockviewReadyEvent {
  api: DockviewApi
}

export type DVProps = {
  readonly isLocked?: boolean
}

export type DVEmits = {
  ready(api: number): void
}

type RawBindings = {}

export default defineComponent<DVProps, RawBindings, {}, {}, {}, {}, {}, DVEmits>({
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
  mounted() {
    const element = this.$el as HTMLElement

    const instance = new DockviewComponent({
      parentElement: element
    })

    const api = new DockviewApi(instance)

    this.$emit('on-ready', { api })

    this.$emit('')

    this.name // type: string | undefined
    this.msg // type: string
    this.count // type: number
  }
})
