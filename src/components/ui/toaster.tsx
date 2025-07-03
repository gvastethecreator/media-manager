import { Toast as ToastPrimitive } from '@base-ui-components/react/toast';
import { ToastViewport, toastManager } from '@/components/ui/toast';

export function Toaster() {
	return (
		<ToastPrimitive.Provider toastManager={toastManager}>
			<ToastPrimitive.Portal>
				<ToastViewport />
			</ToastPrimitive.Portal>
		</ToastPrimitive.Provider>
	);
}
