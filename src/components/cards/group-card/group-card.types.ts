import type { GroupWithStats } from '@/types/entities/group';

export interface GroupCardProps {
	/** Objeto group con estadísticas completas */
	group: GroupWithStats;
	/** Función a ejecutar al hacer clic en la tarjeta */
	onClick?: () => void;
	/** Clase CSS adicional para la carta */
	className?: string;
	/** Modo TCG con efectos especiales de carta */
	tcgMode?: boolean;
	/** Tamaño compacto con menos información */
	compact?: boolean;
	/** Deshabilitar interacciones */
	disabled?: boolean;
	/** Si la tarjeta está seleccionada */
	isSelected?: boolean;
}
