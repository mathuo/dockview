import { Gridview, getRelativeLocation, IGridView } from '../gridview/gridview'
import { Position } from '../groupview/droptarget/droptarget'
import { getGridLocation } from '../gridview/gridview'
import { tail, sequenceEquals } from '../array'
import {
    GroupChangeKind,
    GroupChangeEvent,
    GroupDropEvent,
} from '../groupview/groupview'
import { CompositeDisposable, Disposable, IValueDisposable } from '../lifecycle'
import { Event, Emitter } from '../events'

import { DebugWidget } from './components/debug/debug'

import { sequentialNumberGenerator } from '../math'
import { IPanelDeserializer } from './deserializer'

import { createComponent } from '../splitview/options'
import { LayoutPriority, Orientation } from '../splitview/splitview'

const nextLayoutId = sequentialNumberGenerator()

export interface AddComponentOptions {
    component: string
    params?: { [key: string]: any }
    id: string
    position?: {
        direction?: 'left' | 'right' | 'above' | 'below' | 'within'
        reference: string
    }
    size?: number
    priority?: LayoutPriority
    snap?: boolean
}

export interface GridComponentOptions {
    orientation: Orientation
    components?: {
        [componentName: string]: IComponentGridview
    }
    frameworkComponents?: {
        [componentName: string]: any
    }
    frameworkComponentFactory: any
    tabHeight?: number
}

export interface IComponentGridview extends IGridView {
    id: string
    init: (params: { params: any }) => void
    priority?: LayoutPriority
}

export interface MovementOptions2 {
    group?: IComponentGridview
}

export interface IComponentGridviewLayout {
    addComponent(options: AddComponentOptions): void
}

export class ComponentGridview
    extends CompositeDisposable
    implements IComponentGridviewLayout {
    private readonly _id = nextLayoutId.next()
    private readonly groups = new Map<
        string,
        IValueDisposable<IComponentGridview>
    >()
    private readonly gridview: Gridview = new Gridview(false)
    // events
    private readonly _onDidLayoutChange = new Emitter<GroupChangeEvent>()
    readonly onDidLayoutChange: Event<GroupChangeEvent> = this
        ._onDidLayoutChange.event
    // everything else
    private _size: number
    private _orthogonalSize: number
    private _activeGroup: IComponentGridview
    private _deserializer: IPanelDeserializer
    private resizeTimer: NodeJS.Timer
    private debugContainer: DebugWidget

    constructor(
        private readonly element: HTMLElement,
        public readonly options: GridComponentOptions
    ) {
        super()

        this.element.appendChild(this.gridview.element)

        if (!this.options.components) {
            this.options.components = {}
        }
        if (!this.options.frameworkComponents) {
            this.options.frameworkComponents = {}
        }

        this.addDisposables(
            this.gridview.onDidChange((e) => {
                this._onDidLayoutChange.fire({ kind: GroupChangeKind.LAYOUT })
            })
        )
    }

    get minimumHeight() {
        return this.gridview.minimumHeight
    }
    get maximumHeight() {
        return this.gridview.maximumHeight
    }
    get minimumWidth() {
        return this.gridview.maximumWidth
    }
    get maximumWidth() {
        return this.gridview.maximumWidth
    }

    get activeGroup() {
        return this._activeGroup
    }

    get deserializer() {
        return this._deserializer
    }

    set deserializer(value: IPanelDeserializer) {
        this._deserializer = value
    }

    get id() {
        return this._id
    }

    get size() {
        return this.groups.size
    }

    public moveToNext(options?: MovementOptions2) {
        if (!options) {
            options = {}
        }
        if (!options.group) {
            options.group = this.activeGroup
        }

        const location = getGridLocation(options.group.element)
        const next = this.gridview.next(location)?.view as IComponentGridview
        this.doSetGroupActive(next)
    }

    public moveToPrevious(options?: MovementOptions2) {
        if (!options) {
            options = {}
        }
        if (!options.group) {
            options.group = this.activeGroup
        }

        const location = getGridLocation(options.group.element)
        const next = this.gridview.preivous(location)
            ?.view as IComponentGridview
        this.doSetGroupActive(next)
    }

    /**
     * Serialize the current state of the layout
     *
     * @returns A JSON respresentation of the layout
     */
    public toJSON() {
        const data = this.gridview.serialize()

        return { grid: data }
    }

    public deserialize(data: any) {
        this.gridview.clear()
        this.groups.clear()

        this.fromJSON(data, this.deserializer)
        this.gridview.layout(this._size, this._orthogonalSize)
    }

    public fromJSON(data: any, deserializer: IPanelDeserializer) {
        const { grid, panels } = data

        // this.gridview.deserialize(
        //   grid,
        //   new DefaultDeserializer(this, {
        //     createPanel: (id) => {
        //       const panelData = panels[id];
        //       const panel = deserializer.fromJSON(panelData);
        //       this.registerPanel(panel);
        //       return panel;
        //     },
        //   })
        // );
        this._onDidLayoutChange.fire({ kind: GroupChangeKind.NEW_LAYOUT })
    }

    public setAutoResizeToFit(enabled: boolean) {
        if (this.resizeTimer) {
            clearInterval(this.resizeTimer)
        }
        if (enabled) {
            this.resizeTimer = setInterval(() => {
                this.resizeToFit()
            }, 500)
        }
    }

    /**
     * Resize the layout to fit the parent container
     */
    public resizeToFit() {
        const {
            width,
            height,
        } = this.element.parentElement.getBoundingClientRect()
        this.layout(width, height)
    }

    public addComponent(options: AddComponentOptions) {
        let relativeLocation: number[] = [0]

        if (options.position?.reference) {
            const referenceGroup = this.groups.get(options.position.reference)
                .value

            const target = this.toTarget(options.position.direction)
            if (target === Position.Center) {
                throw new Error(`${target} not supported as an option`)
            } else {
                const location = getGridLocation(referenceGroup.element)
                relativeLocation = getRelativeLocation(
                    this.gridview.orientation,
                    location,
                    target
                )
            }
        }

        const view = createComponent(
            options.component,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkComponentFactory.createComponent
        )
        view.init({ params: {} })
        view.priority = options.priority
        view.snap = options.snap

        this.groups.set(options.id, {
            value: view,
            disposable: Disposable.NONE,
        })

        this.doAddGroup(view, relativeLocation, options.size)
    }

    public getGroup(id: string) {
        return this.groups.get(id)?.value
    }

    public removeGroup(group: IComponentGridview) {
        if (group === this._activeGroup) {
            this._activeGroup = undefined
        }
        this.doRemoveGroup(group)
    }

    private doAddGroup(
        group: IComponentGridview,
        location: number[],
        size?: number
    ) {
        this.gridview.addView(group, size ?? { type: 'distribute' }, location)

        this._onDidLayoutChange.fire({ kind: GroupChangeKind.ADD_GROUP })
        this.doSetGroupActive(group)
    }

    private doRemoveGroup(
        group: IComponentGridview,
        options?: { skipActive?: boolean; skipDispose?: boolean }
    ) {
        if (!this.groups.has(group.id)) {
            throw new Error('invalid operation')
        }

        const { disposable } = this.groups.get(group.id)

        if (!options?.skipDispose) {
            disposable.dispose()
            this.groups.delete(group.id)
        }

        const view = this.gridview.remove(group, { type: 'distribute' })
        this._onDidLayoutChange.fire({ kind: GroupChangeKind.REMOVE_GROUP })

        if (!options?.skipActive && this.groups.size > 0) {
            this.doSetGroupActive(Array.from(this.groups.values())[0].value)
        }

        return view
    }

    public doSetGroupActive(group: IComponentGridview) {
        if (this._activeGroup && this._activeGroup !== group) {
            // this._activeGroup.setActive(false);
        }
        // group.setActive(true);
        this._activeGroup = group
    }

    public moveGroup(
        referenceGroup: IComponentGridview,
        groupId: string,
        itemId: string,
        target: Position
    ) {
        const sourceGroup = groupId ? this.groups.get(groupId).value : undefined

        const referenceLocation = getGridLocation(referenceGroup.element)
        const targetLocation = getRelativeLocation(
            this.gridview.orientation,
            referenceLocation,
            target
        )

        const [targetParentLocation, to] = tail(targetLocation)
        const sourceLocation = getGridLocation(sourceGroup.element)
        const [sourceParentLocation, from] = tail(sourceLocation)

        if (sequenceEquals(sourceParentLocation, targetParentLocation)) {
            // special case when 'swapping' two views within same grid location
            // if a group has one tab - we are essentially moving the 'group'
            // which is equivalent to swapping two views in this case
            this.gridview.moveView(sourceParentLocation, from, to)

            return
        }

        // source group will become empty so delete the group
        const targetGroup = this.doRemoveGroup(sourceGroup, {
            skipActive: true,
            skipDispose: true,
        }) as IComponentGridview

        // after deleting the group we need to re-evaulate the ref location
        const updatedReferenceLocation = getGridLocation(referenceGroup.element)
        const location = getRelativeLocation(
            this.gridview.orientation,
            updatedReferenceLocation,
            target
        )
        this.doAddGroup(targetGroup, location)
    }

    public layout(size: number, orthogonalSize: number, force?: boolean) {
        const different =
            force ||
            size !== this._size ||
            orthogonalSize !== this._orthogonalSize

        if (!different) {
            return
        }

        this.element.style.height = `${orthogonalSize}px`
        this.element.style.width = `${size}px`

        this._size = size
        this._orthogonalSize = orthogonalSize
        this.gridview.layout(size, orthogonalSize)
    }

    private toTarget(
        direction: 'left' | 'right' | 'above' | 'below' | 'within'
    ) {
        switch (direction) {
            case 'left':
                return Position.Left
            case 'right':
                return Position.Right
            case 'above':
                return Position.Top
            case 'below':
                return Position.Bottom
            case 'within':
            default:
                return Position.Center
        }
    }

    public dispose() {
        super.dispose()

        this.gridview.dispose()

        this.debugContainer?.dispose()

        if (this.resizeTimer) {
            clearInterval(this.resizeTimer)
            this.resizeTimer = undefined
        }

        this._onDidLayoutChange.dispose()
    }
}
