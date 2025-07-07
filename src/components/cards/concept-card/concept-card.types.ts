import type { Concept, ConceptStatistics } from '@/types/entities/concept';
import type { MouseEvent } from 'react';

export interface ConceptCardProps {
	conceptId: string;
	onClick?: (concept: Concept) => void;
	className?: string;
	style?: React.CSSProperties;
	tcgMode?: boolean;
}

export interface UseConceptData {
	data: Concept | undefined;
	isLoading: boolean;
	error: Error | null;
}

export interface UseConceptCountsData {
	data: ConceptStatistics | undefined;
}
