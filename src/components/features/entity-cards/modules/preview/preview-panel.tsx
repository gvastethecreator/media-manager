'use client';

import type { RarityConfig, TextureConfig } from '@/components/features/entity-cards/types/base-card-types';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ZoomIn } from 'lucide-react';
import { motion } from 'motion/react';
import { EntityPreviewAdapter } from './entity-preview-adapter';

// Definir el tipo PreviewPanelProps
interface PreviewPanelProps {
	cardOptions: CardOptions;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	showInfo?: boolean;
	entityType?:
		| 'card-album'
		| 'card-collection'
		| 'card-tag'
		| 'card-character'
		| 'card-world-item'
		| 'card-place'
		| 'card-concept'
		| 'card-prompt'
		| 'card-note'
		| 'card-folder';
}

// Esquema de colores para el panel de vista previa
const previewColors = {
	bg: 'bg-blue-500/5',
	border: 'border-blue-500/20',
	text: 'text-blue-600',
	highlight: 'bg-blue-500/10',
};

export function PreviewPanel({
	cardOptions,
	rarity,
	texture,
	showInfo = true,
	entityType = 'card-album',
}: PreviewPanelProps) {
	return (
		<Card className={cn('border border-border/40 shadow-sm overflow-hidden', previewColors.border)}>
			<CardContent className="p-2 flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.2 }}
					className="mx-auto relative group"
				>
					<EntityPreviewAdapter
						cardOptions={cardOptions}
						rarity={rarity}
						texture={texture}
						showInfo={showInfo}
						entityType={entityType}
					/>

					{/* Indicador de zoom en hover */}
					<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<div className={cn('rounded-full p-1', previewColors.highlight)}>
							<ZoomIn className={cn('h-3 w-3', previewColors.text)} />
						</div>
					</div>
				</motion.div>
			</CardContent>
		</Card>
	);
}
