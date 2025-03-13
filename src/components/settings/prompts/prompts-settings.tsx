'use client';

import { PromptForm } from '@/components/features/entity-cards/forms/prompt-form';
import { PromptCard } from '@/components/features/entity-cards/layouts/prompt-card-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { logger } from '@/lib/logger/logger';
import { toastService } from '@/lib/services/toast.service';
import { usePromptStore } from '@/store/entities/prompt.store';
import { Loader2, MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';

// Definición local del tipo PromptFormData para evitar problemas de incompatibilidad
interface PromptFormData {
	id?: string;
	name: string;
	emoji: string;
	color: string;
	description: string;
	content: string;
	category: string;
	parameters: Record<string, unknown>;
	tags: string[];
	featuredImage?: string | null;
	isFavorite: boolean;
}

const promptLogger = logger.withContext('PromptsSettings');

export function PromptsSettings() {
	const { prompts, isLoading, error, loadPrompts, createPrompt, updatePrompt, deletePrompt } = usePromptStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);

	React.useEffect(() => {
		loadPrompts();
	}, [loadPrompts]);

	const handleCreate = async (data: PromptFormData) => {
		try {
			promptLogger.info('✨ Creando nuevo prompt:', data);
			await createPrompt({
				name: data.name,
				emoji: data.emoji,
				color: data.color,
				description: data.description || null,
				content: data.content,
				category: data.category,
				parameters: JSON.stringify(data.parameters || {}),
				tags: Array.isArray(data.tags) ? data.tags.join(',') : '',
				featuredImage: data.featuredImage || null,
			});
			toastService.success('Prompt creado correctamente');
		} catch (error) {
			promptLogger.error('❌ Error al crear prompt:', error);
			toastService.error('No se pudo crear el prompt');
		}
	};

	const handleUpdate = async (data: PromptFormData) => {
		if (!editingId) {
			return;
		}
		try {
			promptLogger.info('💾 Actualizando prompt:', data);
			await updatePrompt(editingId, {
				id: editingId,
				name: data.name,
				emoji: data.emoji,
				color: data.color,
				description: data.description || null,
				content: data.content,
				category: data.category,
				parameters: JSON.stringify(data.parameters || {}),
				tags: Array.isArray(data.tags) ? data.tags.join(',') : '',
				featuredImage: data.featuredImage || null,
			});
			setEditingId(null);
			toastService.success('Prompt actualizado correctamente');
		} catch (error) {
			promptLogger.error('❌ Error al actualizar prompt:', error);
			toastService.error('No se pudo actualizar el prompt');
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('¿Estás seguro de eliminar este prompt?')) {
			return;
		}
		try {
			promptLogger.info('🗑️ Eliminando prompt:', { id });
			await deletePrompt(id);
			toastService.success('Prompt eliminado correctamente');
		} catch (error) {
			promptLogger.error('❌ Error al eliminar prompt:', error);
			toastService.error('No se pudo eliminar el prompt');
		}
	};

	// Calcular estadísticas
	const stats = React.useMemo(() => {
		// Versión simplificada de estadísticas para evitar problemas de tipo
		if (!prompts.length) {
			return {
				totalItems: 0,
				totalImages: 0,
				totalSize: 0,
				distribution: [],
				recentItems: [],
				lastUpdated: undefined,
				// Base stats
				total: 0,
				active: 0,
				favorite: 0,
				archived: 0,
			};
		}

		const totalImages = prompts.reduce((acc, prompt) => {
			// Suma todas las referencias a otras entidades
			const count = prompt._count
				? prompt._count.concepts + prompt._count.notes + prompt._count.characters + prompt._count.places
				: 0;
			return acc + count;
		}, 0);

		// Para totalSize, usar solo prompts con propiedad calculada
		const totalSize = prompts.reduce((acc, prompt) => {
			// Se asume que totalSize no es una propiedad estándar
			const promptWithSize = prompt as typeof prompt & { totalSize?: number };
			return acc + (promptWithSize.totalSize || 0);
		}, 0);

		// Obtener prompts recientes
		const recentPrompts = [...prompts]
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
			.slice(0, 5)
			.map((prompt) => ({
				id: prompt.id,
				name: prompt.name,
				emoji: prompt.emoji,
				count: 0, // Para mantener la compatibilidad
			}));

		return {
			totalItems: prompts.length,
			totalImages,
			totalSize,
			distribution: [],
			recentItems: recentPrompts,
			lastUpdated: new Date(),
			// Base stats
			total: prompts.length,
			active: prompts.length,
			favorite: prompts.filter((prompt) => prompt.isFavorite).length,
			archived: 0,
		};
	}, [prompts]);

	return (
		<div className="space-y-1">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card className="rounded-sm bg-muted/30 border-none">
					<CardHeader className="p-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<MessageSquare className="h-5 w-5" />
							Crear nuevo prompt
						</CardTitle>
					</CardHeader>
					<CardContent>
						<PromptForm
							onSubmit={(data) => {
								void handleCreate(data as unknown as PromptFormData);
							}}
							isLoading={isLoading}
						/>
					</CardContent>
				</Card>

				<StatsCard
					title="Estadísticas"
					icon={<MessageSquare className="h-5 w-5" />}
					isLoading={isLoading}
					stats={stats}
				/>
			</div>

			<Card className="rounded-sm bg-muted/30 border-none">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<MessageSquare className="h-5 w-5" />
							Prompts
						</div>
						<Button variant="outline" size="sm" onClick={() => loadPrompts()} disabled={isLoading}>
							{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recargar'}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && prompts.length === 0 ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<p className="text-sm text-muted-foreground text-center">
								{typeof error === 'string' ? error : (error as Error).message}
							</p>
							<Button variant="outline" size="sm" onClick={() => loadPrompts()}>
								Reintentar
							</Button>
						</div>
					) : prompts.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<MessageSquare className="h-8 w-8 text-muted-foreground" />
							<p className="text-sm text-muted-foreground text-center">No hay prompts creados</p>
							<p className="text-xs text-muted-foreground/75">Crea un prompt para empezar</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
							<AnimatePresence>
								{prompts.map((prompt) => (
									<motion.div
										key={prompt.id}
										layout
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{
											duration: 0.2,
											ease: 'easeInOut',
										}}
									>
										{editingId === prompt.id ? (
											<Card className="relative">
												<CardContent className="p-4">
													<PromptForm
														initialData={{
															name: prompt.name,
															description: prompt.description || '',
															emoji: prompt.emoji,
															color: prompt.color,
															content: prompt.content,
															category: prompt.category || '',
															parameters: prompt.parameters ? JSON.parse(prompt.parameters) : {},
															tags: prompt.tags ? prompt.tags.split(',').filter(Boolean) : [],
															featuredImage: prompt.featuredImage,
															isFavorite: prompt.isFavorite,
														}}
														onSubmit={(data) => {
															void handleUpdate({
																...data,
																id: prompt.id,
															} as unknown as PromptFormData);
														}}
														onCancel={() => setEditingId(null)}
														isLoading={isLoading}
													/>
												</CardContent>
											</Card>
										) : (
											<PromptCard
												data={{
													id: prompt.id,
													name: prompt.name,
													emoji: prompt.emoji,
													color: prompt.color,
													description: prompt.description || '',
													content: prompt.content || '',
													category: prompt.category || '',
													parameters: prompt.parameters || '{}',
													tags: prompt.tags || '',
													featuredImage: prompt.featuredImage || null,
													isFavorite: prompt.isFavorite || false,
													createdAt: new Date(prompt.createdAt),
													updatedAt: new Date(prompt.updatedAt),
												}}
												onEdit={() => setEditingId(prompt.id)}
												onDelete={handleDelete}
											/>
										)}
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
