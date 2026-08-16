import { Lightbulb } from 'lucide-react';
import React from 'react';
import { ConceptCard } from '@/components/cards/concept-card/concept-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { ConceptWithStats } from '@/types/entities/concept';

interface ConceptsContentViewProps {
	concepts: ConceptWithStats[];
	error: string | null;
	handleConceptSelect: (conceptId: string) => void;
	handleCreateConcept: () => Promise<void>;
	isLoading: boolean;
	newConceptDescription: string;
	newConceptName: string;
	searchTerm: string;
	setNewConceptDescription: (description: string) => void;
	setNewConceptName: (name: string) => void;
	setSearchTerm: (term: string) => void;
	setShowForm: (show: boolean) => void;
	showForm: boolean;
}

const ConceptsContentView: React.FC<ConceptsContentViewProps> = ({
	concepts,
	isLoading,
	error,
	showForm,
	newConceptName,
	newConceptDescription,
	searchTerm,
	setShowForm,
	setNewConceptName,
	setNewConceptDescription,
	setSearchTerm,
	handleConceptSelect,
	handleCreateConcept,
}) => {
	if (isLoading) {
		return <LoadingScreen message="Loading concepts..." />;
	}

	if (error) {
		return <EmptyState description={error} icon={Lightbulb} title="Could not load concepts" />;
	}

	// Filtrar conceptos por término de búsqueda
	const filteredConcepts = (concepts || []).filter(
		(concept) =>
			concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			concept.description?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-bold text-xl">Concepts</h2>
					<Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Create Concept'}</Button>
				</div>

				{/* Barra de búsqueda */}
				<div className="mb-4">
					<Input
						className="max-w-sm"
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search concepts..."
						value={searchTerm}
					/>
				</div>

				{/* Formulario de crear concepto */}
				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">New Concept</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="conceptName">Name</Label>
							<Input
								id="conceptName"
								onChange={(e) => setNewConceptName(e.target.value)}
								placeholder="Concept name"
								value={newConceptName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="conceptDescription">Description</Label>
							<Textarea
								id="conceptDescription"
								onChange={(e) => setNewConceptDescription(e.target.value)}
								placeholder="Concept description (optional)"
								value={newConceptDescription}
							/>
						</div>
						<Button onClick={handleCreateConcept}>Save Concept</Button>
					</div>
				)}

				{/* Lista de conceptos */}
				{filteredConcepts.length === 0 && !isLoading && !showForm ? (
					<EmptyState
						description={searchTerm ? `No concepts match "${searchTerm}"` : 'No concepts are available'}
						icon={Lightbulb}
						title="No concepts yet"
					/>
				) : (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
						initial={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.3 }}
					>
						{filteredConcepts.map((concept, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 20 }}
								key={concept.id}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								<ConceptCard concept={concept} onClick={() => handleConceptSelect(concept.id)} />
							</motion.div>
						))}
					</motion.div>
				)}
			</div>
		</ScrollArea>
	);
};

export default ConceptsContentView;
