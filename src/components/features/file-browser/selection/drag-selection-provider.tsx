import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { useSelectionStore } from '@/store/selection.store';
import type { AnyEntityWithStats } from '@/types/migration';
import {
	DragSelectionConfig,
	DragSelectionManager,
	DragSelectionState,
} from '../../../../services/drag-selection/drag-selection-manager';
import { SelectionOverlay } from './selection-overlay';

interface DragSelectionContextValue {
	dragSelectionManager: DragSelectionManager;
	isActive: boolean;
	selectedCount: number;
	config: DragSelectionConfig;
	updateConfig: (config: Partial<DragSelectionConfig>) => void;
	enable: () => void;
	disable: () => void;
	cancel: () => void;
}

const DragSelectionContext = createContext<DragSelectionContextValue | null>(null);
const dsLogger = clientLogger.withContext('DragSelectionProvider');

export const useDragSelection = (): DragSelectionContextValue => {
	const context = useContext(DragSelectionContext);
	if (!context) {
		throw new Error('useDragSelection must be used within a DragSelectionProvider');
	}
	return context;
};

interface DragSelectionProviderProps {
	children: ReactNode;
	containerRef: React.RefObject<HTMLElement>;
	items: AnyEntityWithStats[];
	getItemElement: (itemId: string) => HTMLElement | null;
	config?: Partial<DragSelectionConfig>;
	overlayConfig?: {
		showCount?: boolean;
		showCoordinates?: boolean;
		theme?: 'light' | 'dark' | 'auto';
		animation?: {
			enabled: boolean;
			duration: number;
			easing: string;
		};
	};
	onSelectionStart?: (state: DragSelectionState) => void;
	onSelectionUpdate?: (state: DragSelectionState, selectedIds: string[]) => void;
	onSelectionEnd?: (state: DragSelectionState, selectedIds: string[]) => void;
	onSelectionCancel?: () => void;
	disabled?: boolean;
}

const defaultConfig: DragSelectionConfig = {
	enabled: true,
	threshold: 5,
	autoScroll: {
		enabled: true,
		speed: 50,
		threshold: 50,
		maxSpeed: 200,
	},
	modifiers: {
		add: 'ctrl',
		subtract: 'alt',
		toggle: 'shift',
	},
	selectableClass: 'file-item',
	selectedClass: 'file-item--selected',
	selectingClass: 'file-item--selecting',
	containerClass: 'file-browser-container',
};

const defaultOverlayConfig = {
	showCount: true,
	showCoordinates: false,
	theme: 'auto' as const,
	animation: {
		enabled: true,
		duration: 150,
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
	},
};

export const DragSelectionProvider: React.FC<DragSelectionProviderProps> = ({
	children,
	containerRef,
	items,
	getItemElement: _getItemElement,
	config = {},
	overlayConfig = {},
	onSelectionStart: _onSelectionStart,
	onSelectionUpdate: _onSelectionUpdate,
	onSelectionEnd: _onSelectionEnd,
	onSelectionCancel,
	disabled = false,
}) => {
	const { selectedItems, selectItem, deselectItem, toggleSelection, clearSelection, selectAll } = useSelectionStore();

	// Helper functions for multiple item operations
	const selectItems = useCallback(
		(ids: string[]) => {
			for (const id of ids) {
				const item = items.find((it) => it.id === id);
				if (item) {
					selectItem(item as any);
				}
			}
		},
		[items, selectItem]
	);

	const deselectItems = useCallback(
		(ids: string[]) => {
			for (const id of ids) {
				deselectItem(id);
			}
		},
		[deselectItem]
	);

	const toggleItems = useCallback(
		(ids: string[]) => {
			for (const id of ids) {
				const item = items.find((it) => it.id === id);
				if (item) {
					toggleSelection(id, item as any);
				}
			}
		},
		[items, toggleSelection]
	);
	const [dragSelectionManager] = useState(() => new DragSelectionManager());
	const [isActive, setIsActive] = useState(false);
	const [selectedCount, setSelectedCount] = useState(0);
	const [currentConfig, setCurrentConfig] = useState<DragSelectionConfig>({
		...defaultConfig,
		...config,
	});
	const stateRef = useRef<DragSelectionState | null>(null);
	const intervalRef = useRef<number | null>(null);

	// Initialize the DragSelectionManager
	useEffect(() => {
		if (containerRef.current && dragSelectionManager) {
			try {
				dragSelectionManager.initialize(containerRef.current);
			} catch (error) {
				dsLogger.error('Error initializing DragSelectionManager:', error);
			}
		}

		return () => {
			try {
				dragSelectionManager?.destroy();
			} catch (error) {
				dsLogger.error('Error during DragSelectionManager cleanup:', error);
			}
		};
	}, [dragSelectionManager, containerRef]); // Reinit si cambia el contenedor o el manager
	useEffect(() => {
		const newConfig = {
			...defaultConfig,
			...config,
		};
		setCurrentConfig(newConfig);
		dragSelectionManager.updateConfig(newConfig);
	}, [config, dragSelectionManager]);

	// Handle disabled state
	useEffect(() => {
		if (disabled) {
			dragSelectionManager.disable();
			setIsActive(false);
		} else {
			dragSelectionManager.enable();
		}
	}, [disabled, dragSelectionManager]);

	const updateConfig = (newConfig: Partial<DragSelectionConfig>) => {
		const updatedConfig = {
			...currentConfig,
			...newConfig,
		};
		setCurrentConfig(updatedConfig);
		dragSelectionManager.updateConfig(updatedConfig);
	};

	const enable = () => {
		dragSelectionManager.enable();
	};

	const disable = () => {
		dragSelectionManager.disable();
		setIsActive(false);
	};

	const cancel = () => {
		// Use disable/enable to trigger cancelSelection internally
		const wasEnabled = dragSelectionManager.isEnabled();
		dragSelectionManager.disable();
		if (wasEnabled) {
			dragSelectionManager.enable();
		}
		setIsActive(false);
		onSelectionCancel?.();
	};

	const contextValue: DragSelectionContextValue = {
		dragSelectionManager,
		isActive,
		selectedCount,
		config: currentConfig,
		updateConfig,
		enable,
		disable,
		cancel,
	};

	const mergedOverlayConfig = {
		...defaultOverlayConfig,
		...overlayConfig,
	};

	return (
		<DragSelectionContext.Provider value={contextValue}>
			{children}
			{!disabled && (
				<SelectionOverlay
					// Se permite objeto de configuración; el componente debe aceptar boolean | config
					animation={mergedOverlayConfig.animation?.enabled ? mergedOverlayConfig.animation : false}
					dragSelectionManager={dragSelectionManager}
					showCoordinates={mergedOverlayConfig.showCoordinates}
					showCount={mergedOverlayConfig.showCount}
					theme={mergedOverlayConfig.theme}
				/>
			)}
		</DragSelectionContext.Provider>
	);
};

// Hook for accessing drag selection state
export const useDragSelectionState = () => {
	const { dragSelectionManager } = useDragSelection();
	const [state, setState] = useState<DragSelectionState>(() => dragSelectionManager.getState());

	// Extracted updater to reduce cognitive complexity of effect
	const updateState = useCallback(() => {
		setState(dragSelectionManager.getState());
	}, [dragSelectionManager]);

	useEffect(() => {
		const interval = setInterval(updateState, 16);
		return () => clearInterval(interval);
	}, [updateState]);

	return state;
};

// Hook for drag selection controls
export const useDragSelectionControls = () => {
	const { enable, disable, cancel, updateConfig } = useDragSelection();

	return {
		enable,
		disable,
		cancel,
		updateConfig,
	};
};

// Hook for drag selection events
export const useDragSelectionEvents = ({
	onStart,
	onUpdate,
	onEnd,
	onCancel,
}: {
	onStart?: (state: DragSelectionState) => void;
	onUpdate?: (state: DragSelectionState, selectedIds: string[]) => void;
	onEnd?: (state: DragSelectionState, selectedIds: string[]) => void;
	onCancel?: () => void;
} = {}) => {
	const { dragSelectionManager } = useDragSelection();
	const stateRef = useRef<DragSelectionState | null>(null);

	const handleStateChange = useCallback(
		(currentState: DragSelectionState, prevState: DragSelectionState | null) => {
			const becameActive = currentState.isActive && !prevState?.isActive;
			const stayingActive = currentState.isActive && Boolean(prevState?.isActive);
			const endedFromActive = !currentState.isActive && Boolean(prevState?.isActive);

			if (becameActive) {
				onStart?.(currentState);
				return;
			}

			if (stayingActive) {
				const selectedIds = Array.from(currentState.selectedElements);
				onUpdate?.(currentState, selectedIds);
				return;
			}

			if (endedFromActive) {
				const selectedIds = Array.from(currentState.selectedElements);
				if (selectedIds.length === 0 && prevState && prevState.selectedElements.size > 0) {
					onCancel?.();
				} else {
					onEnd?.(currentState, selectedIds);
				}
			}
		},
		[onStart, onUpdate, onEnd, onCancel]
	);

	useEffect(() => {
		const interval = setInterval(() => {
			const currentState = dragSelectionManager.getState();
			handleStateChange(currentState, stateRef.current);
			stateRef.current = currentState;
		}, 16);
		return () => clearInterval(interval);
	}, [dragSelectionManager, handleStateChange]);
};

// Utility hook for keyboard shortcuts
export const useDragSelectionKeyboard = () => {
	const { cancel } = useDragSelection();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				cancel();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [cancel]);
};
