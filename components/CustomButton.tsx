import React from 'react';
import { Button, ButtonProps } from 'tamagui';

interface CustomButtonProps extends ButtonProps {
  // icon?: IconProp;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  icon,
  children,
  ...props
}) => (
  <Button {...props}>
    {icon}
    {children}
  </Button>
);
