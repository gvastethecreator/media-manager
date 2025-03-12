'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';
import type { Prompt } from '@prisma/client';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { PromptFormData } from '../forms/entity-types';

type CardData = Prompt | PromptFormData;

interface PromptCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	className?: string;
}

export function PromptCard({ data, isPreview = false, onEdit, onDelete, className }: PromptCardProps) {
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

	const toggleContent = () => setShowContent(!showContent);

	// Obtener categoría para el marco
	const categoryColor = {
		AI: 'border-purple-400 shadow-purple-300/20',
		imagen: 'border-blue-400 shadow-blue-300/20',
		desarrollo: 'border-emerald-400 shadow-emerald-300/20',
		general: 'border-amber-400 shadow-amber-300/20',
		default: 'border-slate-400 shadow-slate-300/20',
	}['category' in data && typeof data.category === 'string' ? data.category : 'default'];

	return (
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
				{/* Barra superior de tipo */}
				<div className="h-2 bg-indigo-500" />

				<CardHeader className="px-4 pt-3 pb-1 flex items-start">
					<div className="flex-1">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							<span className="bg-gradient-to-br from-indigo-700 to-indigo-900 bg-clip-text text-transparent">
								{'name' in data && data.name}
							</span>
						</CardTitle>

						<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
							{'category' in data && data.category && (
								<span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{data.category}</span>
							)}
							{'emoji' in data && data.emoji && (
								<span className="w-6 h-6 flex items-center justify-center">{data.emoji}</span>
							)}
						</div>
					</div>
					<MessageSquare className="h-6 w-6 text-indigo-600/70" />
				</CardHeader>

				<CardContent className="px-4 pt-2 pb-4">
					{/* Contenido */}
					{'content' in data && data.content && (
						<div
							className={cn(
								'p-3 bg-slate-50 rounded-md border border-slate-200 text-sm text-slate-600 font-mono',
								!showContent && 'line-clamp-3'
							)}
						>
							{data.content}
							{data.content.length > 150 && (
								<Button variant="link" className="p-0 h-auto text-xs text-indigo-600 mt-1" onClick={toggleContent}>
									{showContent ? 'Ver menos' : 'Ver más'}
								</Button>
							)}
						</div>
					)}

					{/* Parámetros */}
					{'parameters' in data && data.parameters && (
						<div className="mt-3 text-xs text-slate-500">
							<div className="font-semibold mb-1">Parámetros:</div>
							<pre className="p-2 bg-slate-50 rounded-sm border text-xs overflow-auto max-h-32">{data.parameters}</pre>
						</div>
					)}

					{/* Tags */}
					{'tags' in data && data.tags && Array.isArray(data.tags) && data.tags.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1">
							{data.tags.map((tag: string) => (
								<span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
									{tag}
								</span>
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
									onClick={() => {
										if ('id' in data && data.id) {
											onEdit(data.id);
										}
									}}
								>
									<Pencil className="h-4 w-4" />
								</Button>
							)}
							{onDelete && (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 bg-background/80 hover:bg-background hover:text-destructive"
									onClick={() => {
										if ('id' in data && data.id) {
											onDelete(data.id);
										}
									}}
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
	);
}
