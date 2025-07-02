'use client';

import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGroup } from '@/lib/api/groups';
import { clientLogger } from '@/lib/logger/client-logger';
import { FileBox, ImageIcon, TagIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';
import type { ViewProps } from '../types';

const logger = clientLogger.withContext('GroupContentView');

export function GroupContentView(_props: ViewProps) {
	const params = useParams();
	const groupId = typeof params.id === 'string' ? params.id : null;
	const { setCurrentView } = useNavigationStore();

	// Usar React Query hook en lugar de server action
	const {
		data: group,
		isLoading,
		error,
	} = useGroup(groupId || '', {
		enabled: !!groupId,
	});

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (error || !group) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error instanceof Error ? error.message : 'Grupo no encontrado'}</p>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				{/* Cabecera del grupo */}
				<div className="mb-6 flex items-center gap-4">
					<div
						className="flex items-center justify-center w-14 h-14 rounded-full text-3xl"
						style={{ backgroundColor: `${group.color ?? '#60a5fa'}25` }}
					>
						{group.emoji || '📂'}
					</div>
					<div>
						<h1 className="text-2xl font-bold">{group.name}</h1>
						{group.category && <p className="text-muted-foreground">{group.category}</p>}
					</div>
				</div>

				{/* Descripción */}
				{group.description && (
					<div className="mb-6 p-4 rounded-lg bg-muted/30">
						<p>{group.description}</p>
					</div>
				)}

				{/* Pestañas para diferentes tipos de contenido */}
				<Tabs defaultValue="all" className="mt-6">
					<TabsList className="grid grid-cols-4 mb-4">
						<TabsTrigger value="all">Todos</TabsTrigger>
						<TabsTrigger value="images">
							<ImageIcon className="mr-2 h-4 w-4" />
							Imágenes
						</TabsTrigger>
						<TabsTrigger value="tags">
							<TagIcon className="mr-2 h-4 w-4" />
							Tags
						</TabsTrigger>
						<TabsTrigger value="entities">
							<FileBox className="mr-2 h-4 w-4" />
							Entidades
						</TabsTrigger>
					</TabsList>

					{/* Contenido de cada pestaña */}
					<TabsContent value="all" className="space-y-4">
						<p className="text-center text-muted-foreground py-10">
							Este grupo contiene {group._count?.images ?? 0} entidades en total
						</p>
					</TabsContent>

					<TabsContent value="images" className="space-y-4">
						<p className="text-center text-muted-foreground py-10">
							Este grupo contiene {group._count?.images ?? 0} imágenes
						</p>
					</TabsContent>

					<TabsContent value="tags" className="space-y-4">
						<p className="text-center text-muted-foreground py-10">
							Este grupo contiene {group._count?.tags ?? 0} tags
						</p>
					</TabsContent>

					<TabsContent value="entities" className="space-y-4">
						<p className="text-center text-muted-foreground py-10">Este grupo contiene entidades de diferentes tipos</p>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{/* Álbums */}
							{(group._count?.albums ?? 0) > 0 && (
								<div className="p-4 rounded-lg border bg-background hover:shadow-md transition-shadow">
									<p className="font-medium">Álbumes</p>
									<p className="text-lg font-bold">{group._count?.albums}</p>
								</div>
							)}

							{/* Colecciones */}
							{(group._count?.collections ?? 0) > 0 && (
								<div className="p-4 rounded-lg border bg-background hover:shadow-md transition-shadow">
									<p className="font-medium">Colecciones</p>
									<p className="text-lg font-bold">{group._count?.collections}</p>
								</div>
							)}

							{/* Personajes */}
							{(group._count?.characters ?? 0) > 0 && (
								<div className="p-4 rounded-lg border bg-background hover:shadow-md transition-shadow">
									<p className="font-medium">Personajes</p>
									<p className="text-lg font-bold">{group._count?.characters}</p>
								</div>
							)}

							{/* Lugares */}
							{(group._count?.places ?? 0) > 0 && (
								<div className="p-4 rounded-lg border bg-background hover:shadow-md transition-shadow">
									<p className="font-medium">Lugares</p>
									<p className="text-lg font-bold">{group._count?.places}</p>
								</div>
							)}

							{/* Otros tipos... */}
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</ScrollArea>
	);
}
