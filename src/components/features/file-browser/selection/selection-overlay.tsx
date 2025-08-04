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
	theme?: 'light' | 'dark';
	animation?: boolean;
	className?: string;
}

type SelectionOverlayProps = LegacySelectionOverlayProps | DragSelectionOverlayProps;

// Type guard to check if props are for drag selection manager
function isDragSelectionProps(props: SelectionOverlayProps): props is DragSelectionOverlayProps {
	return 'dragSelectionManager' in props;
}

// Legacy component for backward compatibility
const LegacySelectionOverlay: React.FC<LegacySelectionOverlayProps> = ({ rect, containerRef, className = '' }) => {
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
				'absolute pointer-events-none z-50',
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
			<div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
			<div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
			<div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
			<div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />

			{/* Selection info tooltip */}
			{width > 100 && height > 50 && (
				<div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded shadow-lg">
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
	if (!state.isActive || !state.selectionRect) {
		return null;
	}

	const rect = state.selectionRect;
	const selectedCount = state.selectedElements.size;

	return (
		<div
			className={cn(
				'absolute pointer-events-none z-50',
				'border-2 border-blue-500',
				'bg-blue-500/10 backdrop-blur-sm',
				'transition-all duration-75 ease-out',
				animation && 'border-dashed animate-pulse',
				!animation && 'border-solid',
				theme === 'dark' && 'border-blue-400 bg-blue-400/10',
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
			<div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
			<div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
			<div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
			<div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />

			{/* Selection count */}
			{showCount && selectedCount > 0 && rect.width > 80 && rect.height > 40 && (
				<div className="absolute top-2 left-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg border-2 border-white">
					{selectedCount} selected
				</div>
			)}

			{/* Coordinates tooltip */}
			{showCoordinates && rect.width > 120 && rect.height > 60 && (
				<div className="absolute bottom-2 right-2 px-2 py-1 bg-gray-800/80 text-white text-xs font-mono rounded shadow-md backdrop-blur-sm">
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
	containerRef,
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
				'absolute pointer-events-none z-50',
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
					isActive ? 'border-dashed animate-pulse' : 'border-solid'
				)}
			/>

			{/* Animated border effect */}
			<div className={cn('absolute inset-0', 'border-2 border-blue-400/50', 'rounded-sm', 'animate-ping')} />

			{/* Corner handles */}
			<div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-md" />
			<div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-md" />
			<div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-md" />
			<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-md" />

			{/* Selection count badge */}
			{showCount && selectedCount > 0 && width > 80 && height > 40 && (
				<div
					className={cn(
						'absolute top-2 left-2',
						'px-3 py-1.5',
						'bg-blue-600 text-white',
						'text-sm font-medium',
						'rounded-full shadow-lg',
						'border-2 border-white',
						'animate-in slide-in-from-top-2 duration-200'
					)}
				>
					{selectedCount} selected
				</div>
			)}

			{/* Dimensions tooltip */}
			{width > 120 && height > 60 && (
				<div
					className={cn(
						'absolute bottom-2 right-2',
						'px-2 py-1',
						'bg-gray-800/80 text-white',
						'text-xs font-mono',
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
