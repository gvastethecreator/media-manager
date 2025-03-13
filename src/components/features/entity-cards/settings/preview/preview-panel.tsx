'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Eye, ZoomIn } from 'lucide-react';
import { motion } from 'motion/react';
import type { PreviewPanelProps } from '../../types/card-settings-types';
import { EntityPreviewAdapter } from './entity-preview-adapter';

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
	entityType = 'album',
}: PreviewPanelProps) {
	return (
		<Card className={cn('border border-border/40 shadow-sm overflow-hidden', previewColors.border)}>
			<CardHeader className={cn('p-2 pb-1.5 bg-muted/10', previewColors.bg)}>
				<CardTitle className="text-xs font-medium flex items-center gap-1.5 justify-center">
					<Eye className={cn('h-3.5 w-3.5', previewColors.text)} />
					Vista Previa
				</CardTitle>
			</CardHeader>
			<Separator />
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
