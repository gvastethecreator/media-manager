/**
 * @file FeedbackProvider Component
 * @module components/ui/feedback-provider
 * @description Proveedor de feedback global (toasts, alerts, confirmaciones)
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import { ConfirmDialog, type ConfirmDialogProps, type ConfirmVariant } from './confirm-dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from './alert-dialog';

// ============================================================================
// CONTEXT
// ============================================================================

interface FeedbackContextValue {
	/** Mostrar diálogo de confirmación */
	confirm: (options: Omit<ConfirmOptions, 'onConfirm' | 'onCancel'>) => Promise<boolean>;
	/** Mostrar alerta destructiva */
	alert: (options: AlertOptions) => Promise<void>;
}

interface ConfirmOptions extends Omit<ConfirmDialogProps, 'open' | 'onClose'> {
	/** Callback si confirma */
	onConfirm: () => void | Promise<void>;
	/** Callback si cancela */
	onCancel?: () => void;
}

interface AlertOptions {
	title: string;
	description?: string;
	variant?: ConfirmVariant;
	confirmText?: string;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// ============================================================================
// HOOK
// ============================================================================

export function useFeedback(): FeedbackContextValue {
	const context = useContext(FeedbackContext);
	if (!context) {
		throw new Error('useFeedback debe usarse dentro de FeedbackProvider');
	}
	return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
	// Estado para confirm dialog
	const [confirmState, setConfirmState] = useState<{
		isOpen: boolean;
		options: ConfirmOptions | null;
	}>({
		isOpen: false,
		options: null,
	});

	// Estado para alert dialog
	const [alertState, setAlertState] = useState<{
		isOpen: boolean;
		options: AlertOptions | null;
		resolve: (() => void) | null;
	}>({
		isOpen: false,
		options: null,
		resolve: null,
	});

	// Confirm
	const confirm = useCallback((options: Omit<ConfirmOptions, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
		return new Promise((resolve) => {
			setConfirmState({
				isOpen: true,
				options: {
					...options,
					onConfirm: () => resolve(true),
					onCancel: () => resolve(false),
				},
			});
		});
	}, []);

	// Alert
	const alert = useCallback((options: AlertOptions): Promise<void> => {
		return new Promise((resolve) => {
			setAlertState({
				isOpen: true,
				options,
				resolve,
			});
		});
	}, []);

	// Handlers
	const handleConfirmClose = useCallback(() => {
		setConfirmState((prev) => ({
			...prev,
			isOpen: false,
		}));
		// Delay para la animación
		setTimeout(() => {
			setConfirmState({
				isOpen: false,
				options: null,
			});
		}, 300);
	}, []);

	const handleConfirm = useCallback(() => {
		confirmState.options?.onConfirm();
		handleConfirmClose();
	}, [confirmState.options, handleConfirmClose]);

	const handleCancel = useCallback(() => {
		confirmState.options?.onCancel?.();
		handleConfirmClose();
	}, [confirmState.options, handleConfirmClose]);

	const handleAlertClose = useCallback(() => {
		alertState.resolve?.();
		setAlertState((prev) => ({ ...prev, isOpen: false }));
		setTimeout(() => {
			setAlertState({
				isOpen: false,
				options: null,
				resolve: null,
			});
		}, 300);
	}, [alertState.resolve]);

	const value: FeedbackContextValue = {
		confirm,
		alert,
	};

	return (
		<FeedbackContext.Provider value={value}>
			{children}

			{/* Confirm Dialog */}
			{confirmState.options && (
				<ConfirmDialog
					open={confirmState.isOpen}
					onClose={handleCancel}
					onConfirm={handleConfirm}
					title={confirmState.options.title}
					description={confirmState.options.description}
					confirmText={confirmState.options.confirmText}
					cancelText={confirmState.options.cancelText}
					variant={confirmState.options.variant}
					showIcon={confirmState.options.showIcon}
					disableConfirmDuration={confirmState.options.disableConfirmDuration}
				/>
			)}

			{/* Alert Dialog */}
			{alertState.options && (
				<AlertDialog open={alertState.isOpen} onOpenChange={(open) => !open && handleAlertClose()}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{alertState.options.title}</AlertDialogTitle>
							{alertState.options.description && (
								<AlertDialogDescription>{alertState.options.description}</AlertDialogDescription>
							)}
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogAction onClick={handleAlertClose}>
								{alertState.options.confirmText || 'Aceptar'}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</FeedbackContext.Provider>
	);
}

export default FeedbackProvider;
