/**
 * @file ConfirmDialog Component
 * @module components/ui/confirm-dialog
 * @description Dialog de confirmación moderno y accesible
 * Reemplaza el confirm() nativo del navegador
 * A11y: WCAG 3.3.4 - Error Prevention, WCAG 4.1.3 - Status Messages
 */

import { AlertTriangle, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { FocusTrap } from './focus-trap';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogProps {
	/** Texto del botón de cancelar */
	cancelText?: string;
	/** Texto del botón de confirmar */
	confirmText?: string;
	/** Descripción detallada */
	description?: string;
	/** Deshabilitar confirmar temporalmente (cooldown) */
	disableConfirmDuration?: number;
	/** Callback al cancelar (opcional, si no se proporciona usa onClose) */
	onCancel?: () => void;
	/** Callback al cerrar */
	onClose: () => void;
	/** Callback al confirmar */
	onConfirm: () => void;
	/** Si está abierto */
	open: boolean;
	/** Mostrar icono */
	showIcon?: boolean;
	/** Título del dialog */
	title: string;
	/** Variante visual */
	variant?: ConfirmVariant;
}

const variantConfig = {
	danger: {
		icon: Trash2,
		iconColor: 'text-destructive',
		bgColor: 'bg-destructive/10',
		buttonVariant: 'destructive' as const,
		confirmDefault: 'Delete',
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
		confirmDefault: 'Accept',
	},
	success: {
		icon: CheckCircle2,
		iconColor: 'text-dt-success-600',
		bgColor: 'bg-dt-success-50',
		buttonVariant: 'default' as const,
		confirmDefault: 'Confirm',
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
 *   title="Delete carpeta"
 *   description="Se eliminarán 5 archivos permanentemente."
 *   variant="danger"
 *   confirmText="Delete permanentemente"
 * />
 */
export function ConfirmDialog({
	open,
	onClose,
	onConfirm,
	title,
	description,
	confirmText,
	cancelText = 'Cancel',
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
		<Dialog onOpenChange={(isOpen) => !isOpen && handleCancel()} open={open}>
			<DialogContent
				aria-describedby={description ? 'confirm-dialog-description' : undefined}
				aria-labelledby="confirm-dialog-title"
				className="sm:max-w-md"
			>
				<FocusTrap active={open} initialFocus="last" onEscape={handleCancel}>
					<DialogHeader className="gap-4">
						<div className="flex items-start gap-4">
							{showIcon && (
								<div
									aria-hidden="true"
									className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', config.bgColor)}
								>
									<Icon className={cn('h-6 w-6', config.iconColor)} />
								</div>
							)}
							<div className="flex-1 space-y-2">
								<DialogTitle className="text-left" id="confirm-dialog-title">
									{title}
								</DialogTitle>
								{description && (
									<DialogDescription className="text-left" id="confirm-dialog-description">
										{description}
									</DialogDescription>
								)}
							</div>
						</div>
					</DialogHeader>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button data-autofocus={variant !== 'danger'} onClick={handleCancel} variant="outline">
							{cancelText}
						</Button>
						<Button
							className={cn('min-w-[120px]', isConfirmDisabled && 'opacity-70')}
							data-autofocus={variant === 'danger'}
							disabled={isConfirmDisabled}
							onClick={handleConfirm}
							variant={config.buttonVariant}
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
 *     title: 'Delete?',
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
			<ConfirmDialog onClose={handleClose} onConfirm={handleConfirm} open={state.isOpen} {...state.props} />
		) : null;

	return { confirm, ConfirmDialogWrapper };
}

export default ConfirmDialog;
