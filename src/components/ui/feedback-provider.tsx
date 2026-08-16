/**
 * @file FeedbackProvider Component
 * @module components/ui/feedback-provider
 * @description Proveedor de feedback global (toasts, alerts, confirmaciones)
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from './alert-dialog';
import { ConfirmDialog, type ConfirmDialogProps, type ConfirmVariant } from './confirm-dialog';

// ============================================================================
// CONTEXT
// ============================================================================

interface FeedbackContextValue {
	/** Mostrar alerta destructiva */
	alert: (options: AlertOptions) => Promise<void>;
	/** Mostrar diálogo de confirmación */
	confirm: (options: Omit<ConfirmOptions, 'onConfirm' | 'onCancel'>) => Promise<boolean>;
}

interface ConfirmOptions extends Omit<ConfirmDialogProps, 'open' | 'onClose'> {
	/** Callback si cancela */
	onCancel?: () => void;
	/** Callback si confirma */
	onConfirm: () => void | Promise<void>;
}

interface AlertOptions {
	confirmText?: string;
	description?: string;
	title: string;
	variant?: ConfirmVariant;
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
					cancelText={confirmState.options.cancelText}
					confirmText={confirmState.options.confirmText}
					description={confirmState.options.description}
					disableConfirmDuration={confirmState.options.disableConfirmDuration}
					onClose={handleCancel}
					onConfirm={handleConfirm}
					open={confirmState.isOpen}
					showIcon={confirmState.options.showIcon}
					title={confirmState.options.title}
					variant={confirmState.options.variant}
				/>
			)}

			{/* Alert Dialog */}
			{alertState.options && (
				<AlertDialog onOpenChange={(open) => !open && handleAlertClose()} open={alertState.isOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{alertState.options.title}</AlertDialogTitle>
							{alertState.options.description && (
								<AlertDialogDescription>{alertState.options.description}</AlertDialogDescription>
							)}
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogAction onClick={handleAlertClose}>
								{alertState.options.confirmText || 'OK'}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</FeedbackContext.Provider>
	);
}

export default FeedbackProvider;
