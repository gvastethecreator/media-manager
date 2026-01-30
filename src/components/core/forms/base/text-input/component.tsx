import React from 'react';
/**
 * @file Base TextInput component
 * @module components/core/forms/base/text-input
 * @description A foundational, unstyled text input component with proper type definitions.
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({ className, ...props }, ref) => {
	return (
		<input
			className={cn(
				'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			ref={ref}
			{...props}
		/>
	);
});

TextInput.displayName = 'TextInput';

export { TextInput };
