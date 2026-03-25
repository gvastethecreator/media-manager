import { ArrowLeft, CalendarClock, FolderTree, Hash, Palette, Sparkles, Star, Tag } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useWildcard, useWildcards } from '@/lib/api/wildcards';

export interface WildcardContentViewProps {
	className?: string;
	wildcardId?: string;
}

export const WildcardContentView = memo(function WildcardContentView({
	className,
	wildcardId,
}: WildcardContentViewProps) {
	const params = useParams<{ id: string }>();
	const navigate = useNavigate();
	const effectiveWildcardId = wildcardId || params.id;
	const { data: wildcard, isLoading, error } = useWildcard(effectiveWildcardId || '');
	const { data: relatedWildcards } = useWildcards({ limit: 200, sortBy: 'name', sortOrder: 'asc' });

	const childWildcards = useMemo(() => {
		const wildcards = relatedWildcards?.data ?? [];
		if (!effectiveWildcardId) {
			return [];
		}

		return wildcards.filter((item) => item.parentId === effectiveWildcardId);
	}, [effectiveWildcardId, relatedWildcards?.data]);

	const relationEntries = useMemo(() => {
		if (!wildcard?._count) {
			return [];
		}

		return Object.entries(wildcard._count)
			.filter(([, value]) => Boolean(value))
			.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
	}, [wildcard?._count]);

	const headerControls = effectiveWildcardId ? (
		<Button className="gap-2" onClick={() => navigate(-1)} size="sm" variant="outline">
			<ArrowLeft className="h-4 w-4" />
			Volver
		</Button>
	) : undefined;

	if (!effectiveWildcardId) {
		return (
			<BaseContentView className={className} icon="🃏" title="Wildcard">
				<EmptyState
					description="Selecciona un wildcard desde la vista de wildcards para ver su contenido."
					icon={Hash}
					title="No hay wildcard seleccionado"
				/>
			</BaseContentView>
		);
	}

	if (isLoading) {
		return (
			<BaseContentView
				className={className}
				description="Cargando detalles del wildcard."
				headerControls={headerControls}
				icon="🃏"
				title="Cargando wildcard..."
			>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Estamos preparando la información del wildcard."
						icon={Sparkles}
						title="Cargando wildcard..."
					/>
				</div>
			</BaseContentView>
		);
	}

	if (error || !wildcard) {
		return (
			<BaseContentView
				className={className}
				description={error instanceof Error ? error.message : 'No se pudo cargar el wildcard.'}
				headerControls={headerControls}
				icon="🃏"
				title="Wildcard no disponible"
			>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description={error instanceof Error ? error.message : 'El wildcard solicitado no está disponible.'}
						icon={Hash}
						title="Wildcard no disponible"
					/>
				</div>
			</BaseContentView>
		);
	}

	return (
		<BaseContentView
			className={className}
			description={wildcard.description || wildcard.category || 'Entidad flexible para agrupar y clasificar contenido'}
			headerControls={headerControls}
			icon="🃏"
			title={wildcard.name}
		>
			<div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
				<div className="space-y-4">
					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<Sparkles className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Descripción</h3>
						</div>
						<p className="text-muted-foreground text-sm">
							{wildcard.description || wildcard.content || 'Este wildcard aún no tiene descripción enriquecida.'}
						</p>
						<div className="mt-4 flex flex-wrap gap-2">
							<Badge variant={wildcard.isActive ? 'default' : 'secondary'}>
								{wildcard.isActive ? 'Activo' : 'Inactivo'}
							</Badge>
							{wildcard.isFavorite && (
								<Badge className="gap-1" variant="secondary">
									<Star className="h-3.5 w-3.5" />
									Favorito
								</Badge>
							)}
							{wildcard.type && <Badge variant="outline">{wildcard.type}</Badge>}
							{wildcard.theme && <Badge variant="outline">Tema: {wildcard.theme}</Badge>}
						</div>
					</Card>

					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<FolderTree className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Jerarquía y relaciones</h3>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Padre</p>
								<p className="mt-1 font-medium">{wildcard.parentId || 'Raíz'}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Shortcut</p>
								<p className="mt-1 font-medium">{wildcard.shortcut || 'Sin shortcut'}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Versión</p>
								<p className="mt-1 font-medium">{wildcard.version}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Categoría</p>
								<p className="mt-1 font-medium">{wildcard.category || 'Sin categoría'}</p>
							</div>
						</div>
						{relationEntries.length > 0 && (
							<div className="mt-4 flex flex-wrap gap-2">
								{relationEntries.map(([key, value]) => (
									<Badge key={key} variant="secondary">
										{key}: {value}
									</Badge>
								))}
							</div>
						)}
					</Card>
				</div>

				<div className="space-y-4">
					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<Tag className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Metadatos</h3>
						</div>
						<div className="space-y-3 text-sm">
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Autor</p>
								<p className="mt-1 font-medium">{wildcard.author || 'Sin autor'}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Dificultad</p>
								<p className="mt-1 font-medium">{wildcard.difficulty || 'No definida'}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Emoji</p>
								<p className="mt-1 font-medium">{wildcard.emoji || '—'}</p>
							</div>
						</div>
					</Card>

					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<Palette className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Presentación</h3>
						</div>
						<p className="text-muted-foreground text-sm">Color: {wildcard.color || 'Sin color asignado'}</p>
						<p className="mt-2 text-muted-foreground text-sm">Tema visual: {wildcard.theme || 'Sin tema'}</p>
						{wildcard.featuredImage && (
							<p className="mt-2 break-all text-muted-foreground text-xs">Imagen destacada: {wildcard.featuredImage}</p>
						)}
					</Card>

					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<CalendarClock className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Tiempos</h3>
						</div>
						<p className="text-muted-foreground text-sm">Creado: {new Date(wildcard.createdAt).toLocaleString()}</p>
						<p className="mt-2 text-muted-foreground text-sm">
							Actualizado: {new Date(wildcard.updatedAt).toLocaleString()}
						</p>
					</Card>

					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<FolderTree className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Wildcards hijos</h3>
						</div>
						{childWildcards.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{childWildcards.map((child) => (
									<Button key={child.id} onClick={() => navigate(`/wildcards/${child.id}`)} size="sm" variant="outline">
										{child.name}
									</Button>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-sm">Este wildcard no tiene hijos directos.</p>
						)}
					</Card>
				</div>
			</div>
		</BaseContentView>
	);
});

WildcardContentView.displayName = 'WildcardContentView';
