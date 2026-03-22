import { memo, useMemo } from 'react';
import { motion } from '@/components/ui/motion-shim';
import type { ImageItem } from './file-viewer.types';
import { ThumbnailItem } from './thumbnail-item';

export const ThumbnailNavigation = memo(function ThumbnailNavigationImpl({
	images,
	currentIndex,
	onSelectImage,
}: {
	images: ImageItem[];
	currentIndex: number;
	onSelectImage: (index: number) => void;
}) {
	// Mostrar anteriores 7 y siguientes 7 (±7), sin duplicados, con wrap-around
	const visibleThumbnails = useMemo(() => {
		const out: { image: ImageItem; isActive: boolean; index: number }[] = [];
		const n = images.length;
		if (n === 0) return out;
		const maxEachSide = 7;
		const seen = new Set<number>();
		for (let o = -maxEachSide; o <= maxEachSide; o++) {
			let idx = (currentIndex + o) % n;
			if (idx < 0) idx += n;
			if (seen.has(idx)) continue;
			seen.add(idx);
			out.push({ image: images[idx], isActive: idx === currentIndex, index: idx });
		}
		return out;
	}, [images, currentIndex]);

	return (
		<div className="fixed bottom-6 left-1/2 z-[10000] flex w-full max-w-4xl -translate-x-1/2 items-center justify-center px-4">
			<motion.div
				className="scrollbar-hide flex w-full items-center justify-center gap-2 overflow-x-auto rounded-full border border-border/40 bg-background/60 p-2 shadow-xl backdrop-blur-md"
				layout
			>
				{visibleThumbnails.map(({ image, isActive, index }) => (
					<ThumbnailItem image={image} isActive={isActive} key={image.id} onClick={() => onSelectImage(index)} />
				))}
			</motion.div>
		</div>
	);
});
