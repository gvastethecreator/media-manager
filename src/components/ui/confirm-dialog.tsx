/**
 * @file ConfirmDialog Component
 * @module components/ui/confirm-dialog
 * @description Dialog de confirmación moderno y accesible
 * Reemplaza el confirm() nativo del navegador
 * A11y: WCAG 3.3.4 - Error Prevention, WCAG 4.1.3 - Status Messages
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, Info, Trash2, X } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { FocusTrap } from './focus-trap';
import { cn } from '@/lib/utils';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogProps {
	/** Si está abierto */
	open: boolean;
	/** Callback al cerrar */
	onClose: () => void;
	/** Callback al confirmar */
	onConfirm: () => void;
	/** Título del dialog */
	title: string;
	/** Descripción detallada */
	description?: string;
	/** Texto del botón de confirmar */
	confirmText?: string;
	/** Texto del botón de cancelar */
	cancelText?: string;
	/** Variante visual */
	variant?: ConfirmVariant;
	/** Mostrar icono */
	showIcon?: boolean;
	/** Deshabilitar confirmar temporalmente (cooldown) */
	disableConfirmDuration?: number;
	/** Callback al cancelar (opcional, si no se proporciona usa onClose) */
	onCancel?: () => void;
}

const variantConfig = {
	danger: {
		icon: Trash2,
		iconColor: 'text-destructive',
		bgColor: 'bg-destructive/10',
		buttonVariant: 'destructive' as const,
		confirmDefault: 'Eliminar',
	},
	warning: {
		icon: AlertTriangle,
		iconColor: 'text-dt-warning-600',
		bgColor: 'bg-dt-warning-50',
		buttonVariant: 'default' as const,
		confirmDefault: 'Continuar',
	},
	info: {
		icon: Info,
		iconColor: 'text-dt-primary-600',
		bgColor: 'bg-dt-primary-50',
		buttonVariant: 'default' as const,
		confirmDefault: 'Aceptar',
	},
	success: {
		icon: CheckCircle2,
		iconColor: 'text-dt-success-600',
		bgColor: 'bg-dt-success-50',
		buttonVariant: 'default' as const,
		confirmDefault: 'Confirmar',
	},
};

/**
 * Dialog de confirmación accesible
 *
 * @example
 * <ConfirmDialog
 *   open={showDeleteDialog}
 *   onClose={() => setShowDeleteDialog(false)}
 *   onConfirm={handleDelete}
 *   title="Eliminar carpeta"
 *   description="Se eliminarán 5 archivos permanentemente."
 *   variant="danger"
 *   confirmText="Eliminar permanentemente"
 * />
 */
export function ConfirmDialog({
	open,
	onClose,
	onConfirm,
	title,
	description,
	confirmText,
	cancelText = 'Cancelar',
	variant = 'warning',
	showIcon = true,
	disableConfirmDuration = 0,
	onCancel,
}: ConfirmDialogProps) {
	const [isConfirmDisabled, setIsConfirmDisabled] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const config = variantConfig[variant];
	const Icon = config.icon;

	// Manejar cooldown de confirmación
	useEffect(() => {
		if (!open || disableConfirmDuration <= 0) return;

		setIsConfirmDisabled(true);
		setCountdown(disableConfirmDuration);

		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					setIsConfirmDisabled(false);
					clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [open, disableConfirmDuration]);

	const handleConfirm = () => {
		if (isConfirmDisabled) return;
		onConfirm();
	};

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		} else {
			onClose();
		}
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
			<DialogContent
				className="sm:max-w-md"
				aria-labelledby="confirm-dialog-title"
				aria-describedby={description ? 'confirm-dialog-description' : undefined}
			>
				<FocusTrap active={open} onEscape={handleCancel} initialFocus="last">
					<DialogHeader className="gap-4">
						<div className="flex items-start gap-4">
							{showIcon && (
								<div
									className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', config.bgColor)}
									aria-hidden="true"
								>
									<Icon className={cn('h-6 w-6', config.iconColor)} />
								</div>
							)}
							<div className="flex-1 space-y-2">
								<DialogTitle id="confirm-dialog-title" className="text-left">
									{title}
								</DialogTitle>
								{description && (
									<DialogDescription id="confirm-dialog-description" className="text-left">
										{description}
									</DialogDescription>
								)}
							</div>
						</div>
					</DialogHeader>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={handleCancel} data-autofocus={variant !== 'danger'}>
							{cancelText}
						</Button>
						<Button
							variant={config.buttonVariant}
							onClick={handleConfirm}
							disabled={isConfirmDisabled}
							data-autofocus={variant === 'danger'}
							className={cn('min-w-[120px]', isConfirmDisabled && 'opacity-70')}
						>
							{isConfirmDisabled && countdown > 0
								? `${confirmText || config.confirmDefault} (${countdown}s)`
								: confirmText || config.confirmDefault}
						</Button>
					</DialogFooter>
				</FocusTrap>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Hook para usar confirm dialogs de forma imperativa
 *
 * @example
 * const { confirm } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Eliminar?',
 *     description: 'Esta acción no se puede deshacer',
 *     variant: 'danger'
 *   });
 *
 *   if (confirmed) {
 *     deleteItem();
 *   }
 * };
 */
export function useConfirm() {
	const [state, setState] = useState<{
		isOpen: boolean;
		props: Omit<ConfirmDialogProps, 'open' | 'onClose' | 'onConfirm'> | null;
		resolve: ((value: boolean) => void) | null;
	}>({
		isOpen: false,
		props: null,
		resolve: null,
	});

	const confirm = (props: Omit<ConfirmDialogProps, 'open' | 'onClose' | 'onConfirm'>): Promise<boolean> => {
		return new Promise((resolve) => {
			setState({
				isOpen: true,
				props,
				resolve,
			});
		});
	};

	const handleClose = () => {
		if (state.resolve) {
			state.resolve(false);
		}
		setState((prev) => ({ ...prev, isOpen: false }));
	};

	const handleConfirm = () => {
		if (state.resolve) {
			state.resolve(true);
		}
		setState((prev) => ({ ...prev, isOpen: false }));
	};

	const ConfirmDialogWrapper = () =>
		state.props ? (
			<ConfirmDialog open={state.isOpen} onClose={handleClose} onConfirm={handleConfirm} {...state.props} />
		) : null;

	return { confirm, ConfirmDialogWrapper };
}

export default ConfirmDialog;
