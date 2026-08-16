import { Users } from 'lucide-react';
import React from 'react';
import { CharacterCard } from '@/components/cards/character-card/character-card';
import { adaptCharacterWithStats } from '@/components/cards/character-card/character-card-adapter';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { CharacterWithStats } from '@/types/entities/character';

interface CharactersContentViewProps {
	characters: CharacterWithStats[];
	className?: string;
	error: Error | null;
	handleCharacterSelect: (characterId: string) => void;
	handleCreateCharacter: () => void;
	handleRetry: () => void;
	isLoading: boolean;
	localSearch: string;
	newCharacterDescription: string;
	newCharacterName: string;
	selectedCharacterId: string | null;
	setNewCharacterDescription: (description: string) => void;
	setNewCharacterName: (name: string) => void;
	setShowForm: (show: boolean) => void;
	showForm: boolean;
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
		return <LoadingScreen message="Loading characters..." />;
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<EmptyState
					description={error instanceof Error ? error.message : 'An unexpected error occurred'}
					icon={Users}
					title="Could not load characters"
				/>
				<Button className="mt-4" onClick={handleRetry}>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<ScrollArea className={className || 'flex-1'}>
			<div className="p-6">
				<h2 className="mb-4 font-bold text-xl">Characters</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancel' : 'Create Character'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">New Character</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="characterName">Name</Label>
							<Input
								id="characterName"
								onChange={(e) => setNewCharacterName(e.target.value)}
								placeholder="Character name"
								value={newCharacterName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="characterDescription">Description</Label>
							<Textarea
								id="characterDescription"
								onChange={(e) => setNewCharacterDescription(e.target.value)}
								placeholder="Character description (optional)"
								value={newCharacterDescription}
							/>
						</div>
						<Button onClick={handleCreateCharacter}>Save Character</Button>
					</div>
				)}

				{characters.length || isLoading || showForm ? (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
						initial={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.3 }}
					>
						{characters.map((character, index) => (
							<motion.article
								animate={{ opacity: 1, y: 0 }}
								data-character-id={character.id}
								initial={{ opacity: 0, y: 20 }}
								key={character.id}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								{/*
									Compat E2E/a11y: los tests buscan <article> con el nombre.
									CharacterCard puede renderizar un placeholder mientras carga;
									este texto asegura que el nombre esté presente inmediatamente.
								*/}
								<span className="sr-only">{character.name}</span>
								<CharacterCard
									character={adaptCharacterWithStats(character)}
									characterId={character.id}
									isSelected={character.id === selectedCharacterId}
									onSelect={() => handleCharacterSelect(character.id)}
								/>
							</motion.article>
						))}
					</motion.div>
				) : (
					<EmptyState
						description={
							localSearch
								? `No characters match "${localSearch}"`
								: 'No characters are available'
						}
						icon={Users}
						title="No characters yet"
					/>
				)}
			</div>
		</ScrollArea>
	);
};

export default CharactersContentView;
