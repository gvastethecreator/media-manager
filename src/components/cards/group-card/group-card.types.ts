import type { GroupWithStats } from '@/types/entities/group';

export interface GroupCardProps {
	/** Clase CSS adicional para la carta */
	className?: string;
	/** Tamaño compacto con menos información */
	compact?: boolean;
	/** Deshabilitar interacciones */
	disabled?: boolean;
	/** Objeto group con estadísticas completas */
	group: GroupWithStats;
	/** Si la tarjeta está seleccionada */
	isSelected?: boolean;
	/** Función a ejecutar al hacer clic en la tarjeta */
	onClick?: () => void;
	/** Modo TCG con efectos especiales de carta */
	tcgMode?: boolean;
}
