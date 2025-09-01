import { ImageIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { UploadedImageCard } from '@/components/cards/uploaded-image-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUploadedImages } from '@/lib/api/uploaded-images';
import { adaptUploadedImageResultToWithStats } from '@/transformers/uploaded-image';
import type { UploadedImageWithStats } from '@/types/entities/uploaded-image';

const UploadedImagesContentView = () => {
	const { data, isLoading, error } = useUploadedImages({ pageSize: 48, sortBy: 'createdAt', sortOrder: 'desc' });

	const items: UploadedImageWithStats[] = useMemo(() => {
		const list = data?.data ?? [];
		return list.map(adaptUploadedImageResultToWithStats);
	}, [data]);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error.message}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="mb-4 font-bold text-xl">Imágenes Subidas</h2>
				{items.length === 0 ? (
					<EmptyState description="Aún no has subido imágenes." icon={ImageIcon} title="Sin imágenes subidas" />
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
						{items.map((uploaded, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 10 }}
								key={uploaded.id}
								transition={{ delay: index * 0.02 }}
							>
								<UploadedImageCard uploadedImage={uploaded} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default memo(UploadedImagesContentView);
