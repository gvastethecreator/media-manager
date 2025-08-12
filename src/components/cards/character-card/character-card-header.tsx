import { Heart, Shield, Sparkles, Sword, Wand } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CharacterCardHeaderProps {
	name: string;
	emoji: string | null;
	color: string;
	isFavorite?: boolean;
	class?: string | null;
	level?: number | null;
	race?: string | null;
	tcgMode?: boolean;
	compact?: boolean;
}

export function CharacterCardHeader({
	name,
	emoji,
	color,
	isFavorite = false,
	class: characterClass,
	level,
	race,
	tcgMode = true,
	compact = false,
}: CharacterCardHeaderProps) {
	const classIcon = () => {
		const lowerCaseClass = characterClass?.toLowerCase();
		if (lowerCaseClass?.includes('warrior')) {
			return <Sword className="h-3.5 w-3.5" />;
		}
		if (lowerCaseClass?.includes('mage')) {
			return <Wand className="h-3.5 w-3.5" />;
		}
		if (lowerCaseClass?.includes('tank')) {
			return <Shield className="h-3.5 w-3.5" />;
		}
		return null;
	};

	if (compact) {
		return (
			<div className="flex items-center gap-2 rounded-t-lg bg-gray-800/50 p-2">
				<span className="text-lg">{emoji}</span>
				<div className="flex-1 truncate">
					<h3 className="truncate font-bold text-sm text-white">{name}</h3>
					<p className="truncate text-gray-300 text-xs">
						{characterClass ?? 'Unknown'} • Lvl {level ?? '?'}
					</p>
				</div>
				{isFavorite && <Heart className="h-4 w-4 flex-shrink-0 fill-current text-red-500" />}
			</div>
		);
	}

	return (
		<div className="relative">
			<div
				className="relative flex h-16 items-center overflow-hidden px-3.5 pt-2.5"
				style={{
					background: `linear-gradient(90deg, ${color}95, ${color}70)`,
					borderBottom: `2px solid ${color}`,
				}}
			>
				<div
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage:
							'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), ' +
							'radial-gradient(circle at 80% 50%, white 1px, transparent 1px), ' +
							'radial-gradient(circle at 50% 20%, white 1px, transparent 1px)',
						backgroundSize: '20px 20px, 20px 20px, 30px 30px',
					}}
				/>
				<div
					className="pointer-events-none absolute inset-0 opacity-15"
					style={{
						backgroundImage: `repeating-linear-gradient(90deg, ${color}, transparent 2px, transparent 4px)`,
						backgroundSize: '8px 100%',
						mixBlendMode: 'overlay',
					}}
				/>
				<div className="relative z-10 flex flex-1 items-center space-x-2">
					<div
						className={cn(
							'relative flex flex-shrink-0 items-center justify-center rounded-full text-xl',
							tcgMode ? 'h-10 w-10' : 'h-8 w-8'
						)}
						style={{
							background: `radial-gradient(circle, ${color}30 0%, ${color}60 100%)`,
							boxShadow: `0 0 8px rgba(0,0,0,0.4), inset 0 0 5px ${color}`,
						}}
					>
						<div className="absolute inset-0 overflow-hidden rounded-full">
							<div
								className="absolute top-0 left-1/4 h-1/3 w-1/2 blur-[1px]"
								style={{
									background: 'linear-gradient(to bottom, rgba(255,255,255,0.7), transparent)',
								}}
							/>
						</div>
						<div className="absolute inset-0 rounded-full border-2 border-white/20" />
						<span className="relative z-10 drop-shadow-sm">{emoji}</span>
					</div>
					<div className="flex flex-col">
						<h3 className={cn('truncate font-bold text-lg tracking-tight', 'text-white drop-shadow-md')}>
							{name}
							{isFavorite && <Sparkles className="-mt-1 ml-1 inline h-4 w-4 text-yellow-200" />}
						</h3>
						<div className="flex items-center gap-1 text-white/80 text-xs">
							{classIcon()}
							<span className="truncate">
								{characterClass ?? 'Unknown'}
								{race && ` • ${race}`}
							</span>
						</div>
					</div>
				</div>
				<div className="relative z-10 flex flex-shrink-0 items-center gap-1">
					{isFavorite && (
						<span
							className="flex items-center justify-center rounded-full px-2 py-0.5"
							style={{
								background: 'rgba(255, 255, 255, 0.3)',
								boxShadow: '0 0 10px rgba(255, 255, 255, 0.5), inset 0 0 3px rgba(255, 255, 255, 0.5)',
							}}
						>
							<Heart className="h-4 w-4 fill-white text-white" />
						</span>
					)}
					<div
						className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-white"
						style={{
							background: `radial-gradient(circle, ${color} 0%, ${color}90 100%)`,
							boxShadow: `0 0 8px rgba(0,0,0,0.4), inset 0 0 5px ${color}60`,
						}}
					>
						{level ?? '?'}
					</div>
				</div>
				<div
					className="absolute top-0 left-0 h-5 w-5 rounded-br-sm border-t-2 border-l-2"
					style={{ borderColor: 'rgba(255,255,255,0.3)' }}
				/>
				<div
					className="absolute top-0 right-0 h-5 w-5 rounded-bl-sm border-t-2 border-r-2"
					style={{ borderColor: 'rgba(255,255,255,0.3)' }}
				/>
			</div>
			<div
				className="relative flex items-center justify-between px-3.5 py-1.5 text-white text-xs"
				style={{
					borderBottom: `2px solid ${color}70`,
					background: 'linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.5))',
				}}
			>
				<div
					className="absolute top-0 left-0 h-4 w-4 border-t border-l"
					style={{ borderColor: 'rgba(255,255,255,0.3)' }}
				/>
				<div
					className="absolute top-0 right-0 h-4 w-4 border-t border-r"
					style={{ borderColor: 'rgba(255,255,255,0.3)' }}
				/>
				<span className="ml-1 flex items-center gap-1 font-semibold tracking-wide">
					{(characterClass ?? 'Unknown').toUpperCase()} • {(race ?? 'Unknown').toUpperCase()}
				</span>
				<div className="mr-1 flex items-center gap-0.5">
					{Array.from({ length: Math.min(5, Math.ceil((level ?? 0) / 10)) }).map((_, i) => {
						const starValue = `${name}-star-${i + 1}`;
						return (
							<div
								className="h-3 w-3 rounded-full bg-yellow-300"
								key={starValue}
								style={{ boxShadow: '0 0 3px rgba(255, 255, 255, 0.7)' }}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}
