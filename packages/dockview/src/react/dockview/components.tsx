import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isReactElement, ReactPartContext } from '../react';
import { ReactContentPartContext } from './reactContentPart';

interface WithChildren {
    children: React.ReactNode;
}

const Tab: React.FunctionComponent<WithChildren> = (props: WithChildren) => {
    return <>{props.children}</>;
};

const Content: React.FunctionComponent<WithChildren> = (
    props: WithChildren
) => {
    return <>{props.children}</>;
};
const Actions: React.FunctionComponent<WithChildren> = (
    props: WithChildren
) => {
    return <>{props.children}</>;
};

function isValidComponent(element: React.ReactElement) {
    return [Content, Actions, Tab].find((comp) => element.type === comp);
}

const Panel: React.FunctionComponent<WithChildren> = (props: WithChildren) => {
    const context = React.useContext(
        ReactPartContext
    ) as ReactContentPartContext;

    const sections = React.useMemo(() => {
        const childs =
            React.Children.map(props.children, (_) => _)?.filter(
                isReactElement
            ) || [];

        const isInvalid = !!childs.find((_) => !isValidComponent(_));

        if (isInvalid) {
            throw new Error(
                'Children of DockviewComponents.Panel must be one of the following: DockviewComponents.Content, DockviewComponents.Actions, DockviewComponents.Tab'
            );
        }

        const body = childs.find((_) => _.type === Content);
        const actions = childs.find((_) => _.type === Actions);
        const tab = childs.find((_) => _.type === Tab);

        return { body, actions, tab };
    }, [props.children]);

    React.useEffect(() => {
        /**
         * hide or show the default tab behavior based on whether we want to override
         * with our own React tab.
         */
        if (sections.tab) {
            context.tabPortalElement.hide();
        } else {
            context.tabPortalElement.show();
        }
    }, [sections.tab]);

    return (
        <>
            {sections.actions &&
                ReactDOM.createPortal(
                    sections.actions,
                    context.actionsPortalElement
                )}
            {sections.tab &&
                ReactDOM.createPortal(
                    sections.tab,
                    context.tabPortalElement.element
                )}
            {sections.body || props.children}
        </>
    );
};

export const DockviewComponents = {
    Tab,
    Content,
    Actions,
    Panel,
};
