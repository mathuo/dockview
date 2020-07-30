import { Gridview, getRelativeLocation } from "../gridview/gridview";
import { Target } from "../groupview/droptarget/droptarget";
import { getGridLocation } from "../gridview/gridview";
import { tail, sequenceEquals } from "../array";
import { IGroupview, Groupview } from "../groupview/groupview";
import { IPanel } from "../groupview/group";

let nextId = 0;

export interface Api {}

export interface IGroupAccessor {
  getGroup: (id: string) => IGroupview;
  moveGroup(
    referenceGroup: IGroupview,
    groupId: string,
    itemId: string,
    target: Target,
    index?: number
  ): void;
  doSetGroupActive: (group: IGroupview) => void;
}

export class Layout implements IGroupAccessor, Api {
  private gridview: Gridview;
  private groups = new Map<string, IGroupview>();

  private activeGroup: IGroupview;

  private _size: number;
  private _orthogonalSize: number;

  get element() {
    return this.gridview.element;
  }

  constructor() {
    this.gridview = new Gridview();
  }

  public getGroup(id: string) {
    return this.groups.get(id);
  }

  public addGroupItem(
    groupItem: IPanel,
    groupIdentifier?: string,
    location?: number[],
    index?: number
  ) {
    let group: IGroupview;

    if (groupIdentifier) {
      group = this.groups.get(groupIdentifier);
    } else {
      group = this.createGroup();
      this.groups.set(group.id, group);
      this.gridview.addView(group, 200, location || [0]);
    }

    group.openPanel(groupItem, index);
    this.doSetGroupActive(group);
  }

  private addGroup = (group: IGroupview, location: number[]) => {
    this.groups.set(group.id, group);
    this.gridview.addView(group, 200, location);
  };

  public doSetGroupActive(group: IGroupview) {
    if (this.activeGroup) {
      this.activeGroup.setActive(false);
    }
    group.setActive(true);
    this.activeGroup = group;
    // TODO add event fire onDidActiveGroupChange
  }

  public moveGroup(
    referenceGroup: IGroupview,
    groupId: string,
    itemId: string,
    target: Target,
    index?: number
  ) {
    const sourceGroup = this.groups.get(groupId);

    switch (target) {
      case Target.Center:
      case undefined:
        const groupItem = sourceGroup.remove(itemId);
        if (sourceGroup.size === 0) {
          this.gridview.remove(sourceGroup);
        }
        referenceGroup.openPanel(groupItem, index);
        this.gridview.layout(this._size, this._orthogonalSize);

        return;
    }

    const referenceLocation = getGridLocation(referenceGroup.element);
    const targetLocation = getRelativeLocation(
      this.gridview.orientation,
      referenceLocation,
      target
    );

    if (sourceGroup.size < 2) {
      const [targetParentLocation, to] = tail(targetLocation);
      const sourceLocation = getGridLocation(sourceGroup.element);
      const [sourceParentLocation, from] = tail(sourceLocation);

      if (sequenceEquals(sourceParentLocation, targetParentLocation)) {
        // special case when 'swapping' two views within same grid location
        // if a group has one tab - we are essentially moving the 'group'
        // which is equivalent to swapping two views in this case
        this.gridview.moveView(sourceParentLocation, from, to);
        this.gridview.layout(this._size, this._orthogonalSize);

        return;
      }

      // source group will become empty so delete the group
      // TODO - this doesn't work on linked groups
      const targetGroup = this.gridview.remove(sourceGroup) as IGroupview;
      // after deleting the group we need to re-evaulate the ref location
      const updatedReferenceLocation = getGridLocation(referenceGroup.element);
      const location = getRelativeLocation(
        this.gridview.orientation,
        updatedReferenceLocation,
        target
      );
      this.addGroup(targetGroup, location);
      this.gridview.layout(this._size, this._orthogonalSize);
    } else {
      const groupItem = sourceGroup.remove(itemId);
      const dropLocation = getRelativeLocation(
        this.gridview.orientation,
        referenceLocation,
        target
      );

      this.addGroupItem(groupItem, null, dropLocation, index);
      this.gridview.layout(this._size, this._orthogonalSize);
    }
  }

  private createGroup() {
    const referenceGroup = new Groupview(this, (nextId++).toString());

    referenceGroup.onMove((event) => {
      const { groupId, itemId, target, index } = event;
      this.moveGroup(referenceGroup, groupId, itemId, target, index);
    });

    return referenceGroup;
  }

  public layout(size: number, orthogonalSize: number) {
    this._size = size;
    this._orthogonalSize = orthogonalSize;
    this.gridview.layout(size, orthogonalSize);
  }
}
