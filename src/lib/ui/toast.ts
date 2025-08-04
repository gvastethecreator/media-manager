/**
 * @file Toast Service Re-export
 * @description Re-exporta el servicio de toast para mantener compatibilidad con imports
 */

export {
	type ToastOptions,
	type ToastType,
	toast,
	toastService as default,
	toastService,
} from '@/services/toast/toast.service';
