import type { GroupWithStats } from '@/types/entities/group';

export interface GroupCardProps {
	/** ID del grupo a mostrar */
	groupId: string;
	/** Función a ejecutar al hacer clic en la tarjeta */
	onClick?: (group: GroupWithStats) => void;
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
