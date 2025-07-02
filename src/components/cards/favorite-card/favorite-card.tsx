import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';
import { cn } from '@/lib/utils';
import type { FavoriteExtended } from '@/types/entities/favorite';

interface FavoriteCardProps {
    favorite: FavoriteExtended;
    onSelect?: () => void;
    isSelected?: boolean;
    className?: string;
}

/**
 * Card sencilla para mostrar un favorito
 */
export function FavoriteCard({ favorite, onSelect, isSelected, className }: FavoriteCardProps) {
    const primaryColor = favorite.entityColor || '#eab308';
    const content = (
        <CardContainer primaryColor={primaryColor} className={cn(className, 'transition-colors', isSelected && 'ring-2 ring-primary')}> 
            <CardHeader
                title={favorite.entityName || favorite.entityType}
                subtitle={favorite.entityType}
                icon={<span>{favorite.entityIcon || '⭐'}</span>}
                primaryColor={primaryColor}
            />
        </CardContainer>
    );
    return onSelect ? (
        <button type="button" onClick={onSelect} className="w-full text-left">
            {content}
        </button>
    ) : (
        content
    );
}
