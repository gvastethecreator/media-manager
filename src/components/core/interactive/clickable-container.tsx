import React from 'react';
import { cn } from '@/lib/utils';

interface ClickableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
	onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
	children: React.ReactNode;
	className?: string;
}

export const ClickableContainer = React.forwardRef<HTMLDivElement, ClickableContainerProps>(
	({ onClick, onKeyDown, children, className, ...props }, ref) => {
		const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				onClick(event as unknown as React.MouseEvent<HTMLDivElement>);
			}
			if (onKeyDown) {
				onKeyDown(event);
			}
		};

		return (
			<div
				className={cn('focus:outline-none', className)}
				onClick={onClick}
				onKeyDown={handleKeyDown}
				ref={ref}
				role="button"
				tabIndex={0}
				{...props}
			>
				{children}
			</div>
		);
	}
);

ClickableContainer.displayName = 'ClickableContainer';
