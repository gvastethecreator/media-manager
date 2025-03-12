'use client';

import { CharacterForm } from '@/components/features/entity-cards/forms/character-form';
import {
	type CharacterFormData,
	characterToFormData,
	formDataToCharacter,
} from '@/components/features/entity-cards/forms/entity-types';
import { CharacterCard } from '@/components/features/entity-cards/layouts/character-card-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, type StatsCardProps } from '@/components/ui/stats-card';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger/logger';
import { useCharactersStore } from '@/store/entities/characters.store';
import type { Character } from '@prisma/client';
import { Loader2, Users } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';

const characterLogger = logger.withContext('CharactersSection');

export function CharactersSection() {
	const { toast } = useToast();
	const { characters, isLoading, loadCharacters, createCharacter, updateCharacter, deleteCharacter } =
		useCharactersStore();

	// Cargar personajes al montar el componente
	React.useEffect(() => {
		loadCharacters();
	}, [loadCharacters]);

	// Calcular estadísticas
	const stats = React.useMemo(() => {
		if (!characters.length) {
			return {
				totalItems: 0,
				totalImages: 0,
				totalSize: 0,
			};
		}

		const lastUpdated = characters.reduce((latest, char) => {
			if (!latest || char.updatedAt > latest) {
				return char.updatedAt;
			}
			return latest;
		}, characters[0].updatedAt);

		return {
			totalItems: characters.length,
			totalImages: characters.reduce((acc, char) => acc + (char._count?.images || 0), 0),
			totalSize: characters.reduce((acc, char) => acc + (char.totalSize || 0), 0),
			lastUpdated,
			recentItems: characters
				.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
				.slice(0, 5)
				.map((char) => ({
					id: char.id,
					name: char.name,
					emoji: char.emoji,
					color: char.color,
					count: char._count?.images || 0,
				})),
			distribution: characters.reduce(
				(acc, char) => {
					const className = char.class;
					const existing = acc.find((item) => item.name === className);
					if (existing) {
						existing.count++;
					} else {
						acc.push({ name: className, count: 1 });
					}
					return acc;
				},
				[] as Array<{ name: string; count: number }>
			),
		};
	}, [characters]);

	// Manejadores de eventos
	const handleCreate = async (data: CharacterFormData) => {
		try {
			characterLogger.info('📝 Creando personaje:', data);
			await createCharacter(formDataToCharacter(data));
			toast({
				title: '✅ Personaje creado',
				description: `Se ha creado el personaje "${data.name}" correctamente.`,
			});
		} catch (error) {
			characterLogger.error('❌ Error al crear personaje:', error);
			toast({
				title: '❌ Error',
				description: error instanceof Error ? error.message : 'Error al crear el personaje',
				variant: 'destructive',
			});
		}
	};

	const handleUpdate = async (character: Character) => {
		try {
			characterLogger.info('📝 Actualizando personaje:', character);
			await updateCharacter(character.id, character);
			toast({
				title: '✅ Personaje actualizado',
				description: `Se ha actualizado el personaje "${character.name}" correctamente.`,
			});
		} catch (error) {
			characterLogger.error('❌ Error al actualizar personaje:', error);
			toast({
				title: '❌ Error',
				description: error instanceof Error ? error.message : 'Error al actualizar el personaje',
				variant: 'destructive',
			});
		}
	};

	const handleDelete = async (id: string) => {
		try {
			characterLogger.info('🗑️ Eliminando personaje:', id);
			await deleteCharacter(id);
			toast({
				title: '✅ Personaje eliminado',
				description: 'Se ha eliminado el personaje correctamente.',
			});
		} catch (error) {
			characterLogger.error('❌ Error al eliminar personaje:', error);
			toast({
				title: '❌ Error',
				description: error instanceof Error ? error.message : 'Error al eliminar el personaje',
				variant: 'destructive',
			});
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-2 gap-4">
				<Card className="rounded-sm bg-muted/30">
					<CardHeader className="p-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<Users className="h-5 w-5" />
							Crear nuevo personaje
						</CardTitle>
					</CardHeader>
					<CardContent>
						<CharacterForm onSubmit={handleCreate} isLoading={isLoading} />
					</CardContent>
				</Card>

				<StatsCard
					title="Estadísticas"
					icon={<Users className="h-5 w-5" />}
					isLoading={isLoading}
					stats={stats as StatsCardProps['stats']}
				/>
			</div>

			<Card className="rounded-sm bg-muted/30">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Personajes
						</div>
						<Button variant="outline" size="sm" onClick={() => loadCharacters()} disabled={isLoading}>
							{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recargar'}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && characters.length === 0 ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : characters.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-8 text-center">
							<Users className="h-8 w-8 text-muted-foreground mb-4" />
							<p className="text-lg font-medium">No hay personajes</p>
							<p className="text-sm text-muted-foreground">Crea un nuevo personaje para empezar.</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{characters.map((character) => (
								<motion.div
									key={character.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3 }}
								>
									<CharacterCard data={character} onEdit={handleUpdate} onDelete={handleDelete} />
								</motion.div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
