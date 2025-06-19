import type * as React from 'react';
import { type ExternalToast, toast } from 'sonner';

// Exportar toast directamente para los componentes que lo requieren
export { toast };

// Tipos de notificaciones
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';

// Opciones de notificación adaptadas a la API de sonner
export interface ToastOptions extends Omit<ExternalToast, 'description'> {
	description?: React.ReactNode;
	action?: {
		label: string;
		onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
	};
	cancel?: {
		label: string;
		onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
	};
}

// Categorías de notificaciones
const TOAST_TYPES = {
	collection: {
		add: '💼 Colección creada',
		delete: '🗑️ Colección eliminada',
		update: '📝 Colección actualizada',
		addImage: '🖼️ Imagen agregada a la colección',
		removeImage: '🚫 Imagen eliminada de la colección',
	},
	tag: {
		add: '🏷️ Etiqueta creada',
		delete: '🗑️ Etiqueta eliminada',
		update: '📝 Etiqueta actualizada',
		addImage: '🏷️ Etiqueta agregada a la imagen',
		removeImage: '🚫 Etiqueta eliminada de la imagen',
	},
	favorite: {
		add: '⭐ Imagen agregada a favoritos',
		remove: '💔 Imagen eliminada de favoritos',
	},
	folder: {
		update: '📁 Carpeta actualizada',
		scan: '🔍 Escaneando carpeta',
		error: '❌ Error en la carpeta',
	},
	worldItem: {
		add: '📦 Objeto creado',
		delete: '🗑️ Objeto eliminado',
		update: '📝 Objeto actualizado',
		error: '❌ Error con el objeto',
	},
	system: {
		error: '❌ Error del sistema',
		warning: '⚠️ Advertencia del sistema',
		info: 'ℹ️ Información del sistema',
		success: '✅ Operación exitosa',
	},
};

/**
 * Muestra una notificación utilizando sonner
 * @param title Título de la notificación
 * @param options Opciones de la notificación
 * @param type Tipo de notificación
 * @returns La instancia de la notificación
 */
const showToast = (title: string, options?: ToastOptions, type: ToastType = 'default'): string | number => {
	const { description, ...restOptions } = options || {};

	// Convertir las opciones al formato que espera sonner
	const toastOptions: ExternalToast = {
		...restOptions,
		description,
	};

	switch (type) {
		case 'success':
			return toast.success(title, toastOptions);
		case 'error':
			return toast.error(title, toastOptions);
		case 'info':
			return toast.info(title, toastOptions);
		case 'warning':
			return toast.warning(title, toastOptions);
		default:
			return toast(title, toastOptions);
	}
};

/**
 * Servicio de notificaciones
 */
export const toastService = {
	// Métodos generales
	show: (title: string, options?: ToastOptions) => showToast(title, options),
	success: (title: string, options?: ToastOptions) => showToast(title, options, 'success'),
	error: (title: string, options?: ToastOptions) => showToast(title, options, 'error'),
	info: (title: string, options?: ToastOptions) => showToast(title, options, 'info'),
	warning: (title: string, options?: ToastOptions) => showToast(title, options, 'warning'),
	promise: toast.promise,
	dismiss: toast.dismiss,

	// Categorías específicas
	collection: {
		created: (name?: string) =>
			showToast(
				TOAST_TYPES.collection.add,
				{
					description: name ? `Colección "${name}" creada` : 'Nueva colección creada',
				},
				'success'
			),
		deleted: (name?: string) =>
			showToast(
				TOAST_TYPES.collection.delete,
				{
					description: name ? `Colección "${name}" eliminada` : 'Colección eliminada',
				},
				'info'
			),
		updated: (name?: string) =>
			showToast(
				TOAST_TYPES.collection.update,
				{
					description: name ? `Colección "${name}" actualizada` : 'Colección actualizada',
				},
				'success'
			),
		imageAdded: (name?: string) =>
			showToast(
				TOAST_TYPES.collection.addImage,
				{
					description: name ? `Imagen agregada a "${name}"` : 'Imagen agregada a la colección',
				},
				'success'
			),
		imageRemoved: (name?: string) =>
			showToast(
				TOAST_TYPES.collection.removeImage,
				{
					description: name ? `Imagen eliminada de "${name}"` : 'Imagen eliminada de la colección',
				},
				'info'
			),
	},
	tag: {
		created: (name?: string) =>
			showToast(
				TOAST_TYPES.tag.add,
				{
					description: name ? `Etiqueta "${name}" creada` : 'Nueva etiqueta creada',
				},
				'success'
			),
		deleted: (name?: string) =>
			showToast(
				TOAST_TYPES.tag.delete,
				{
					description: name ? `Etiqueta "${name}" eliminada` : 'Etiqueta eliminada',
				},
				'info'
			),
		updated: (name?: string) =>
			showToast(
				TOAST_TYPES.tag.update,
				{
					description: name ? `Etiqueta "${name}" actualizada` : 'Etiqueta actualizada',
				},
				'success'
			),
		imageAdded: (name?: string) =>
			showToast(
				TOAST_TYPES.tag.addImage,
				{
					description: name ? `Etiqueta "${name}" agregada` : 'Etiqueta agregada a la imagen',
				},
				'success'
			),
		imageRemoved: (name?: string) =>
			showToast(
				TOAST_TYPES.tag.removeImage,
				{
					description: name ? `Etiqueta "${name}" eliminada` : 'Etiqueta eliminada de la imagen',
				},
				'info'
			),
	},
	worldItem: {
		created: (name?: string) =>
			showToast(
				TOAST_TYPES.worldItem.add,
				{
					description: name ? `Objeto "${name}" creado` : 'Nuevo objeto creado',
				},
				'success'
			),
		deleted: (name?: string) =>
			showToast(
				TOAST_TYPES.worldItem.delete,
				{
					description: name ? `Objeto "${name}" eliminado` : 'Objeto eliminado',
				},
				'info'
			),
		updated: (name?: string) =>
			showToast(
				TOAST_TYPES.worldItem.update,
				{
					description: name ? `Objeto "${name}" actualizado` : 'Objeto actualizado',
				},
				'success'
			),
		error: (title: string, options?: ToastOptions) => showToast(title, options, 'error'),
	},
	favorite: {
		added: () =>
			showToast(
				TOAST_TYPES.favorite.add,
				{
					description: 'Imagen agregada a favoritos',
				},
				'success'
			),
		removed: () =>
			showToast(
				TOAST_TYPES.favorite.remove,
				{
					description: 'Imagen eliminada de favoritos',
				},
				'info'
			),
		updated: () =>
			showToast(
				'⭐ Favoritos actualizados',
				{
					description: 'Lista de favoritos actualizada',
				},
				'success'
			),
	},
	folder: {
		updated: (name?: string) =>
			showToast(
				TOAST_TYPES.folder.update,
				{
					description: name ? `Carpeta "${name}" actualizada` : 'Carpeta actualizada',
				},
				'success'
			),
		scanning: (name?: string) =>
			showToast(
				TOAST_TYPES.folder.scan,
				{
					description: name ? `Escaneando carpeta "${name}"` : 'Escaneando carpeta',
				},
				'info'
			),
		error: (message: string) =>
			showToast(
				TOAST_TYPES.folder.error,
				{
					description: message,
				},
				'error'
			),
	},
	system: {
		error: (message: string, options?: ToastOptions) =>
			showToast(
				TOAST_TYPES.system.error,
				{
					description: message,
					...options,
				},
				'error'
			),
		warning: (message: string) =>
			showToast(
				TOAST_TYPES.system.warning,
				{
					description: message,
				},
				'warning'
			),
		info: (message: string) =>
			showToast(
				TOAST_TYPES.system.info,
				{
					description: message,
				},
				'info'
			),
		success: (message: string) =>
			showToast(
				TOAST_TYPES.system.success,
				{
					description: message,
				},
				'success'
			),
	},
};

export default toastService;
