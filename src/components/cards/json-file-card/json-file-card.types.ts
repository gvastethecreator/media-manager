import type { JsonFileWithStats } from '@/types/entities/json-file';

export interface JsonFileCardProps {
	/** Objeto jsonFile con estadísticas completas */
	jsonFile: JsonFileWithStats;
	/** Función a ejecutar al hacer clic en la tarjeta */
	onClick?: () => void;
	/** Clase CSS adicional para la carta */
	className?: string;
	/** Tamaño compacto con menos información */
	compact?: boolean;
	/** Modo TCG con efectos especiales de carta */
	tcgMode?: boolean;
	/** Deshabilitar interacciones */
	disabled?: boolean;
	/** Si la tarjeta está seleccionada */
	isSelected?: boolean;
	/** Si la tarjeta está activa */
	isActive?: boolean;
	/** Si está en modo scroll (para optimización) */
	isScrolling?: boolean;
	/** Si debe cargar contenido */
	shouldLoad?: boolean;
}
