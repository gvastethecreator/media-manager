import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/lib/contexts/theme-context';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toaster con Design Tokens v2
 * - Usa theme context propio en lugar de next-themes
 * - Estilos mejorados para consistencia visual
 * - Sombras y bordes con sistema dt
 * - Animaciones de entrada/salida suaves
 */
const Toaster = ({ ...props }: ToasterProps) => {
	const { resolvedTheme } = useTheme();
	// Mapear 'system' al tema resuelto
	const sonnerTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

	return (
		<Sonner
			className="toaster group"
			gap={12}
			position="bottom-right"
			theme={sonnerTheme}
			toastOptions={{
				duration: 4000,
				classNames: {
					toast: [
						'group toast',
						// Background con gradiente sutil
						'group-[.toaster]:bg-gradient-to-b group-[.toaster]:from-background group-[.toaster]:to-background/95',
						'group-[.toaster]:text-foreground',
						// Borde y sombra - Design Tokens v2
						'group-[.toaster]:border-2 group-[.toaster]:border-border/50',
						'group-[.toaster]:shadow-dt-3',
						'group-[.toaster]:rounded-dt-md',
						// Indicator lateral de color
						'group-[.toaster]:before:absolute group-[.toaster]:before:left-0 group-[.toaster]:before:top-0 group-[.toaster]:before:bottom-0',
						'group-[.toaster]:before:w-1 group-[.toaster]:before:rounded-l-dt-md',
					].join(' '),
					description: 'group-[.toast]:text-muted-foreground group-[.toast]:text-sm',
					actionButton: [
						'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
						'group-[.toast]:rounded-dt-sm group-[.toast]:shadow-dt-1',
						'group-[.toast]:font-medium',
					].join(' '),
					cancelButton: [
						'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
						'group-[.toast]:rounded-dt-sm',
					].join(' '),
					// Variantes por tipo
					success: 'group-[.toaster]:before:bg-emerald-500',
					error: 'group-[.toaster]:before:bg-destructive',
					warning: 'group-[.toaster]:before:bg-amber-500',
					info: 'group-[.toaster]:before:bg-blue-500',
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
