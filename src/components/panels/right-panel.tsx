'use client';

import { DetailsPanel } from '@/components/panels/details/details-panel';
import { useFileManager } from '@/store/file-manager.store';
import { AnimatePresence, motion } from 'motion/react';

export function RightPanel() {
	const { selectedItems } = useFileManager();

	return (
		<div className="flex flex-col h-full">
			<AnimatePresence mode="wait">
				{selectedItems.length > 0 ? (
					<DetailsPanel selectedItems={selectedItems} />
				) : (
					<motion.div
						key="info"
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="flex-1"
						transition={{ type: 'spring', damping: 25, stiffness: 200 }}
					>
						<div className="flex-1 w-full h-full relative"></div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
