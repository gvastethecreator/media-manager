import { memo, useMemo } from 'react';
import { motion } from '@/components/ui/animejs-shim';
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
	// Mostrar anteriores 5 y siguientes 5 (±5), sin duplicados, con wrap-around
	const visibleThumbnails = useMemo(() => {
		const out: { image: ImageItem; isActive: boolean; index: number }[] = [];
		const n = images.length;
		if (n === 0) return out;
		const maxEachSide = 5;
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
		<div className="fixed bottom-8 left-1/2 z-[10000] flex -translate-x-1/2 items-center justify-center">
			<motion.div
				className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/50 p-2 shadow-xl backdrop-blur-md"
				layout
			>
				{visibleThumbnails.map(({ image, isActive, index }) => (
					<ThumbnailItem image={image} isActive={isActive} key={image.id} onClick={() => onSelectImage(index)} />
				))}
			</motion.div>
		</div>
	);
});
