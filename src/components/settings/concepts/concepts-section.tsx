'use client';

import { ConceptForm } from '@/components/features/entity-cards/forms/concept-form';
import { ConceptCard } from '@/components/features/entity-cards/layouts/concept-card-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger/logger';
import { useConceptStore } from '@/store/entities/concept.store';
import { Lightbulb, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';

// Definición local del tipo ConceptFormData para evitar problemas de incompatibilidad
interface ConceptFormData {
	id?: string;
	name: string;
	emoji: string;
	color: string;
	description: string;
	content: string;
	category: string;
	tags: string[];
	featuredImage?: string | null;
	isFavorite: boolean;
}

const conceptLogger = logger.withContext('ConceptsSection');

export function ConceptsSection() {
	const { concepts, isLoading, error, loadConcepts, createConcept, updateConcept, deleteConcept } = useConceptStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const { toast } = useToast();

	React.useEffect(() => {
		loadConcepts();
	}, [loadConcepts]);

	const handleCreate = async (data: ConceptFormData) => {
		try {
			conceptLogger.info('✨ Creando nuevo concepto:', data);
			await createConcept({
				name: data.name,
				emoji: data.emoji,
				color: data.color,
				description: data.description || null,
				content: data.content,
				category: data.category,
				tags: Array.isArray(data.tags) ? data.tags.join(',') : '',
				featuredImage: data.featuredImage || null,
			});
			toast({
				title: 'Éxito',
				description: 'Concepto creado correctamente',
			});
		} catch (error) {
			conceptLogger.error('❌ Error al crear concepto:', error);
			toast({
				title: 'Error',
				description: 'No se pudo crear el concepto',
				variant: 'destructive',
			});
		}
	};

	const handleUpdate = async (data: ConceptFormData) => {
		if (!editingId) {
			return;
		}
		try {
			conceptLogger.info('💾 Actualizando concepto:', data);
			await updateConcept(editingId, {
				id: editingId,
				name: data.name,
				emoji: data.emoji,
				color: data.color,
				description: data.description || null,
				content: data.content,
				category: data.category,
				tags: Array.isArray(data.tags) ? data.tags.join(',') : '',
				featuredImage: data.featuredImage || null,
			});
			setEditingId(null);
			toast({
				title: 'Éxito',
				description: 'Concepto actualizado correctamente',
			});
		} catch (error) {
			conceptLogger.error('❌ Error al actualizar concepto:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar el concepto',
				variant: 'destructive',
			});
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('¿Estás seguro de eliminar este concepto?')) {
			return;
		}
		try {
			conceptLogger.info('🗑️ Eliminando concepto:', { id });
			await deleteConcept(id);
			toast({
				title: 'Éxito',
				description: 'Concepto eliminado correctamente',
			});
		} catch (error) {
			conceptLogger.error('❌ Error al eliminar concepto:', error);
			toast({
				title: 'Error',
				description: 'No se pudo eliminar el concepto',
				variant: 'destructive',
			});
		}
	};

	// Calcular estadísticas
	const stats = React.useMemo(() => {
		if (!concepts.length) {
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

		const totalImages = concepts.reduce((acc, concept) => {
			// Suma todas las referencias a otras entidades
			const count = concept._count
				? concept._count.prompts +
					concept._count.notes +
					concept._count.characters +
					concept._count.places +
					concept._count.worldItems
				: 0;
			return acc + count;
		}, 0);

		// Para totalSize, usar solo conceptos con propiedad calculada
		const totalSize = concepts.reduce((acc, concept) => {
			// Se asume que totalSize no es una propiedad estándar
			const conceptWithSize = concept as typeof concept & {
				totalSize?: number;
			};
			return acc + (conceptWithSize.totalSize || 0);
		}, 0);

		// Obtener conceptos recientes
		const recentConcepts = [...concepts]
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
			.slice(0, 5)
			.map((concept) => ({
				id: concept.id,
				name: concept.name,
				emoji: concept.emoji,
				count: 0, // Para mantener la compatibilidad
			}));

		return {
			totalItems: concepts.length,
			totalImages,
			totalSize,
			distribution: [],
			recentItems: recentConcepts,
			lastUpdated: new Date(),
			// Base stats
			total: concepts.length,
			active: concepts.length,
			favorite: concepts.filter((concept) => concept.isFavorite).length,
			archived: 0,
		};
	}, [concepts]);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card className="rounded-sm bg-muted/30">
					<CardHeader className="p-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<Lightbulb className="h-5 w-5" />
							Crear nuevo concepto
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ConceptForm
							onSubmit={async (data) => {
								await handleCreate(data as ConceptFormData);
							}}
							isLoading={isLoading}
						/>
					</CardContent>
				</Card>

				<StatsCard title="Estadísticas" icon={<Lightbulb className="h-5 w-5" />} isLoading={isLoading} stats={stats} />
			</div>

			<Card className="rounded-sm bg-muted/30">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<Lightbulb className="h-5 w-5" />
							Conceptos
						</div>
						<Button variant="outline" size="sm" onClick={() => loadConcepts()} disabled={isLoading}>
							{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recargar'}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && concepts.length === 0 ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<p className="text-sm text-muted-foreground text-center">{error}</p>
							<Button variant="outline" size="sm" onClick={() => loadConcepts()}>
								Reintentar
							</Button>
						</div>
					) : concepts.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<Lightbulb className="h-8 w-8 text-muted-foreground" />
							<p className="text-sm text-muted-foreground text-center">No hay conceptos creados</p>
							<p className="text-xs text-muted-foreground/75">Crea un concepto para empezar</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
							<AnimatePresence>
								{concepts.map((concept) => (
									<motion.div
										key={concept.id}
										layout
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{
											duration: 0.2,
											ease: 'easeInOut',
										}}
									>
										{editingId === concept.id ? (
											<Card className="relative">
												<CardContent className="p-4">
													<ConceptForm
														initialData={{
															name: concept.name,
															description: concept.description || '',
															emoji: concept.emoji,
															color: concept.color,
															content: concept.content,
															category: concept.category || '',
															tags: concept.tags ? concept.tags.split(',').filter(Boolean) : [],
															featuredImage: concept.featuredImage,
															isFavorite: concept.isFavorite,
														}}
														onSubmit={async (data) => {
															await handleUpdate(data as ConceptFormData);
														}}
														onCancel={() => setEditingId(null)}
														isLoading={isLoading}
													/>
												</CardContent>
											</Card>
										) : (
											<ConceptCard
												data={{
													id: concept.id,
													name: concept.name,
													description: concept.description || '',
													emoji: concept.emoji,
													color: concept.color,
													content: concept.content,
													category: concept.category || '',
													tags: concept.tags ? concept.tags.split(',').filter(Boolean) : [],
													featuredImage: concept.featuredImage,
													isFavorite: concept.isFavorite,
												}}
												onEdit={() => setEditingId(concept.id)}
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
