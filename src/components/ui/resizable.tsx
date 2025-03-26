'use client';

import { GripVerticalIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import * as React from 'react';
import { memo } from 'react';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';

interface ResizablePanelGroupProps extends React.ComponentProps<typeof ResizablePrimitive.PanelGroup> {
	onToggleCollapse?: (collapsed: boolean) => void;
}

const ResizablePanelGroup = memo(function ResizablePanelGroup({
	className,
	onToggleCollapse,
	...props
}: ResizablePanelGroupProps) {
	return (
		<ResizablePrimitive.PanelGroup
			data-slot="resizable-panel-group"
			className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
			{...props}
		/>
	);
});
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

interface ResizablePanelProps extends React.ComponentProps<typeof ResizablePrimitive.Panel> {
	isCollapsed?: boolean;
	onCollapse?: () => void;
	onExpand?: () => void;
	showToggleButton?: boolean;
	toggleButtonPosition?: 'start' | 'end';
	toggleButtonClassName?: string;
}

const ResizablePanel = memo(React.forwardRef<React.ElementRef<typeof ResizablePrimitive.Panel>, ResizablePanelProps>(
	(
		{
			className,
			isCollapsed,
			onCollapse,
			onExpand,
			showToggleButton,
			toggleButtonPosition = 'end',
			toggleButtonClassName,
			...props
		},
		ref
	) => {
		return (
			<ResizablePrimitive.Panel
				ref={ref}
				data-slot="resizable-panel"
				data-collapsed={isCollapsed ? 'true' : 'false'}
				className={cn('relative transition-all duration-300 ease-in-out', className)}
				onCollapse={onCollapse}
				onExpand={onExpand}
				{...props}
			>
				{showToggleButton && (
					<button
						type="button"
						onClick={() => {
							if (isCollapsed) {
								onExpand?.();
							} else {
								onCollapse?.();
							}
						}}
						className={cn(
							'absolute z-10 p-1.5 rounded-md bg-background border shadow-sm hover:bg-accent',
							toggleButtonPosition === 'start' ? 'left-3 top-3' : 'right-3 top-3',
							toggleButtonClassName
						)}
						aria-label={isCollapsed ? 'Expandir panel' : 'Colapsar panel'}
					>
						{isCollapsed ? <PanelLeftOpenIcon className="h-4 w-4" /> : <PanelLeftCloseIcon className="h-4 w-4" />}
					</button>
				)}
				{props.children}
			</ResizablePrimitive.Panel>
		);
	}
));
ResizablePanel.displayName = 'ResizablePanel';

const ResizableHandle = memo(function ResizableHandle({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
	withHandle?: boolean;
}) {
	return (
		<ResizablePrimitive.PanelResizeHandle
			data-slot="resizable-handle"
			className={cn(
				'bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
				className
			)}
			{...props}
		>
			{withHandle && (
				<div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
					<GripVerticalIcon className="size-2.5" />
				</div>
			)}
		</ResizablePrimitive.PanelResizeHandle>
	);
});
ResizableHandle.displayName = 'ResizableHandle';

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };

