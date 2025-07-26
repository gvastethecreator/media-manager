import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCreateAlbum, useDeleteAlbum, useUpdateAlbum } from '@/lib/api/albums';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAlbumStore } from '@/store/entities/album';
import type { AlbumWithStats } from '@/types/entities/album';
import type { ViewProps } from '../types';
import AlbumsContentView from './albums-content-view';

const viewLogger = clientLogger.withContext('AlbumsView');

export function AlbumsView(_props: ViewProps) {
	const albumsRecord = useAlbumStore((s) => s.albums);
	const isLoading = useAlbumStore((s) => s.isLoading);
	const error = useAlbumStore((s) => s.error);
	const loadAlbums = useAlbumStore((s) => s.loadAlbums);
	const getSortedAlbums = useAlbumStore((s) => s.getSortedAlbums);
	const { mutate: createAlbum } = useCreateAlbum();
	const { mutate: updateAlbum } = useUpdateAlbum();
	const { mutate: deleteAlbum } = useDeleteAlbum();

	const [showForm, setShowForm] = useState(false);
	const [editingAlbum, setEditingAlbum] = useState<AlbumWithStats | null>(null);
	const [albumName, setAlbumName] = useState('');
	const [albumDescription, setAlbumDescription] = useState('');

	useEffect(() => {
		if (Object.keys(albumsRecord).length === 0) {
			viewLogger.info('Store de álbumes vacío, cargando desde el servidor...');
			loadAlbums();
		}
	}, [loadAlbums, albumsRecord]);

	const handleAlbumClick = useCallback((album: AlbumWithStats) => {
		viewLogger.info('🖱️ Click en álbum:', album.name);
		// TODO: Lógica de navegación o apertura de visor aquí
	}, []);

	const handleEditAlbum = useCallback((album: AlbumWithStats) => {
		setEditingAlbum(album);
		setAlbumName(album.name);
		setAlbumDescription(album.description || '');
		setShowForm(true);
	}, []);

	const handleDeleteAlbum = useCallback(
		(albumId: string) => {
			deleteAlbum(albumId);
		},
		[deleteAlbum]
	);

	const handleSubmitForm = useCallback(() => {
		if (albumName.trim() === '') {
			// toast({
			// 	title: '❌ Error',
			// 	description: 'El nombre del álbum no puede estar vacío.',
			// 	variant: 'destructive',
			// });
			return;
		}

		if (editingAlbum) {
			updateAlbum({ id: editingAlbum.id, data: { name: albumName, description: albumDescription } });
		} else {
			createAlbum({
				name: albumName,
				description: albumDescription,
				emoji: '📸',
				color: '#3b82f6',
				isFavorite: false,
				filters: '[]',
				sortBy: 'name',
				featuredImage: undefined,
				shortcut: undefined,
				category: undefined,
			});
		}
		setAlbumName('');
		setAlbumDescription('');
		setEditingAlbum(null);
		setShowForm(false);
	}, [albumName, albumDescription, editingAlbum, createAlbum, updateAlbum]);

	const sortedAlbums = useMemo(() => {
		return getSortedAlbums();
	}, [getSortedAlbums]);

	return (
		<AlbumsContentView
			albums={sortedAlbums}
			isLoading={isLoading}
			error={error}
			showForm={showForm}
			editingAlbum={editingAlbum}
			albumName={albumName}
			albumDescription={albumDescription}
			setShowForm={setShowForm}
			setEditingAlbum={setEditingAlbum}
			setAlbumName={setAlbumName}
			setAlbumDescription={setAlbumDescription}
			handleAlbumClick={handleAlbumClick}
			handleEditAlbum={handleEditAlbum}
			handleDeleteAlbum={handleDeleteAlbum}
			handleSubmitForm={handleSubmitForm}
		/>
	);
}
