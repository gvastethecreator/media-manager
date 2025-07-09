import { Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback } from 'react';
import { ConceptCard } from '@/components/cards/concept-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { Concept } from '@/types/entities/concept';

interface ConceptsContentViewProps {
	concepts: Concept[];
	isLoading: boolean;
	error: string | null;
	showForm: boolean;
	newConceptName: string;
	newConceptDescription: string;
	searchTerm: string;
	setShowForm: (show: boolean) => void;
	setNewConceptName: (name: string) => void;
	setNewConceptDescription: (description: string) => void;
	setSearchTerm: (term: string) => void;
	handleConceptSelect: (conceptId: string) => void;
	handleCreateConcept: () => Promise<void>;
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
		return <LoadingScreen message="Cargando conceptos..." />;
	}

	if (error) {
		return <EmptyState icon={Lightbulb} title="Error al cargar conceptos" description={error} />;
	}

	// Filtrar conceptos por término de búsqueda
	const filteredConcepts = concepts.filter(
		(concept) =>
			concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			concept.description?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">Vista de Conceptos</h2>
					<Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : 'Crear Concepto'}</Button>
				</div>

				{/* Barra de búsqueda */}
				<div className="mb-4">
					<Input
						placeholder="Buscar conceptos..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="max-w-sm"
					/>
				</div>

				{/* Formulario de crear concepto */}
				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Concepto</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="conceptName">Nombre</Label>
							<Input
								id="conceptName"
								value={newConceptName}
								onChange={(e) => setNewConceptName(e.target.value)}
								placeholder="Nombre del concepto"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="conceptDescription">Descripción</Label>
							<Textarea
								id="conceptDescription"
								value={newConceptDescription}
								onChange={(e) => setNewConceptDescription(e.target.value)}
								placeholder="Descripción del concepto (opcional)"
							/>
						</div>
						<Button onClick={handleCreateConcept}>Guardar Concepto</Button>
					</div>
				)}

				{/* Lista de conceptos */}
				{filteredConcepts.length === 0 && !isLoading && !showForm ? (
					<EmptyState
						icon={Lightbulb}
						title="Sin conceptos"
						description={
							searchTerm
								? `No se encontraron conceptos que coincidan con "${searchTerm}"`
								: 'No hay conceptos disponibles'
						}
					/>
				) : (
					<motion.div
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						{filteredConcepts.map((concept, index) => (
							<motion.div
								key={concept.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								<ConceptCard conceptId={concept.id} onClick={() => handleConceptSelect(concept.id)} />
							</motion.div>
						))}
					</motion.div>
				)}
			</div>
		</ScrollArea>
	);
};

export default ConceptsContentView;
