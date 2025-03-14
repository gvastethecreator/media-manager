/**
 * @file Tipos para el módulo de estados de tarjetas de entidad
 * @description Define las interfaces y tipos para la gestión de estados interactivos
 */

/**
 * Configuración del estado hover de una tarjeta
 */
export interface HoverState {
	/** Factor de escala al pasar el cursor */
	scale?: number;

	/** Si la tarjeta debe rotar ligeramente al pasar el cursor */
	rotate?: boolean;

	/** Si la tarjeta debe elevarse ligeramente al pasar el cursor */
	lift?: boolean;

	/** Duración de la transición en ms */
	duration?: number;

	/** Función de timing para la transición */
	easing?: string;
}

/**
 * Configuración del estado focus de una tarjeta
 */
export interface FocusState {
	/** Factor de escala cuando la tarjeta tiene focus */
	scale?: number;

	/** Si la tarjeta debe rotar ligeramente cuando tiene focus */
	rotate?: boolean;

	/** Si la tarjeta debe elevarse ligeramente cuando tiene focus */
	lift?: boolean;

	/** Duración de la transición en ms */
	duration?: number;

	/** Función de timing para la transición */
	easing?: string;
}

/**
 * Configuración del estado active de una tarjeta
 */
export interface ActiveState {
	/** Factor de escala cuando la tarjeta está activa */
	scale?: number;

	/** Factor de brillo cuando la tarjeta está activa */
	brightness?: number;
}

/**
 * Configuración del estado disabled de una tarjeta
 */
export interface DisabledState {
	/** Opacidad cuando la tarjeta está deshabilitada */
	opacity?: number;

	/** Si aplicar filtro de escala de grises cuando la tarjeta está deshabilitada */
	grayscale?: boolean;
}

/**
 * Configuración del estado selected de una tarjeta
 */
export interface SelectedState {
	/** Factor de escala cuando la tarjeta está seleccionada */
	scale?: number;

	/** Si la tarjeta debe rotar ligeramente cuando está seleccionada */
	rotate?: boolean;

	/** Si la tarjeta debe elevarse ligeramente cuando está seleccionada */
	lift?: boolean;

	/** Factor de brillo cuando la tarjeta está seleccionada */
	brightness?: number;

	/** Estilo de borde cuando la tarjeta está seleccionada */
	border?: string;
}

/**
 * Sistema completo de estados para una tarjeta
 */
export interface StatesSystem {
	/** Configuración del estado hover */
	hover?: HoverState;

	/** Configuración del estado focus */
	focus?: FocusState;

	/** Configuración del estado active */
	active?: ActiveState;

	/** Configuración del estado disabled */
	disabled?: DisabledState;

	/** Configuración del estado selected */
	selected?: SelectedState;
}

/**
 * Props para el componente StatesModule
 */
export interface StatesModuleProps {
	/** Estado inicial del sistema de estados */
	initialStatesSystem?: StatesSystem;

	/** Callback invocado cuando cambia el sistema de estados */
	onChange?: (statesSystem: StatesSystem) => void;

	/** Si el módulo está deshabilitado */
	disabled?: boolean;

	/** Clases CSS adicionales */
	className?: string;
}
