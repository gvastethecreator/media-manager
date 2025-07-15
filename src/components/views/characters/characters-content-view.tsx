import { Users } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback } from 'react';

import { CharacterCard } from '@/components/cards/character-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { Character } from '@/types/entities/character';

interface CharactersContentViewProps {
	characters: Character[];
	isLoading: boolean;
	error: Error | null;
	localSearch: string;
	showForm: boolean;
	newCharacterName: string;
	newCharacterDescription: string;
	selectedCharacterId: string | null;
	setShowForm: (show: boolean) => void;
	setNewCharacterName: (name: string) => void;
	setNewCharacterDescription: (description: string) => void;
	handleCharacterSelect: (characterId: string) => void;
	handleCreateCharacter: () => void;
	handleRetry: () => void;
	className?: string;
}

const CharactersContentView: React.FC<CharactersContentViewProps> = ({
	characters,
	isLoading,
	error,
	localSearch,
	showForm,
	newCharacterName,
	newCharacterDescription,
	selectedCharacterId,
	setShowForm,
	setNewCharacterName,
	setNewCharacterDescription,
	handleCharacterSelect,
	handleCreateCharacter,
	handleRetry,
	className,
}) => {
	if (isLoading) {
		return <LoadingScreen message="Cargando personajes..." />;
	}

	if (error) {
		return (
			<EmptyState
				icon={Users}
				title="Error al cargar personajes"
				description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
				action={{
					label: 'Reintentar',
					onClick: handleRetry,
				}}
			/>
		);
	}

	return (
		<ScrollArea className={className || "flex-1"}>
			<div className="p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Personajes</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Crear Personaje'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Personaje</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="characterName">Nombre</Label>
							<Input
								id="characterName"
								value={newCharacterName}
								onChange={(e) => setNewCharacterName(e.target.value)}
								placeholder="Nombre del personaje"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="characterDescription">Descripción</Label>
							<Textarea
								id="characterDescription"
								value={newCharacterDescription}
								onChange={(e) => setNewCharacterDescription(e.target.value)}
								placeholder="Descripción del personaje (opcional)"
							/>
						</div>
						<Button onClick={handleCreateCharacter}>Guardar Personaje</Button>
					</div>
				)}

				{!characters.length && !isLoading && !showForm ? (
					<EmptyState
						icon={Users}
						title="Sin personajes"
						description={
							localSearch
								? `No se encontraron personajes que coincidan con "${localSearch}"`
								: 'No hay personajes disponibles'
						}
					/>
				) : (
					<motion.div
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						{characters.map((character, index) => (
							<motion.div
								key={character.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								<CharacterCard
									character={character}
									isSelected={character.id === selectedCharacterId}
									onSelect={() => handleCharacterSelect(character.id)}
								/>
							</motion.div>
						))}
					</motion.div>
				)}
			</div>
		</ScrollArea>
	);
};

export default CharactersContentView;
