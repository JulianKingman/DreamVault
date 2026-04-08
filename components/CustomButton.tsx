import React from 'react';
import { Button, ButtonProps } from 'tamagui';

export const CustomButton = ({ children, ...props }: ButtonProps) => (
  <Button {...props}>
    {children}
  </Button>
);
