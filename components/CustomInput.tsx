import React, { forwardRef } from 'react';
import { Input, InputProps, XStack, TextArea } from 'tamagui';

interface CustomInputProps extends InputProps {
  icon?: React.ReactNode;
  multiline?: boolean;
}

export const CustomInput = forwardRef<Input, CustomInputProps>(
  ({ icon, multiline, ...props }, ref) => {
    const InputComponent = multiline ? TextArea : Input;
    return (
      <XStack
        alignItems="center"
        width="100%"
        borderWidth={1}
        borderColor="$gray5"
        borderRadius="$4"
        padding="$2"
      >
        {icon}
        <InputComponent
          ref={ref as any}
          {...props}
          flex={1}
          borderWidth={0}
          height={multiline ? 150 : undefined}
        />
      </XStack>
    );
  },
);
