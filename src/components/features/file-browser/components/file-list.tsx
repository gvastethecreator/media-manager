import { useEffect, useState } from 'react';
import type { ImageWithStats } from '@/types/entities/image';
import { ListItem } from './list-item';

// CONFIG local de la vista List
const CONFIG = {
	rowPaddingY: 4,
	rowPaddingX: 8,
	increaseViewportBy: { top: 200, bottom: 600 } as { top: number; bottom: number },
};

interface FileListProps {
	items: ImageWithStats[];
	selectedIds?: string[];
	onItemClick?: (item: ImageWithStats) => void;
	onItemDoubleClick?: (item: ImageWithStats) => void;
}

export function FileList({ items, selectedIds = [], onItemClick, onItemDoubleClick }: FileListProps) {
	const [VirtuosoComp, setVirtuosoComp] = useState<any>(null);

	useEffect(() => {
		let mounted = true;
		import('react-virtuoso')
			.then((mod) => {
				if (!mounted) return;
				const Comp = (mod as any).Virtuoso || null;
				setVirtuosoComp(() => Comp);
			})
			.catch(() => {
				// fallback silencioso
			});
		return () => {
			mounted = false;
		};
	}, []);

	if (VirtuosoComp) {
		return (
			<div style={{ height: '100%' }}>
				<VirtuosoComp
					data={items}
					itemContent={(index: number, item: ImageWithStats) => (
						<div data-index={index} style={{ padding: `${CONFIG.rowPaddingY}px ${CONFIG.rowPaddingX}px` }}>
							<ListItem
								item={item}
								onClick={onItemClick}
								onDoubleClick={onItemDoubleClick}
								selected={selectedIds.includes(item.id)}
							/>
						</div>
					)}
					increaseViewportBy={CONFIG.increaseViewportBy}
					style={{ height: '100%' }}
					useWindowScroll={false}
				/>
			</div>
		);
	}

	// Fallback no virtualizado
	return (
		<div className="flex flex-col gap-1 p-2">
			{items.map((item) => (
				<ListItem
					item={item}
					key={item.id}
					onClick={onItemClick}
					onDoubleClick={onItemDoubleClick}
					selected={selectedIds.includes(item.id)}
				/>
			))}
		</div>
	);
}
