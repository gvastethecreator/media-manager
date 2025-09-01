import { StickyNote } from 'lucide-react';
import { motion } from '@/components/ui/motion-shim';
import React from 'react';

import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotesViewSimpleProps {
	className?: string;
}

const NotesViewSimple: React.FC<NotesViewSimpleProps> = ({ className }) => {
	const [isLoading] = React.useState(false);
	const [showForm] = React.useState(false);

	if (isLoading) {
		return <LoadingScreen message="Cargando notas..." />;
	}

	return (
		<ScrollArea className={className || 'flex-1'}>
			<div className="p-6">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="font-bold text-2xl">Vista de Notas</h2>
					<Button>
						<StickyNote className="mr-2 h-4 w-4" />
						Crear Nota
					</Button>
				</div>

				{!showForm && (
					<motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
						<EmptyState
							description="No hay notas disponibles en este momento. Crea tu primera nota para comenzar."
							icon={StickyNote}
							title="Sin notas"
						/>
					</motion.div>
				)}
			</div>
		</ScrollArea>
	);
};

export default NotesViewSimple;
