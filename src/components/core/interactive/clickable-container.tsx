import React from 'react';
import { cn } from '@/lib/utils';

interface ClickableContainerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	className?: string;
}

export const ClickableContainer = React.forwardRef<HTMLButtonElement, ClickableContainerProps>(
	({ children, className, type = 'button', ...props }, ref) => {
		return (
			<button
				className={cn('focus:outline-none', className)}
				ref={ref}
				type={type}
				{...props}
			>
				{children}
			</button>
		);
	}
);

ClickableContainer.displayName = 'ClickableContainer';
