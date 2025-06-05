import type { ConceptComplete, ConceptExtended, ConceptWithStats, CreateConceptData } from './index';

// Interfaces para salidas/entradas de acciones del servidor
export interface ConceptActions {
	// Consulta
	getConcepts: () => Promise<ConceptWithStats[]>;
	getConcept: (id: string) => Promise<ConceptComplete>;
	getConceptWithRelations: (id: string) => Promise<ConceptExtended>;

	// Mutación
	createConcept: (data: CreateConceptData) => Promise<ConceptComplete>;
	updateConcept: (id: string, data: Partial<CreateConceptData>) => Promise<ConceptComplete>;
	deleteConcept: (id: string) => Promise<{ id: string }>;

	// Operaciones de relación
	addConceptImage: (conceptId: string, imageId: string) => Promise<ConceptComplete>;
	removeConceptImage: (conceptId: string, imageId: string) => Promise<ConceptComplete>;
}

// Tipo para inputs/outputs de formularios
export interface ConceptFormState {
	errors?: {
		name?: string[];
		description?: string[];
		tags?: string[];
		color?: string[];
		_form?: string[];
	};
	success?: boolean;
	message?: string;
	data?: ConceptComplete;
}

// Interfaces para los enlaces de la UI
export interface ConceptUILinks {
	detail: (id: string) => string;
	edit: (id: string) => string;
	new: () => string;
	list: () => string;
}
