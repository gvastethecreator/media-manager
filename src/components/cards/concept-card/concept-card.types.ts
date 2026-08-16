import type { ConceptWithStats } from '@/types/entities/concept';

export interface ConceptCardProps {
	/** Clase CSS adicional para la carta */
	className?: string;
	/** Objeto concept con estadísticas completas */
	concept: ConceptWithStats;
	/** Función a ejecutar al hacer clic en la tarjeta */
	onClick?: () => void;
	/** Estilos CSS personalizados */
	style?: React.CSSProperties;
	/** Modo TCG con efectos especiales de carta */
	tcgMode?: boolean;
}
