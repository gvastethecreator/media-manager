/**
 * Servicio centralizado de notificaciones utilizando sonner
 * Este servicio proporciona una interfaz unificada para mostrar notificaciones en toda la aplicación
 */

import type * as React from 'react';
import { type ToastT, toast } from 'sonner';

// Tipos de notificaciones
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';

// Opciones de notificación
export interface ToastOptions {
	id?: string;
	duration?: number;
	icon?: React.ReactNode;
	description?: React.ReactNode;
	action?: {
		label: string;
		onClick: () => void;
	};
	cancel?: {
		label: string;
		onClick?: () => void;
	};
	onDismiss?: () => void;
	onAutoClose?: () => void;
	position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
	className?: string;
	dismissible?: boolean;
	important?: boolean;
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
const showToast = (title: string, options?: ToastOptions, type: ToastType = 'default'): ToastT => {
	const { description, ...restOptions } = options || {};

	switch (type) {
		case 'success':
			return toast.success(title, { description, ...restOptions });
		case 'error':
			return toast.error(title, { description, ...restOptions });
		case 'info':
			return toast.info(title, { description, ...restOptions });
		case 'warning':
			return toast.warning(title, { description, ...restOptions });
		default:
			return toast(title, { description, ...restOptions });
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
		error: (message: string) =>
			showToast(
				TOAST_TYPES.system.error,
				{
					description: message,
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
