import * as React from 'react';
import { Button as ChakraButton, ChakraProvider, defaultSystem } from '@chakra-ui/react';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    variant = 'secondary',
    size = 'md',
    disabled = false,
    className = '',
}) => {
    const chakraVariant = variant === 'primary' ? 'solid' : variant === 'ghost' ? 'ghost' : 'outline';
    const colorPalette = variant === 'primary' ? 'blue' : 'gray';
    
    return (
        <ChakraButton
            onClick={onClick}
            variant={chakraVariant}
            colorPalette={colorPalette}
            size={size}
            disabled={disabled}
        >
            {children}
        </ChakraButton>
    );
};