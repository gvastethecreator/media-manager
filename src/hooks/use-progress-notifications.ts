import { useEffect, useState } from 'react';
import type { ProgressNotification } from '@/types/file-browser/progress-tracking';

export interface UseProgressNotificationsReturn {
	notifications: ProgressNotification[];
	unreadCount: number;
	markAsRead: (id: string) => void;
	removeNotification: (id: string) => void;
	clearAll: () => void;
}

export function useProgressNotifications(): UseProgressNotificationsReturn {
	const [notifications, setNotifications] = useState<ProgressNotification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		// Calcular cantidad de notificaciones no leídas
		const count = notifications.filter((n) => !n.read).length;
		setUnreadCount(count);
	}, [notifications]);

	const markAsRead = (id: string) => {
		setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
	};

	const removeNotification = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	};

	const clearAll = () => {
		setNotifications([]);
	};

	return {
		notifications,
		unreadCount,
		markAsRead,
		removeNotification,
		clearAll,
	};
}

export default useProgressNotifications;
