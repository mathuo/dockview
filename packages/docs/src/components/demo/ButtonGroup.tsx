import * as React from 'react';
import { ButtonGroup as ChakraButtonGroup } from '@chakra-ui/react';

interface ButtonGroupProps {
    children: React.ReactNode;
    className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ children, className = '' }) => {
    return (
        <ChakraButtonGroup isAttached variant="outline" className={className}>
            {children}
        </ChakraButtonGroup>
    );
};