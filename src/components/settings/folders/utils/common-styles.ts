/**
 * 🎨 ESTILOS COMUNES PARA COMPONENTES DE CARPETAS
 * Centraliza colores, tamaños y configuraciones recurrentes
 */

// ===== COLORES DE ESTADO =====
export const STATUS_COLORS = {
	indexed: {
		bg: 'bg-ui-success',
		border: 'border-ui-success-border',
		text: 'text-ui-success-text',
		ring: 'ring-ui-success-border',
	},
	outdated: {
		bg: 'bg-ui-warning',
		border: 'border-ui-warning-border',
		text: 'text-ui-warning-text',
		ring: 'ring-ui-warning-border',
	},
	pending: {
		bg: 'bg-muted/30',
		border: 'border-muted',
		text: 'text-muted-foreground',
		ring: 'ring-muted',
	},
	error: {
		bg: 'bg-destructive/10',
		border: 'border-destructive/30',
		text: 'text-destructive',
		ring: 'ring-destructive/30',
	},
	processing: {
		bg: 'bg-ui-info',
		border: 'border-ui-info-border',
		text: 'text-ui-info-text',
		ring: 'ring-ui-info-border',
	},
	complete: {
		bg: 'bg-ui-success',
		border: 'border-ui-success-border',
		text: 'text-ui-success-text',
		ring: 'ring-ui-success-border',
	},
} as const;

// ===== COLORES POR TIPO DE ARCHIVO =====
export const FILE_TYPE_COLORS = {
	images: 'bg-entity-image',
	videos: 'bg-entity-video',
	audio: 'bg-entity-audio',
	documents: 'bg-entity-document',
	others: 'bg-entity-file',
} as const;

// ===== TAMAÑOS DE COMPONENTES =====
export const COMPONENT_SIZES = {
	badge: {
		micro: 'h-3 px-1 text-[9px]',
		small: 'h-4 px-1 text-[10px]',
		normal: 'h-5 px-1.5 text-xs',
	},
	button: {
		icon: 'h-6 w-6',
		iconSmall: 'h-5 w-5',
	},
	icon: {
		micro: 'h-2 w-2',
		small: 'h-3 w-3',
		normal: 'h-3.5 w-3.5',
		medium: 'h-4 w-4',
	},
} as const;

// ===== ANIMACIONES COMUNES =====
export const ANIMATIONS = {
	fadeIn: {
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -20 },
		transition: { duration: 0.2 },
	},
	slideDown: {
		initial: { opacity: 0, height: 0 },
		animate: { opacity: 1, height: 'auto' },
		exit: { opacity: 0, height: 0 },
		transition: { duration: 0.2 },
	},
	pulse: {
		animate: { scale: [1, 1.05, 1] },
		transition: {
			duration: 2,
			repeat: Number.POSITIVE_INFINITY,
		},
	},
} as const;

// ===== UTILIDADES DE CLASE =====
export const COMMON_CLASSES = {
	cardBase: 'relative h-full cursor-pointer overflow-hidden border px-1 py-2 transition-all duration-200',
	cardGradient: 'border-border/60 bg-gradient-to-br from-card to-card/95',
	cardHover: 'hover:-translate-y-1 hover:shadow-dt-2 hover:shadow-primary/5',
	textTruncate: 'truncate font-semibold text-foreground text-md leading-tight',
	flexCenter: 'flex items-center justify-center',
	absoluteTopRight: 'absolute bottom-0 right-0',
} as const;
