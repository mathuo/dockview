import { IDockviewComponent } from '../../dockview/dockviewComponent';
import { GroupOptions, Groupview } from '../../groupview/groupview';
import {
    GroupPanelPartInitParameters,
    WatermarkPart,
} from '../../groupview/types';

class Watermark implements WatermarkPart {
    get element() {
        return document.createElement('div');
    }

    init(params: GroupPanelPartInitParameters) {
        //
    }

    updateParentGroup() {
        //
    }

    dispose() {
        //
    }
}

describe('groupview', () => {
    let groupview: Groupview;
    let dockview: IDockviewComponent;
    let options: GroupOptions;

    beforeEach(() => {
        dockview = <IDockviewComponent>(<any>{
            options: {
                enableExternalDragEvents: false,
            },
            createWatermarkComponent: () => new Watermark(),
        });
        options = {
            tabHeight: 30,
        };
        groupview = new Groupview(dockview, 'dumm_id', options);
    });

    test('default', () => {
        let viewQuery = groupview.element.querySelectorAll(
            '.groupview > .title-container'
        );
        expect(viewQuery).toBeTruthy();

        viewQuery = groupview.element.querySelectorAll(
            '.groupview > .content-container'
        );
        expect(viewQuery).toBeTruthy();
    });
});
