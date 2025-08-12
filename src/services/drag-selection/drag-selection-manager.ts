import type { SelectionState } from '@/store/selection.store';
import { useSelectionStore } from '@/store/selection.store';

export interface DragSelectionConfig {
	enabled: boolean;
	multiSelect?: boolean;
	threshold: number; // Minimum distance to start drag selection
	scrollSpeed?: number;
	scrollThreshold?: number;
	selectOnDrag?: boolean;
	clearOnStart?: boolean;
	visualFeedback?: boolean;
	autoScroll?: {
		enabled: boolean;
		speed: number;
		threshold: number;
		maxSpeed: number;
	};
	modifiers?: {
		add: string;
		subtract: string;
		toggle: string;
	};
	selectableClass?: string;
	selectedClass?: string;
	selectingClass?: string;
	containerClass?: string;
	keyModifiers?: {
		add: string[]; // Keys to add to selection (e.g., ['Control', 'Meta'])
		subtract: string[]; // Keys to subtract from selection (e.g., ['Alt'])
		toggle: string[]; // Keys to toggle selection (e.g., ['Shift'])
	};
}

export interface DragSelectionState {
	isActive: boolean;
	startPoint: { x: number; y: number } | null;
	currentPoint: { x: number; y: number } | null;
	selectionRect: DOMRect | null;
	selectedElements: Set<string>;
	mode: 'select' | 'add' | 'subtract' | 'toggle';
	scrolling: {
		x: number;
		y: number;
		active: boolean;
	};
}

export interface DragSelectionEvents {
	onSelectionStart?: (state: DragSelectionState) => void;
	onSelectionUpdate?: (state: DragSelectionState, selectedIds: string[]) => void;
	onSelectionEnd?: (state: DragSelectionState, selectedIds: string[]) => void;
	onSelectionCancel?: (state: DragSelectionState) => void;
	onScroll?: (direction: { x: number; y: number }) => void;
}

const defaultConfig: DragSelectionConfig = {
	enabled: true,
	multiSelect: true,
	threshold: 5,
	scrollSpeed: 10,
	scrollThreshold: 50,
	selectOnDrag: true,
	clearOnStart: true,
	visualFeedback: true,
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
	keyModifiers: {
		add: ['Control', 'Meta'],
		subtract: ['Alt'],
		toggle: ['Shift'],
	},
};

export class DragSelectionManager {
	private config: DragSelectionConfig;
	private state: DragSelectionState;
	private events: DragSelectionEvents;
	private container: HTMLElement | null = null;
	private selectableElements: Map<string, HTMLElement> = new Map();
	private animationFrame: number | null = null;
	private scrollInterval: NodeJS.Timeout | null = null;
	private getSelectionStore: () => SelectionState;

	constructor(config: Partial<DragSelectionConfig> = {}, events: DragSelectionEvents = {}) {
		this.config = { ...defaultConfig, ...config };
		this.events = events;
		this.getSelectionStore = () => useSelectionStore.getState() as SelectionState;

		this.state = {
			isActive: false,
			startPoint: null,
			currentPoint: null,
			selectionRect: null,
			selectedElements: new Set(),
			mode: 'select',
			scrolling: {
				x: 0,
				y: 0,
				active: false,
			},
		};

		this.bindEvents();
	}

	// Initialize the drag selection on a container
	initialize(container: HTMLElement): void {
		this.container = container;
		this.updateSelectableElements();
	}

	// Update the list of selectable elements
	updateSelectableElements(): void {
		if (!this.container) {
			return;
		}

		this.selectableElements.clear();

		// Find all selectable elements (elements with data-entity-id)
		const elements = this.container.querySelectorAll('[data-entity-id]');
		elements.forEach((element) => {
			const entityId = element.getAttribute('data-entity-id');
			if (entityId && element instanceof HTMLElement) {
				this.selectableElements.set(entityId, element);
			}
		});
	}

	// Event binding
	private bindEvents(): void {
		document.addEventListener('mousedown', this.handleMouseDown.bind(this));
		document.addEventListener('mousemove', this.handleMouseMove.bind(this));
		document.addEventListener('mouseup', this.handleMouseUp.bind(this));
		document.addEventListener('keydown', this.handleKeyDown.bind(this));
		document.addEventListener('keyup', this.handleKeyUp.bind(this));
		document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
	}

	private unbindEvents(): void {
		document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
		document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
		document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
		document.removeEventListener('keydown', this.handleKeyDown.bind(this));
		document.removeEventListener('keyup', this.handleKeyUp.bind(this));
		document.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
	}

	// Mouse event handlers
	private handleMouseDown(event: MouseEvent): void {
		if (!(this.config.enabled && this.container)) {
			return;
		}

		// Only handle left mouse button
		if (event.button !== 0) {
			return;
		}

		// Check if click is within container
		if (!this.container.contains(event.target as Node)) {
			return;
		}

		// Check if click is on a selectable element or empty space
		const target = event.target as HTMLElement;
		const isSelectableElement = target.closest('[data-entity-id]');
		const isEmptySpace = !isSelectableElement;

		// Don't start drag selection if clicking on UI controls
		if (target.closest('button, input, select, textarea, [role="button"]')) {
			return;
		}

		// Determine selection mode based on key modifiers
		this.updateSelectionMode(event);

		// If clicking on an element and not in add/subtract mode, handle single selection
		if (isSelectableElement && this.state.mode === 'select') {
			const entityId = isSelectableElement.getAttribute('data-entity-id');
			if (entityId) {
				// If element is already selected and we're not adding, don't start drag selection
				const isSelected = this.getSelectionStore().selectedIds.includes(entityId);
				if (isSelected && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
					return;
				}
			}
		}

		// Start drag selection
		this.startSelection(event);
	}

	private handleMouseMove(event: MouseEvent): void {
		if (!this.state.isActive) {
			return;
		}

		this.updateSelection(event);
		this.handleAutoScroll(event);
	}

	private handleMouseUp(event: MouseEvent): void {
		if (!this.state.isActive) {
			return;
		}

		this.endSelection(event);
	}

	private handleKeyDown(event: KeyboardEvent): void {
		// Cancel selection on Escape
		if (event.key === 'Escape' && this.state.isActive) {
			this.cancelSelection();
			return;
		}

		// Update selection mode if modifier keys change during selection
		if (this.state.isActive) {
			this.updateSelectionMode(event);
		}
	}

	private handleKeyUp(event: KeyboardEvent): void {
		// Update selection mode if modifier keys change during selection
		if (this.state.isActive) {
			this.updateSelectionMode(event);
		}
	}

	private handleContextMenu(_event: MouseEvent): void {
		// Cancel selection on right click
		if (this.state.isActive) {
			this.cancelSelection();
		}
	}

	// Selection logic
	private startSelection(event: MouseEvent): void {
		const rect = this.container?.getBoundingClientRect();

		this.state.isActive = true;
		this.state.startPoint = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
		this.state.currentPoint = { ...this.state.startPoint };
		this.state.selectedElements.clear();

		// Clear existing selection if in select mode and clearOnStart is enabled
		if (this.state.mode === 'select' && this.config.clearOnStart) {
			this.getSelectionStore().clearSelection();
		}

		// Prevent text selection
		event.preventDefault();

		// Add visual feedback class to container
		if (this.config.visualFeedback) {
			this.container?.classList.add('drag-selecting');
		}

		this.events.onSelectionStart?.(this.state);
	}

	private updateSelection(event: MouseEvent): void {
		if (!(this.state.startPoint && this.container)) {
			return;
		}

		const rect = this.container.getBoundingClientRect();
		this.state.currentPoint = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};

		// Check if we've moved enough to start actual selection
		const distance = Math.sqrt(
			(this.state.currentPoint.x - this.state.startPoint.x) ** 2 +
				(this.state.currentPoint.y - this.state.startPoint.y) ** 2
		);

		if (distance < this.config.threshold) {
			return;
		}

		// Calculate selection rectangle
		this.updateSelectionRect();

		// Find intersecting elements
		const intersectingIds = this.findIntersectingElements();

		// Update selection based on mode
		this.applySelection(intersectingIds);

		this.events.onSelectionUpdate?.(this.state, Array.from(this.state.selectedElements));
	}

	private endSelection(_event: MouseEvent): void {
		if (!this.state.isActive) {
			return;
		}

		// Apply final selection
		const selectedIds = Array.from(this.state.selectedElements);

		// Update the selection store
		const selectionStore = this.getSelectionStore();
		switch (this.state.mode) {
			case 'select':
				selectionStore.setSelection(selectedIds);
				break;
			case 'add':
				selectedIds.forEach((id: string) => selectionStore.addToSelection(id));
				break;
			case 'subtract':
				selectedIds.forEach((id: string) => selectionStore.removeFromSelection(id));
				break;
			case 'toggle':
				selectedIds.forEach((id: string) => selectionStore.toggleSelection(id));
				break;
		}

		this.events.onSelectionEnd?.(this.state, selectedIds);
		this.resetState();
	}

	private cancelSelection(): void {
		if (!this.state.isActive) {
			return;
		}

		this.events.onSelectionCancel?.(this.state);
		this.resetState();
	}

	private resetState(): void {
		this.state.isActive = false;
		this.state.startPoint = null;
		this.state.currentPoint = null;
		this.state.selectionRect = null;
		this.state.selectedElements.clear();
		this.state.mode = 'select';

		// Stop auto-scrolling
		this.stopAutoScroll();

		// Remove visual feedback
		if (this.container && this.config.visualFeedback) {
			this.container.classList.remove('drag-selecting');
		}

		// Cancel animation frame
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
	}

	// Helper methods
	private updateSelectionMode(event: MouseEvent | KeyboardEvent): void {
		const { keyModifiers } = this.config;

		if (keyModifiers?.subtract && this.isKeyPressed(event, keyModifiers.subtract)) {
			this.state.mode = 'subtract';
		} else if (keyModifiers?.add && this.isKeyPressed(event, keyModifiers.add)) {
			this.state.mode = 'add';
		} else if (keyModifiers?.toggle && this.isKeyPressed(event, keyModifiers.toggle)) {
			this.state.mode = 'toggle';
		} else {
			this.state.mode = 'select';
		}
	}

	private isKeyPressed(event: MouseEvent | KeyboardEvent, keys: string[]): boolean {
		return keys.some((key) => {
			switch (key) {
				case 'Control':
					return event.ctrlKey;
				case 'Meta':
					return event.metaKey;
				case 'Shift':
					return event.shiftKey;
				case 'Alt':
					return event.altKey;
				default:
					return false;
			}
		});
	}

	private updateSelectionRect(): void {
		if (!(this.state.startPoint && this.state.currentPoint)) {
			return;
		}

		const left = Math.min(this.state.startPoint.x, this.state.currentPoint.x);
		const top = Math.min(this.state.startPoint.y, this.state.currentPoint.y);
		const width = Math.abs(this.state.currentPoint.x - this.state.startPoint.x);
		const height = Math.abs(this.state.currentPoint.y - this.state.startPoint.y);

		this.state.selectionRect = new DOMRect(left, top, width, height);
	}

	private findIntersectingElements(): string[] {
		if (!(this.state.selectionRect && this.container)) {
			return [];
		}

		const containerRect = this.container.getBoundingClientRect();
		const intersectingIds: string[] = [];

		this.selectableElements.forEach((element, entityId) => {
			const elementRect = element.getBoundingClientRect();

			// Convert to container-relative coordinates
			const relativeRect = {
				left: elementRect.left - containerRect.left,
				top: elementRect.top - containerRect.top,
				right: elementRect.right - containerRect.left,
				bottom: elementRect.bottom - containerRect.top,
			};

			// Check intersection
			if (this.state.selectionRect && this.rectsIntersect(this.state.selectionRect, relativeRect)) {
				intersectingIds.push(entityId);
			}
		});

		return intersectingIds;
	}

	private rectsIntersect(rect1: DOMRect, rect2: { left: number; top: number; right: number; bottom: number }): boolean {
		return rect1.left < rect2.right && rect1.right > rect2.left && rect1.top < rect2.bottom && rect1.bottom > rect2.top;
	}

	private applySelection(intersectingIds: string[]): void {
		this.state.selectedElements.clear();

		switch (this.state.mode) {
			case 'select':
				intersectingIds.forEach((id) => this.state.selectedElements.add(id));
				break;
			case 'add':
				// Add current selection + intersecting elements
				this.getSelectionStore().selectedIds.forEach((id: string) => this.state.selectedElements.add(id));
				intersectingIds.forEach((id) => this.state.selectedElements.add(id));
				break;
			case 'subtract':
				// Current selection - intersecting elements
				this.getSelectionStore().selectedIds.forEach((id: string) => {
					if (!intersectingIds.includes(id)) {
						this.state.selectedElements.add(id);
					}
				});
				break;
			case 'toggle':
				// Start with current selection
				this.getSelectionStore().selectedIds.forEach((id: string) => this.state.selectedElements.add(id));
				// Toggle intersecting elements
				intersectingIds.forEach((id) => {
					if (this.state.selectedElements.has(id)) {
						this.state.selectedElements.delete(id);
					} else {
						this.state.selectedElements.add(id);
					}
				});
				break;
		}
	}

	// Auto-scroll functionality
	private handleAutoScroll(event: MouseEvent): void {
		if (!this.container) {
			return;
		}

		const containerRect = this.container.getBoundingClientRect();
		const scrollThreshold = this.config.scrollThreshold ?? 50;
		const scrollSpeed = this.config.scrollSpeed ?? 10;

		let scrollX = 0;
		let scrollY = 0;

		// Check horizontal scrolling
		if (event.clientX < containerRect.left + scrollThreshold) {
			scrollX = -scrollSpeed;
		} else if (event.clientX > containerRect.right - scrollThreshold) {
			scrollX = scrollSpeed;
		}

		// Check vertical scrolling
		if (event.clientY < containerRect.top + scrollThreshold) {
			scrollY = -scrollSpeed;
		} else if (event.clientY > containerRect.bottom - scrollThreshold) {
			scrollY = scrollSpeed;
		}

		if (scrollX !== 0 || scrollY !== 0) {
			this.startAutoScroll(scrollX, scrollY);
		} else {
			this.stopAutoScroll();
		}
	}

	private startAutoScroll(x: number, y: number): void {
		if (this.state.scrolling.active && this.state.scrolling.x === x && this.state.scrolling.y === y) {
			return; // Already scrolling in the same direction
		}

		this.stopAutoScroll();

		this.state.scrolling = { x, y, active: true };

		this.scrollInterval = setInterval(() => {
			if (this.container) {
				this.container.scrollBy(x, y);
				this.events.onScroll?.({ x, y });
			}
		}, 16); // ~60fps
	}

	private stopAutoScroll(): void {
		if (this.scrollInterval) {
			clearInterval(this.scrollInterval);
			this.scrollInterval = null;
		}

		this.state.scrolling = { x: 0, y: 0, active: false };
	}

	// Public API
	getState(): DragSelectionState {
		return { ...this.state };
	}

	getConfig(): DragSelectionConfig {
		return { ...this.config };
	}

	updateConfig(newConfig: Partial<DragSelectionConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	enable(): void {
		this.config.enabled = true;
	}

	disable(): void {
		this.config.enabled = false;
		if (this.state.isActive) {
			this.cancelSelection();
		}
	}

	isEnabled(): boolean {
		return this.config.enabled;
	}

	isActive(): boolean {
		return this.state.isActive;
	}

	// Get selection rectangle for rendering
	getSelectionRect(): DOMRect | null {
		return this.state.selectionRect;
	}

	// Cleanup
	destroy(): void {
		this.cancelSelection();
		this.unbindEvents();
		this.selectableElements.clear();
		this.container = null;
	}
}

// Default instance
export const dragSelectionManager = new DragSelectionManager();
