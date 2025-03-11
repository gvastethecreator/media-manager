'use client';

import type { NoteFormData } from '@/components/features/entity-cards/entity-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';
import type { Note } from '@prisma/client';
import { Pencil, StickyNote, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';

type CardData = Note | NoteFormData;

interface NoteCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (note: Note) => void;
	onDelete?: (id: string) => void;
	className?: string;
}

export function NoteCard({ data, isPreview = false, onEdit, onDelete, className }: NoteCardProps) {
	// Para componente preview, detectar cambios
	const prevDataRef = useRef<CardData | null>(null);
	const [isHovered, setIsHovered] = useState(false);
	const [showContent, setShowContent] = useState(false);
	const [isHighlighted, setIsHighlighted] = useState(false);

	// Efecto para destacar cambios en modo preview
	useEffect(() => {
		if (isPreview && prevDataRef.current) {
			const hasChanged = JSON.stringify(prevDataRef.current) !== JSON.stringify(data);
			if (hasChanged) {
				setIsHighlighted(true);
				const timer = setTimeout(() => {
					setIsHighlighted(false);
				}, 2000);
				return () => clearTimeout(timer);
			}
		}
		prevDataRef.current = data;
	}, [data, isPreview]);

	// Handlers
	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && 'id' in data) {
			onEdit(data as Note);
		}
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && 'id' in data && data.id) {
			onDelete(data.id);
		}
	};

	const toggleContent = () => setShowContent(!showContent);

	// Utilidad para colores según prioridad
	const getPriorityColor = (priority: number) => {
		switch (priority) {
			case 1: // Baja
				return 'bg-blue-100 border-blue-300 text-blue-700';
			case 2: // Media
				return 'bg-amber-100 border-amber-300 text-amber-700';
			case 3: // Alta
				return 'bg-rose-100 border-rose-300 text-rose-700';
			default:
				return 'bg-gray-100 border-gray-300 text-gray-700';
		}
	};

	// Obtener categoría para el marco
	const categoryColor = {
		personal: 'border-purple-400 shadow-purple-300/20',
		trabajo: 'border-blue-400 shadow-blue-300/20',
		ideas: 'border-emerald-400 shadow-emerald-300/20',
		general: 'border-amber-400 shadow-amber-300/20',
		default: 'border-slate-400 shadow-slate-300/20',
	}['category' in data && typeof data.category === 'string' ? data.category : 'default'];

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0.6, y: 10 }}
				animate={{
					opacity: 1,
					y: 0,
					scale: isHighlighted ? 1.02 : 1,
					boxShadow: isHighlighted ? '0 0 12px rgba(249, 115, 22, 0.8)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
				}}
				exit={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.2 }}
				className={cn('relative w-full group', className)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<Card
					className={cn(
						'overflow-hidden transition-all duration-300',
						'border-2 rounded-lg',
						categoryColor,
						'hover:shadow-lg hover:transform hover:-translate-y-1',
						isHighlighted && 'ring-2 ring-orange-400'
					)}
				>
					{/* Barra superior de prioridad */}
					<div
						className={cn(
							'h-2',
							getPriorityColor('priority' in data ? data.priority : 0)
								.replace('bg-', '')
								.replace('border-', '')
								.replace('text-', '')
						)}
					/>

					<CardHeader className="px-4 pt-3 pb-0 flex items-start">
						<div className="flex-1">
							<CardTitle className="text-xl font-semibold flex items-center gap-2">
								<span className="bg-gradient-to-br from-slate-700 to-slate-900 bg-clip-text text-transparent">
									{'title' in data ? data.title : 'name' in data ? data.name : ''}
								</span>
							</CardTitle>

							<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
								{'status' in data && data.status && (
									<span className="px-2 py-0.5 bg-primary/10 rounded-full">{data.status}</span>
								)}
								{'priority' in data && data.priority !== undefined && (
									<span
										className={cn('px-2 py-0.5 rounded-full', {
											'bg-blue-100 text-blue-700': data.priority === 1,
											'bg-amber-100 text-amber-700': data.priority === 2,
											'bg-rose-100 text-rose-700': data.priority === 3,
										})}
									>
										{data.priority === 1 ? 'Baja' : data.priority === 2 ? 'Media' : 'Alta'}
									</span>
								)}
							</div>
						</div>
						<StickyNote className="h-6 w-6 text-primary/70" />
					</CardHeader>

					<CardContent className="px-4 pt-3 pb-4">
						{/* Contenido */}
						{'content' in data && data.content && (
							<div className={cn('mt-1 text-sm text-slate-600', !showContent && 'line-clamp-3')}>
								{data.content}
								{data.content.length > 150 && (
									<Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={toggleContent}>
										{showContent ? 'Ver menos' : 'Ver más'}
									</Button>
								)}
							</div>
						)}

						{/* Tags */}
						{'tags' in data && data.tags && Array.isArray(data.tags) && data.tags.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-4">
								{data.tags.map((tag: string) => (
									<Badge key={tag} variant="secondary" className="text-xs">
										{tag}
									</Badge>
								))}
							</div>
						)}

						{/* Controles */}
						{!isPreview && (
							<div
								className={cn(
									'absolute right-2 top-8 flex flex-col gap-2',
									!isHovered && 'opacity-0',
									'transition-opacity duration-200'
								)}
							>
								{onEdit && (
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 bg-background/80 hover:bg-background"
										onClick={(e) => handleEdit(e)}
									>
										<Pencil className="h-4 w-4" />
									</Button>
								)}
								{onDelete && (
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 bg-background/80 hover:bg-background hover:text-destructive"
										onClick={(e) => handleDelete(e)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						)}
					</CardContent>

					{/* Efecto inferior */}
					<div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background/20 to-transparent" />
				</Card>
			</motion.div>
		</AnimatePresence>
	);
}
