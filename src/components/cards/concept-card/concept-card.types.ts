import type { ConceptStatistics, ConceptStats, ConceptWithStats } from '@/types/entities/concept';

export interface ConceptCardProps {
	conceptId: string;
	onClick?: (concept: ConceptWithStats) => void;
	className?: string;
	style?: React.CSSProperties;
	tcgMode?: boolean;
}

export interface UseConceptData {
	data: ConceptWithStats | undefined;
	isLoading: boolean;
	error: Error | null;
}

export interface UseConceptCountsData {
	data: ConceptStats | undefined;
}
