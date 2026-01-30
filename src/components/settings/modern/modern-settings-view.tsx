/**
 * @file Modern Settings View
 * @module components/settings/modern/modern-settings-view
 * @description Vista principal de Settings con diseño moderno
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EntitiesCardsSettings } from '../entities-cards/entities-cards-settings';
import { ProfilesSettings } from '../profiles/profiles-settings';
import { UploadedImagesSettings } from '../uploaded-images/uploaded-images-settings';
import { AppearanceSettingsModern } from './appearance-settings-modern';
import { FilesSettingsModern } from './files-settings-modern';
import { MediaSettingsModern } from './media-settings-modern';
import { ModernSettingsLayout } from './modern-settings-layout';
import { OrganizationSettingsModern } from './organization-settings-modern';
import { SETTINGS_CATEGORIES } from './settings-categories';
import { SystemSettingsModern } from './system-settings-modern';
import { TaxonomySettingsModern } from './taxonomy-settings-modern';
import { WorldbuildingSettingsModern } from './worldbuilding-settings-modern';

/**
 * Componente de contenido dinámico basado en el item seleccionado
 */
function SettingsContent({ itemId }: { itemId: string }) {
	// Estado de carga para simular loading
	const [isLoading, setIsLoading] = useState(false);

	// Simular carga al cambiar de item
	useEffect(() => {
		setIsLoading(true);
		const timer = setTimeout(() => setIsLoading(false), 300);
		return () => clearTimeout(timer);
	}, [itemId]);

	if (isLoading) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					<p className="text-muted-foreground text-sm">Cargando configuración...</p>
				</div>
			</div>
		);
	}

	switch (itemId) {
		case 'general':
		case 'storage':
		case 'database':
			return <SystemSettingsModern />;

		case 'profiles':
			return <ProfilesSettings />;

		case 'appearance':
		case 'shortcuts':
		case 'panels':
			return <AppearanceSettingsModern />;

		case 'entities-cards':
			return <EntitiesCardsSettings />;

		case 'folders':
		case 'thumbnails':
			return <FilesSettingsModern />;

		case 'images':
		case 'videos':
		case 'audio':
		case 'documents':
		case '3d-files':
		case 'json-files':
			return <MediaSettingsModern />;

		case 'uploaded-images':
			return <UploadedImagesSettings />;

		case 'albums':
		case 'collections':
		case 'groups':
			return <OrganizationSettingsModern />;

		case 'tags':
		case 'properties':
			return <TaxonomySettingsModern />;

		case 'characters':
		case 'places':
		case 'world-items':
		case 'concepts':
		case 'prompts':
		case 'notes':
		case 'wildcards':
			return <WorldbuildingSettingsModern />;

		default:
			return (
				<div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<span className="text-2xl">⚙️</span>
					</div>
					<div className="text-center">
						<p className="font-medium">Configuración en desarrollo</p>
						<p className="text-sm">
							La sección <code className="rounded bg-muted px-1 py-0.5 font-mono">{itemId}</code> estará disponible
							pronto
						</p>
					</div>
				</div>
			);
	}
}

/**
 * Vista moderna de Settings
 */
export function ModernSettingsView() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [currentSection, setCurrentSection] = useState('');
	const [currentItem, setCurrentItem] = useState('');

	const section = searchParams.get('section') || SETTINGS_CATEGORIES[0]?.id;
	const item = searchParams.get('item') || SETTINGS_CATEGORIES[0]?.items[0]?.id;

	// Actualizar URL si no hay parámetros
	useEffect(() => {
		if (!(searchParams.has('section') || searchParams.has('item'))) {
			setSearchParams({
				section: SETTINGS_CATEGORIES[0]?.id,
				item: SETTINGS_CATEGORIES[0]?.items[0]?.id,
			});
		}
	}, [searchParams, setSearchParams]);

	// Actualizar estado local cuando cambian los params
	useEffect(() => {
		setCurrentSection(section);
		setCurrentItem(item);
	}, [section, item]);

	const handleNavigate = (categoryId: string, itemId: string) => {
		setSearchParams({ section: categoryId, item: itemId }, { replace: true });
	};

	return (
		<ModernSettingsLayout
			activeItemId={currentItem}
			activeSection={currentSection}
			categories={SETTINGS_CATEGORIES}
			onNavigate={handleNavigate}
		>
			<SettingsContent itemId={currentItem} />
		</ModernSettingsLayout>
	);
}
