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
			Back
		</Button>
	) : undefined;

	if (!effectiveWildcardId) {
		return (
			<BaseContentView className={className} icon="🃏" title="Wildcard">
				<EmptyState description="Select a wildcard to view its content." icon={Hash} title="No wildcard selected" />
			</BaseContentView>
		);
	}

	if (isLoading) {
		return (
			<BaseContentView
				className={className}
				description="Loading wildcard details."
				headerControls={headerControls}
				icon="🃏"
				title="Loading wildcard..."
			>
				<div className="flex h-full items-center justify-center">
					<EmptyState description="Preparing wildcard information." icon={Sparkles} title="Loading wildcard..." />
				</div>
			</BaseContentView>
		);
	}

	if (error || !wildcard) {
		return (
			<BaseContentView
				className={className}
				description={error instanceof Error ? error.message : 'The wildcard could not be loaded.'}
				headerControls={headerControls}
				icon="🃏"
				title="Wildcard unavailable"
			>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description={error instanceof Error ? error.message : 'The requested wildcard is unavailable.'}
						icon={Hash}
						title="Wildcard unavailable"
					/>
				</div>
			</BaseContentView>
		);
	}

	return (
		<BaseContentView
			className={className}
			description={
				wildcard.description || wildcard.category || 'A flexible entity for grouping and classifying content'
			}
			headerControls={headerControls}
			icon="🃏"
			title={wildcard.name}
		>
			<div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
				<div className="space-y-4">
					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<Sparkles className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Description</h3>
						</div>
						<p className="text-muted-foreground text-sm">
							{wildcard.description || wildcard.content || 'This wildcard does not have a detailed description yet.'}
						</p>
						<div className="mt-4 flex flex-wrap gap-2">
							<Badge variant={wildcard.isActive ? 'default' : 'secondary'}>
								{wildcard.isActive ? 'Active' : 'Inactive'}
							</Badge>
							{wildcard.isFavorite && (
								<Badge className="gap-1" variant="secondary">
									<Star className="h-3.5 w-3.5" />
									Favorite
								</Badge>
							)}
							{wildcard.type && <Badge variant="outline">{wildcard.type}</Badge>}
							{wildcard.theme && <Badge variant="outline">Theme: {wildcard.theme}</Badge>}
						</div>
					</Card>

					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<FolderTree className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Hierarchy and relationships</h3>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Parent</p>
								<p className="mt-1 font-medium">{wildcard.parentId || 'Root'}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Shortcut</p>
								<p className="mt-1 font-medium">{wildcard.shortcut || 'No shortcut'}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Version</p>
								<p className="mt-1 font-medium">{wildcard.version}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Category</p>
								<p className="mt-1 font-medium">{wildcard.category || 'Uncategorized'}</p>
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
							<h3 className="font-semibold">Metadata</h3>
						</div>
						<div className="space-y-3 text-sm">
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Author</p>
								<p className="mt-1 font-medium">{wildcard.author || 'Unknown author'}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Difficulty</p>
								<p className="mt-1 font-medium">{wildcard.difficulty || 'Not set'}</p>
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
							<h3 className="font-semibold">Presentation</h3>
						</div>
						<p className="text-muted-foreground text-sm">Color: {wildcard.color || 'No color assigned'}</p>
						<p className="mt-2 text-muted-foreground text-sm">Visual theme: {wildcard.theme || 'No theme'}</p>
						{wildcard.featuredImage && (
							<p className="mt-2 break-all text-muted-foreground text-xs">Featured image: {wildcard.featuredImage}</p>
						)}
					</Card>

					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<CalendarClock className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Timestamps</h3>
						</div>
						<p className="text-muted-foreground text-sm">Created: {new Date(wildcard.createdAt).toLocaleString()}</p>
						<p className="mt-2 text-muted-foreground text-sm">
							Updated: {new Date(wildcard.updatedAt).toLocaleString()}
						</p>
					</Card>

					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<FolderTree className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Child wildcards</h3>
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
							<p className="text-muted-foreground text-sm">This wildcard has no direct children.</p>
						)}
					</Card>
				</div>
			</div>
		</BaseContentView>
	);
});

WildcardContentView.displayName = 'WildcardContentView';
