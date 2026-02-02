/**
 * @file Settings Modal
 * @description Modal para mostrar la configuración con overlay blur y dimensiones 90vw x 90vh
 */

import { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ModernSettingsView } from './modern/modern-settings-view';

interface SettingsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Modal de Settings con 90vw x 90vh y overlay blur
 */
export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			onOpenChange(newOpen);
		},
		[onOpenChange]
	);

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogPortal>
				{/* Overlay con blur más intenso */}
				<DialogOverlay className="data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 fixed inset-0 z-50 bg-background/70 backdrop-blur-md data-[state=closed]:animate-out data-[state=open]:animate-in" />

				{/* Content con 90vw x 90vh */}
				<DialogContent
					className={cn(
						'fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
						'h-[90vh] w-[90vw] max-w-none',
						'rounded-dt-lg border-2 border-border/50',
						'bg-background shadow-dt-4',
						'overflow-hidden',
						'data-[state=closed]:animate-out data-[state=open]:animate-in',
						'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
						'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
						'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
						'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]'
					)}
				>
					<DialogTitle className="sr-only">Configuración</DialogTitle>
					<div className="h-full w-full overflow-hidden">
						<ModernSettingsView />
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}

/**
 * Hook para manejar el estado del modal de settings
 */
export function useSettingsModal() {
	const [isOpen, setIsOpen] = useState(false);

	const open = useCallback(() => {
		setIsOpen(true);
	}, []);

	const close = useCallback(() => {
		setIsOpen(false);
	}, []);

	const toggle = useCallback(() => {
		setIsOpen((prev) => !prev);
	}, []);

	return {
		isOpen,
		open,
		close,
		toggle,
		setIsOpen,
	};
}
