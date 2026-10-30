import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateAlbum, useDeleteAlbum, useUpdateAlbum } from '@/lib/api/albums';
import { clientLogger } from '@/lib/logger/client-logger';
import { DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';
import { useAlbumStore } from '@/store/entities/album';
import type { AlbumWithStats } from '@/types/entities/album';
import type { ViewProps } from '../types';
import AlbumsContentView from './albums-content-view';

const viewLogger = clientLogger.withContext('AlbumsView');

export function AlbumsView(_props: ViewProps) {
	const navigate = useNavigate();
	const albumsRecord = useAlbumStore((s) => s.albums);
	const isLoading = useAlbumStore((s) => s.isLoading);
	const error = useAlbumStore((s) => s.error);
	const loadAlbums = useAlbumStore((s) => s.loadAlbums);
	const lastUpdated = useAlbumStore((s) => s.lastUpdated);
	const getSortedAlbums = useAlbumStore((s) => s.getSortedAlbums);
	const setCurrentAlbumId = useAlbumStore((s) => s.setCurrentAlbumId);
	const { mutate: createAlbum } = useCreateAlbum();
	const { mutate: updateAlbum } = useUpdateAlbum();
	const { mutate: deleteAlbum } = useDeleteAlbum();

	const [showForm, setShowForm] = useState(false);
	const [editingAlbum, setEditingAlbum] = useState<AlbumWithStats | null>(null);
	const [albumName, setAlbumName] = useState('');
	const [albumDescription, setAlbumDescription] = useState('');

	// Load once per store lifetime: an empty library also yields an empty record, so emptiness cannot be the signal.
	useEffect(() => {
		if (lastUpdated === null) {
			viewLogger.info('Album store has not loaded yet, loading from the server...');
			loadAlbums();
		}
	}, [loadAlbums, lastUpdated]);

	const handleAlbumClick = useCallback(
		(album: AlbumWithStats) => {
			viewLogger.info('🖱️ Album clicked:', album.name);
			setCurrentAlbumId(album.id);
			navigate(`/albums/${album.id}`);
		},
		[navigate, setCurrentAlbumId]
	);

	const handleEditAlbum = useCallback((album: AlbumWithStats) => {
		setEditingAlbum(album);
		setAlbumName(album.name);
		setAlbumDescription(album.description || '');
		setShowForm(true);
	}, []);

	// The view reads the album store; React Query mutations do not update it, so reload after each one.
	const reloadAlbums = useMemo(() => ({ onSuccess: () => void loadAlbums() }), [loadAlbums]);

	const handleDeleteAlbum = useCallback(
		(albumId: string) => {
			deleteAlbum(albumId, reloadAlbums);
		},
		[deleteAlbum, reloadAlbums]
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
			updateAlbum({ id: editingAlbum.id, data: { name: albumName, description: albumDescription } }, reloadAlbums);
		} else {
			createAlbum(
				{
					name: albumName,
					description: albumDescription,
					emoji: '📸',
					color: DEFAULT_ENTITY_COLOR,
					filters: '[]',
					sortBy: 'name',
					featuredImage: undefined,
					shortcut: undefined,
					category: undefined,
				},
				reloadAlbums
			);
		}
		setAlbumName('');
		setAlbumDescription('');
		setEditingAlbum(null);
		setShowForm(false);
	}, [albumName, albumDescription, editingAlbum, createAlbum, updateAlbum, reloadAlbums]);

	const sortedAlbums = useMemo(() => {
		viewLogger.info('Recalculando sortedAlbums. Registros:', Object.keys(albumsRecord).length);
		return getSortedAlbums();
	}, [getSortedAlbums, albumsRecord]);

	return (
		<AlbumsContentView
			albumDescription={albumDescription}
			albumName={albumName}
			albums={sortedAlbums}
			editingAlbum={editingAlbum}
			error={error}
			handleAlbumClick={handleAlbumClick}
			handleDeleteAlbum={handleDeleteAlbum}
			handleEditAlbum={handleEditAlbum}
			handleSubmitForm={handleSubmitForm}
			isLoading={isLoading}
			setAlbumDescription={setAlbumDescription}
			setAlbumName={setAlbumName}
			setEditingAlbum={setEditingAlbum}
			setShowForm={setShowForm}
			showForm={showForm}
		/>
	);
}
