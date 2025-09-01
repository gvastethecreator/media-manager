/**
 * 🎨 ESTILOS COMUNES PARA COMPONENTES DE CARPETAS
 * Centraliza colores, tamaños y configuraciones recurrentes
 */

// ===== COLORES DE ESTADO =====
export const STATUS_COLORS = {
	indexed: {
		bg: 'bg-green-50/30',
		border: 'border-green-200',
		text: 'text-green-600',
		ring: 'ring-green-200',
	},
	outdated: {
		bg: 'bg-amber-50/30',
		border: 'border-amber-200',
		text: 'text-amber-600',
		ring: 'ring-amber-200',
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
		bg: 'bg-blue-50',
		border: 'border-blue-200',
		text: 'text-blue-600',
		ring: 'ring-blue-200',
	},
	complete: {
		bg: 'bg-emerald-50',
		border: 'border-emerald-200',
		text: 'text-emerald-600',
		ring: 'ring-emerald-200',
	},
} as const;

// ===== COLORES POR TIPO DE ARCHIVO =====
export const FILE_TYPE_COLORS = {
	images: 'bg-blue-500',
	videos: 'bg-purple-500',
	audio: 'bg-green-500',
	documents: 'bg-orange-500',
	others: 'bg-gray-500',
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
	cardBase: 'relative h-full cursor-pointer overflow-hidden border-2 px-1 py-2 transition-all duration-200',
	cardGradient: 'border-border/60 bg-gradient-to-br from-card to-card/95',
	cardHover: 'hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5',
	textTruncate: 'truncate font-semibold text-foreground text-md leading-tight',
	flexCenter: 'flex items-center justify-center',
	absoluteTopRight: 'absolute bottom-0 right-0',
} as const;
