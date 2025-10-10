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
        <motion.div className="-translate-x-1/2 fixed bottom-6 left-1/2 z-[9999] flex items-center justify-center" layout>
            <motion.div className="flex items-center rounded-lg bg-background/10 px-2 py-1 backdrop-blur-sm" layout>
                {visibleThumbnails.map(({ image, isActive, index }) => (
                    <ThumbnailItem image={image} isActive={isActive} key={image.id} onClick={() => onSelectImage(index)} />
                ))}
            </motion.div>
        </motion.div>
    );
});
