/**
 * @file canvas.index.ts
 * @module components/file-browser/canvas
 * @description Barrel export para módulos de canvas
 */

// Hooks
export { useThumbnailPrefetch, useViewportObserver } from './canvas.hooks';
export type { CanvasRenderParams } from './canvas.renderer';
// Renderer
export { renderCanvas } from './canvas.renderer';
// Types
export type {
	ClickModifiers,
	FileCanvasProps,
	Point,
	TooltipState,
	Viewport,
	VisibleRange,
} from './canvas.types';
// Utils
export {
	calculateCellSize,
	calculateColumns,
	computeOffsetTop,
	getContentCoords,
	idsFromMarquee,
	indexFromCoords,
} from './canvas.utils';
