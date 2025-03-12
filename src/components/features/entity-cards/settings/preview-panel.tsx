'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Box } from 'lucide-react';
import { motion } from 'motion/react';
import type { PreviewPanelProps } from './card-settings-types';
import { EntityPreviewAdapter } from './entity-preview-adapter';

export function PreviewPanel({
	cardOptions,
	rarity,
	texture,
	showInfo = true,
	entityType = 'album',
}: PreviewPanelProps) {
	return (
		<Card className="border border-border/40 shadow-sm overflow-hidden">
			<CardHeader className="p-3 pb-2 bg-muted/20">
				<CardTitle className="text-sm font-medium flex items-center gap-1.5 justify-center">
					<Box className="h-4 w-4 text-primary" />
					Vista Previa
				</CardTitle>
			</CardHeader>
			<Separator />
			<CardContent className="p-3 flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.2 }}
					className="mx-auto"
				>
					<EntityPreviewAdapter
						cardOptions={cardOptions}
						rarity={rarity}
						texture={texture}
						showInfo={showInfo}
						entityType={entityType}
					/>
				</motion.div>
			</CardContent>
		</Card>
	);
}
