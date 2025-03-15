'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function CollectionsSettings() {
	return (
		<Card className="rounded-sm bg-muted/30 border-none">
			<CardContent>
				<div className="flex flex-col items-center justify-center gap-2 p-8">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					<p className="text-sm text-muted-foreground text-center">Sección en construcción</p>
				</div>
			</CardContent>
		</Card>
	);
}
