import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { FavoriteExtended } from '@/types/entities/favorite';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

interface FavoriteCardProps {
	favorite: FavoriteExtended;
	onSelect?: () => void;
	isSelected?: boolean;
	className?: string;
}

/**
 * Card sencilla para mostrar un favorito
 */
export const FavoriteCard = memo(function FavoriteCard({ favorite, onSelect, isSelected, className }: FavoriteCardProps) {
	const primaryColor = favorite.entityColor || '#eab308';
	const content = (
		<CardContainer
			className={cn(className, 'transition-colors', isSelected ? 'ring-2 ring-primary' : '')}
			primaryColor={primaryColor}
		>
			<CardHeader
				icon={<span>{favorite.entityIcon || '⭐'}</span>}
				primaryColor={primaryColor}
				subtitle={favorite.entityType}
				title={favorite.entityName || favorite.entityType}
			/>
		</CardContainer>
	);
	return onSelect ? (
		<button className="w-full text-left" onClick={onSelect} type="button">
			{content}
		</button>
	) : (
		content
	);
});
