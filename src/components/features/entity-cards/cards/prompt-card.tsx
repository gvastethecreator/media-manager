'use client';

import type { PromptFormData } from '@/components/features/entity-cards/forms/entity-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Prompt } from '@/types/entities';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

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

	// Para modo preview, animar cambios
	useEffect(() => {
		if (!isPreview) {
			return;
		}

		if (!prevDataRef.current) {
			prevDataRef.current = { ...data };
			return;
		}

		prevDataRef.current = { ...data };
	}, [data, isPreview]);

	// Renderizar versión para preview en diálogos
	if (isPreview) {
		return (
			<motion.div
				className={cn(
					'group relative flex flex-col overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200 hover:border-primary',
					isHovered ? 'shadow-md' : '',
					className
				)}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<div className="flex items-center space-x-2">
					<div
						className="flex h-8 w-8 items-center justify-center rounded-full"
						style={{
							backgroundColor: data.color ? `${data.color}33` : 'rgba(99, 102, 241, 0.2)',
						}}
					>
						<MessageSquare className="h-4 w-4" style={{ color: data.color || '#6366f1' }} />
					</div>
					<h3 className="text-xl font-semibold">{data.name || 'Sin nombre'}</h3>
				</div>

				{'prompt' in data && data.prompt && (
					<div className="mt-2 rounded bg-muted/50 p-2">
						<p className="text-xs text-muted-foreground line-clamp-4">{data.prompt}</p>
					</div>
				)}

				{'content' in data && data.content && (
					<div className="mt-2 rounded bg-muted/50 p-2">
						<p className="text-xs text-muted-foreground line-clamp-4">{data.content}</p>
					</div>
				)}

				<div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
					<div className="flex items-center space-x-2">
						{'model' in data && data.model && (
							<span className="bg-background px-2 py-1 rounded border">{data.model}</span>
						)}
						{'parameters' in data && data.parameters && (
							<span className="bg-background px-2 py-1 rounded border">Parámetros</span>
						)}
					</div>
					<span className="capitalize">{'category' in data ? data.category : 'general'}</span>
				</div>
			</motion.div>
		);
	}

	// Renderizar versión normal
	return (
		<Card className={cn('relative group', className)}>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2">
						<MessageSquare className="h-4 w-4" />
						<span className="truncate">{data.name}</span>
					</div>
					<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						{onEdit && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={(e) => {
									e.stopPropagation();
									onEdit(data.id);
								}}
							>
								<Pencil className="h-4 w-4" />
							</Button>
						)}
						{onDelete && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-destructive"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(data.id);
								}}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-2">
				{data.description && <div className="text-sm text-muted-foreground">{data.description}</div>}

				{'content' in data && data.content && (
					<div className="mt-2 text-sm">
						<pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-2 rounded-md">{data.content}</pre>
					</div>
				)}

				{'prompt' in data && data.prompt && (
					<div className="mt-2 text-sm">
						<pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-2 rounded-md">{data.prompt}</pre>
					</div>
				)}

				{'tags' in data && data.tags && data.tags.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-1">
						{data.tags.map((tag) => (
							<span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
								{tag}
							</span>
						))}
					</div>
				)}

				<div className="mt-2 flex items-center justify-between">
					<div className="text-xs text-muted-foreground">
						{'category' in data && data.category && <span>Categoría: {data.category}</span>}
					</div>
					<div className="text-xs text-muted-foreground">
						{'model' in data && data.model && <span>Modelo: {data.model}</span>}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
