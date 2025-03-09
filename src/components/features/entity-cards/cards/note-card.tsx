'use client';

import type { NoteFormData } from '@/components/features/entity-cards/forms/entity-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/entities';
import { Pencil, StickyNote, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
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
	// Para componente preview, detectar cambios y animar
	const [animateUpdate, setAnimateUpdate] = useState(false);
	const prevDataRef = useRef<CardData | null>(null);

	// Verificar si alguna propiedad relevante ha cambiado
	useEffect(() => {
		if (!isPreview) {
			return;
		}

		if (!prevDataRef.current) {
			prevDataRef.current = { ...data };
			return;
		}

		const prevData = prevDataRef.current;
		const hasChanged =
			prevData.name !== data.name ||
			('title' in prevData && 'title' in data && prevData.title !== data.title) ||
			prevData.emoji !== data.emoji ||
			prevData.color !== data.color ||
			('priority' in prevData && 'priority' in data && prevData.priority !== data.priority) ||
			('status' in prevData && 'status' in data && prevData.status !== data.status) ||
			('category' in prevData && 'category' in data && prevData.category !== data.category) ||
			('content' in prevData && 'content' in data && prevData.content !== data.content);

		if (hasChanged) {
			setAnimateUpdate(true);
			const timer = setTimeout(() => setAnimateUpdate(false), 300);
			prevDataRef.current = { ...data };
			return () => clearTimeout(timer);
		}
	}, [data, isPreview]);

	// Función para obtener el color de badge según la prioridad
	const getPriorityColor = (priority: number) => {
		switch (priority) {
			case 0:
				return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
			case 1:
				return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
			case 2:
				return 'bg-red-500/10 text-red-500 border-red-500/20';
			default:
				return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
		}
	};

	// Mapa de prioridades a texto
	const priorityText: Record<number, string> = {
		0: 'Baja',
		1: 'Media',
		2: 'Alta',
	};

	// Renderizar versión para preview en diálogos
	if (isPreview) {
		return (
			<AnimatePresence mode="wait">
				<motion.div
					key={`${data.name}-${'title' in data ? data.title : ''}-${animateUpdate ? Date.now() : 'static'}`}
					className={cn(
						'group relative flex flex-col overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200 w-full h-full',
						animateUpdate ? 'ring-2 ring-primary' : 'hover:border-primary',
						className
					)}
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{
						opacity: 1,
						scale: 1,
						transition: { type: 'spring', stiffness: 500, damping: 30 },
					}}
					exit={{ opacity: 0, scale: 0.9 }}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<motion.div
								className="flex h-10 w-10 items-center justify-center rounded-full"
								style={{ backgroundColor: data.color || '#3b82f6' }}
								animate={{
									backgroundColor: data.color || '#3b82f6',
									transition: { duration: 0.5 },
								}}
							>
								<StickyNote className="h-5 w-5 text-white" />
							</motion.div>
							<div>
								<motion.h3
									className="text-xl font-semibold"
									animate={{
										opacity: [0.7, 1],
										y: [5, 0],
										transition: { duration: 0.3 },
									}}
								>
									{data.name || 'Sin nombre'}
								</motion.h3>
								{'title' in data && data.title && (
									<motion.p
										className="text-sm text-muted-foreground"
										animate={{
											opacity: [0, 1],
											transition: { duration: 0.3, delay: 0.1 },
										}}
									>
										{data.title}
									</motion.p>
								)}
							</div>
						</div>

						{'priority' in data && (
							<Badge variant="outline" className={cn('ml-auto', getPriorityColor(data.priority))}>
								{priorityText[data.priority] || 'Prioridad'}
							</Badge>
						)}
					</div>

					<div className="mt-4 flex-1">
						{'content' in data && data.content && (
							<motion.div
								className="text-sm line-clamp-3 text-muted-foreground"
								animate={{
									opacity: [0.5, 1],
									y: [10, 0],
									transition: { duration: 0.4 },
								}}
							>
								{data.content}
							</motion.div>
						)}
					</div>

					<div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center gap-2">
							{'status' in data && data.status && <Badge variant="outline">{data.status}</Badge>}
							{'category' in data && data.category && <span>{data.category}</span>}
						</div>
						<div className="flex items-center gap-1">
							<span className="inline-flex items-center rounded-full border px-2 py-0.5">{data.emoji || '📝'}</span>
						</div>
					</div>
				</motion.div>
			</AnimatePresence>
		);
	}

	// Renderizar versión normal
	return (
		<Card className={cn('relative rounded-sm bg-muted/30', className)}>
			<CardHeader className="p-3">
				<CardTitle className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2">
						<span
							className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white"
							style={{ backgroundColor: data.color || '#3b82f6' }}
						>
							{data.emoji || <StickyNote className="h-4 w-4" />}
						</span>
						{data.name}
					</div>
					<div className="flex items-center gap-2">
						{onEdit && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={(e) => {
									e.stopPropagation();
									onEdit(data as Note);
								}}
							>
								<Pencil className="h-4 w-4" />
								<span className="sr-only">Editar</span>
							</Button>
						)}
						{onDelete && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(data.id);
								}}
							>
								<Trash2 className="h-4 w-4" />
								<span className="sr-only">Eliminar</span>
							</Button>
						)}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 pt-0">
				{data.description && <p className="text-sm text-muted-foreground mb-2">{data.description}</p>}
				{'content' in data && data.content && <div className="text-sm whitespace-pre-wrap">{data.content}</div>}
				{'tags' in data && data.tags && data.tags.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-4">
						{data.tags.map((tag) => (
							<Badge key={tag} variant="secondary" className="text-xs">
								{tag}
							</Badge>
						))}
					</div>
				)}
				{'category' in data && data.category && (
					<div className="absolute top-3 right-3">
						<Badge variant="outline" className="text-xs">
							{data.category}
						</Badge>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
