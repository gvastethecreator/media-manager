/**
 * Selection Overlay Component
 *
 * Provides visual feedback for drag selection with animated rectangle.
 * Shows the selection area during drag operations.
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { DragSelectionManager, DragSelectionState } from '@/services/drag-selection/drag-selection-manager';

interface SelectionRect {
	startX: number;
	startY: number;
	currentX: number;
	currentY: number;
}

// Legacy interface for backward compatibility
interface LegacySelectionOverlayProps {
	rect: SelectionRect;
	containerRef: React.RefObject<HTMLElement>;
	className?: string;
}

// New interface for drag selection manager
interface DragSelectionOverlayProps {
	dragSelectionManager: DragSelectionManager;
	showCount?: boolean;
	showCoordinates?: boolean;
	theme?: 'light' | 'dark' | 'auto';
	animation?: boolean | { enabled: boolean; duration: number; easing: string };
	className?: string;
}

type SelectionOverlayProps = LegacySelectionOverlayProps | DragSelectionOverlayProps;

// Type guard to check if props are for drag selection manager
function isDragSelectionProps(props: SelectionOverlayProps): props is DragSelectionOverlayProps {
	return 'dragSelectionManager' in props;
}

// Legacy component for backward compatibility
const LegacySelectionOverlay: React.FC<LegacySelectionOverlayProps> = ({
	rect,
	containerRef: _containerRef,
	className = '',
}) => {
	// Calculate normalized rectangle dimensions
	const left = Math.min(rect.startX, rect.currentX);
	const top = Math.min(rect.startY, rect.currentY);
	const width = Math.abs(rect.currentX - rect.startX);
	const height = Math.abs(rect.currentY - rect.startY);

	// Don't render if rectangle is too small
	if (width < 2 || height < 2) {
		return null;
	}

	return (
		<div
			className={cn(
				'pointer-events-none absolute z-50',
				'border-2 border-blue-500 border-dashed',
				'bg-blue-500/10 backdrop-blur-sm',
				'transition-all duration-75 ease-out',
				'animate-pulse',
				className
			)}
			style={{
				left: `${left}px`,
				top: `${top}px`,
				width: `${width}px`,
				height: `${height}px`,
				transform: 'translateZ(0)', // Force hardware acceleration
			}}
		>
			{/* Corner indicators */}
			<div className="-top-1 -left-1 absolute h-2 w-2 rounded-full bg-blue-500" />
			<div className="-top-1 -right-1 absolute h-2 w-2 rounded-full bg-blue-500" />
			<div className="-bottom-1 -left-1 absolute h-2 w-2 rounded-full bg-blue-500" />
			<div className="-bottom-1 -right-1 absolute h-2 w-2 rounded-full bg-blue-500" />

			{/* Selection info tooltip */}
			{width > 100 && height > 50 && (
				<div className="absolute top-2 left-2 rounded bg-blue-600 px-2 py-1 text-white text-xs shadow-lg">
					{Math.round(width)} × {Math.round(height)}
				</div>
			)}
		</div>
	);
};

// New drag selection overlay component
const DragSelectionOverlay: React.FC<DragSelectionOverlayProps> = ({
	dragSelectionManager,
	showCount = true,
	showCoordinates = false,
	theme = 'light',
	animation = true,
	className = '',
}) => {
	const [state, setState] = useState<DragSelectionState>(() => dragSelectionManager.getState());

	useEffect(() => {
		const interval = setInterval(() => {
			setState(dragSelectionManager.getState());
		}, 16);

		return () => clearInterval(interval);
	}, [dragSelectionManager]);

	// Don't render if not active or no selection rect
	if (!(state.isActive && state.selectionRect)) {
		return null;
	}

	const rect = state.selectionRect;
	const selectedCount = state.selectedElements.size;

	const animationEnabled = typeof animation === 'object' ? animation.enabled : animation;

	return (
		<div
			className={cn(
				'pointer-events-none absolute z-50',
				'border-2 border-blue-500',
				'bg-blue-500/10 backdrop-blur-sm',
				'transition-all duration-75 ease-out',
				animationEnabled && 'animate-pulse border-dashed',
				!animationEnabled && 'border-solid',
				theme === 'dark' && 'border-blue-400 bg-blue-400/10',
				theme === 'auto' && 'border-blue-500 bg-blue-500/10',
				className
			)}
			style={{
				left: `${rect.left}px`,
				top: `${rect.top}px`,
				width: `${rect.width}px`,
				height: `${rect.height}px`,
				transform: 'translateZ(0)',
			}}
		>
			{/* Corner indicators */}
			<div className="-top-1 -left-1 absolute h-2 w-2 rounded-full bg-blue-500" />
			<div className="-top-1 -right-1 absolute h-2 w-2 rounded-full bg-blue-500" />
			<div className="-bottom-1 -left-1 absolute h-2 w-2 rounded-full bg-blue-500" />
			<div className="-bottom-1 -right-1 absolute h-2 w-2 rounded-full bg-blue-500" />

			{/* Selection count */}
			{showCount && selectedCount > 0 && rect.width > 80 && rect.height > 40 && (
				<div className="absolute top-2 left-2 rounded-full border-2 border-white bg-blue-600 px-3 py-1.5 font-medium text-sm text-white shadow-lg">
					{selectedCount} selected
				</div>
			)}

			{/* Coordinates tooltip */}
			{showCoordinates && rect.width > 120 && rect.height > 60 && (
				<div className="absolute right-2 bottom-2 rounded bg-gray-800/80 px-2 py-1 font-mono text-white text-xs shadow-md backdrop-blur-sm">
					{Math.round(rect.width)} × {Math.round(rect.height)}
				</div>
			)}
		</div>
	);
};

// Main component that handles both interfaces
export const SelectionOverlay: React.FC<SelectionOverlayProps> = (props) => {
	if (isDragSelectionProps(props)) {
		return <DragSelectionOverlay {...props} />;
	}
	return <LegacySelectionOverlay {...props} />;
};

/**
 * Enhanced Selection Overlay with animation states
 */
interface EnhancedSelectionOverlayProps extends LegacySelectionOverlayProps {
	isActive?: boolean;
	selectedCount?: number;
	showCount?: boolean;
}

export const EnhancedSelectionOverlay: React.FC<EnhancedSelectionOverlayProps> = ({
	rect,
	containerRef: _containerRef,
	isActive = true,
	selectedCount = 0,
	showCount = true,
	className = '',
}) => {
	const left = Math.min(rect.startX, rect.currentX);
	const top = Math.min(rect.startY, rect.currentY);
	const width = Math.abs(rect.currentX - rect.startX);
	const height = Math.abs(rect.currentY - rect.startY);

	if (width < 2 || height < 2) {
		return null;
	}

	return (
		<div
			className={cn(
				'pointer-events-none absolute z-50',
				'transition-all duration-100 ease-out',
				isActive ? 'opacity-100' : 'opacity-0',
				className
			)}
			style={{
				left: `${left}px`,
				top: `${top}px`,
				width: `${width}px`,
				height: `${height}px`,
			}}
		>
			{/* Main selection rectangle */}
			<div
				className={cn(
					'absolute inset-0',
					'border-2 border-blue-500',
					'bg-blue-500/10 backdrop-blur-sm',
					'rounded-sm',
					isActive ? 'animate-pulse border-dashed' : 'border-solid'
				)}
			/>

			{/* Animated border effect */}
			<div className={cn('absolute inset-0', 'border-2 border-blue-400/50', 'rounded-sm', 'animate-ping')} />

			{/* Corner handles */}
			<div className="-top-1 -left-1 absolute h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-md" />
			<div className="-top-1 -right-1 absolute h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-md" />
			<div className="-bottom-1 -left-1 absolute h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-md" />
			<div className="-bottom-1 -right-1 absolute h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-md" />

			{/* Selection count badge */}
			{showCount && selectedCount > 0 && width > 80 && height > 40 && (
				<div
					className={cn(
						'absolute top-2 left-2',
						'px-3 py-1.5',
						'bg-blue-600 text-white',
						'font-medium text-sm',
						'rounded-full shadow-lg',
						'border-2 border-white',
						'slide-in-from-top-2 animate-in duration-200'
					)}
				>
					{selectedCount} selected
				</div>
			)}

			{/* Dimensions tooltip */}
			{width > 120 && height > 60 && (
				<div
					className={cn(
						'absolute right-2 bottom-2',
						'px-2 py-1',
						'bg-gray-800/80 text-white',
						'font-mono text-xs',
						'rounded shadow-md',
						'backdrop-blur-sm'
					)}
				>
					{Math.round(width)} × {Math.round(height)}
				</div>
			)}
		</div>
	);
};

export default SelectionOverlay;
