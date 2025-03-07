import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Concept } from '@/types/entities';
import { Lightbulb, Pencil, Trash2 } from 'lucide-react';
import * as React from 'react';

interface ConceptCardProps {
	concept: Concept;
	onEdit: () => void;
	onDelete: (id: string) => void;
}

export function ConceptCard({ concept, onEdit, onDelete }: ConceptCardProps) {
	return (
		<Card className="relative rounded-sm bg-muted/30">
			<CardHeader className="p-3">
				<CardTitle className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2">
						<Lightbulb className="h-5 w-5" />
						{concept.name}
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
							<Pencil className="h-4 w-4" />
							<span className="sr-only">Editar</span>
						</Button>
						<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(concept.id)}>
							<Trash2 className="h-4 w-4" />
							<span className="sr-only">Eliminar</span>
						</Button>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 pt-0">
				{concept.description && <p className="text-sm text-muted-foreground mb-2">{concept.description}</p>}
				<div className="text-sm whitespace-pre-wrap">{concept.content}</div>
				{concept.tags && concept.tags.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-4">
						{concept.tags.map((tag) => (
							<Badge key={tag} variant="secondary" className="text-xs">
								{tag}
							</Badge>
						))}
					</div>
				)}
				{concept.type && (
					<div className="absolute top-3 right-3">
						<Badge
							variant="outline"
							className={cn('text-xs', {
								'bg-blue-500/10 text-blue-500 border-blue-500/20': concept.type === 'default',
								'bg-green-500/10 text-green-500 border-green-500/20': concept.type === 'success',
								'bg-yellow-500/10 text-yellow-500 border-yellow-500/20': concept.type === 'warning',
								'bg-red-500/10 text-red-500 border-red-500/20': concept.type === 'error',
							})}
						>
							{concept.type}
						</Badge>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
