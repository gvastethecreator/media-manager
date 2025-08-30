import { useRef, useEffect, useState } from 'react';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { Single } from './single';
import { CanvasRenderConfig } from './canvas-config';

export interface FileCanvasSingleGroupedProps {
	groups: Array<{ key: string; items: MediaItem[]; displayName: string }>;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function FileCanvasSingleGrouped({ groups, onItemClick, onItemDoubleClick }: FileCanvasSingleGroupedProps) {
	const headerH = CanvasRenderConfig.group.headerHeight;
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);

	// Find scroll container más robustamente
	useEffect(() => {
		const findScrollContainer = () => {
			// Try multiple selectors
			const candidates = [
				'[data-testid="file-browser-scroll-area-viewport"]',
				'[data-testid="file-browser-scroll-area"]',
				'.file-browser-content',
				'.h-full.overflow-auto',
			];

			for (const selector of candidates) {
				const element = document.querySelector(selector) as HTMLElement;
				if (element) {
					setScrollContainer(element);
					return;
				}
			}

			// Fallback: find closest scrollable parent
			const current = containerRef.current;
			if (current) {
				let parent = current.parentElement;
				while (parent) {
					const style = window.getComputedStyle(parent);
					if (style.overflow === 'auto' || style.overflowY === 'auto') {
						setScrollContainer(parent);
						return;
					}
					parent = parent.parentElement;
				}
			}
		};

		// Try immediately and then with a small delay
		findScrollContainer();
		const timeout = setTimeout(findScrollContainer, 100);

		return () => clearTimeout(timeout);
	}, []);

	return (
		<div className="h-full overflow-auto" ref={containerRef}>
			<div className="flex flex-col gap-2">
				{groups.map((g) => (
					<div className="flex flex-col" key={g.key}>
						<div
							className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60"
							style={{ height: headerH }}
						>
							{g.displayName}
						</div>
						<div style={{ height: '300px' }}>
							<Single
								items={g.items}
								onItemClick={onItemClick}
								onItemDoubleClick={onItemDoubleClick}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
