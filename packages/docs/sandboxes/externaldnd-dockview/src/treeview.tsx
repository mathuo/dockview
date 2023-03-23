import { useState } from 'react';
import { Tree } from '@minoru/react-dnd-treeview';
import * as React from 'react';

const SampleData = [
    {
        id: 1,
        parent: 0,
        droppable: true,
        text: 'Folder 1',
    },
    {
        id: 2,
        parent: 1,
        droppable: false,
        text: 'File 1-1',
    },
    {
        id: 3,
        parent: 1,
        droppable: false,
        text: 'File 1-2',
    },
    {
        id: 4,
        parent: 0,
        droppable: true,
        text: 'Folder 2',
    },
    {
        id: 5,
        parent: 4,
        droppable: true,
        text: 'Folder 2-1',
    },
    {
        id: 6,
        parent: 5,
        droppable: false,
        text: 'File 2-1-1',
    },
    {
        id: 7,
        parent: 0,
        droppable: false,
        text: 'File 3',
    },
];

const TreeComponent = () => {
    const [treeData, setTreeData] = useState(SampleData);
    const handleDrop = (newTreeData: any) => {
        console.log('handleDrop');
        setTreeData(newTreeData);
    };
    return (
        <Tree
            tree={treeData}
            rootId={0}
            onDrop={handleDrop}
            onDragEnd={(event) => console.log('onDragEnd', event)}
            render={(node, { depth, isOpen, onToggle }) => (
                <div style={{ marginLeft: depth * 10 }}>
                    {node.droppable && (
                        <span onClick={onToggle}>{isOpen ? '[-]' : '[+]'}</span>
                    )}
                    {node.text}
                </div>
            )}
        />
    );
};

export default TreeComponent;
