import { EmojiPicker as FrimousseEmojiPicker } from 'frimousse';
import { Smile } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
	value?: string;
	onEmojiSelect?: (emoji: string) => void;
	onChange?: (emoji: string) => void;
	compact?: boolean;
	showLabel?: boolean;
	className?: string;
}

// 🎯 Emojis frecuentes para el proyecto de gestión de imágenes
const frequentEmojis = [
	'📦',
	'🗃️',
	'🧰',
	'💎',
	'🏆',
	'🎁',
	'🔮',
	'⚔️',
	'🛡️',
	'📚',
	'🧙‍♂️',
	'🧝‍♀️',
	'🧪',
	'🧬',
	'🔍',
	'🔑',
	'💰',
	'🪙',
	'🧿',
	'🏺',
	'🍄',
	'🌿',
	'🔥',
	'💧',
	'⚡',
	'🌪️',
	'❄️',
	'🪄',
	'🧠',
	'💀',
	'🎨',
	'🎮',
	'🎲',
	'🎭',
	'🎪',
	'🎰',
	'🎳',
	'🎯',
	'🎱',
	'🎤',
];

/**
 * 🎨 Componente EmojiPicker para core/emojis
 *
 * Proporciona un selector de emojis usando Frimousse con:
 * - Modo compacto para formularios
 * - Emojis frecuentes para acceso rápido
 * - Búsqueda completa de emojis
 * - Compatibilidad con la API existente
 */
export function EmojiPicker({
	value,
	onEmojiSelect,
	onChange,
	compact = true,
	showLabel = true,
	className,
}: EmojiPickerProps) {
	const [selectedEmoji, setSelectedEmoji] = useState(value || '');
	const [open, setOpen] = useState(false);

	// 🎯 Manejar selección de emoji
	const handleEmojiSelect = useCallback(
		(emoji: { native: string }) => {
			const emojiValue = emoji.native;
			setSelectedEmoji(emojiValue);

			// 📢 Notificar a los callbacks
			if (onEmojiSelect) onEmojiSelect(emojiValue);
			if (onChange) onChange(emojiValue);

			// 🎯 Cerrar popover
			setOpen(false);
		},
		[onEmojiSelect, onChange]
	);

	// 🚀 Selección rápida de emojis frecuentes
	const handleQuickSelect = useCallback(
		(emoji: string) => {
			setSelectedEmoji(emoji);
			if (onEmojiSelect) onEmojiSelect(emoji);
			if (onChange) onChange(emoji);
			setOpen(false);
		},
		[onEmojiSelect, onChange]
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size={compact ? 'sm' : 'default'}
					className={cn(
						compact ? 'h-8 w-full' : 'h-10 w-full',
						showLabel ? 'justify-between' : 'justify-center',
						className
					)}
				>
					<span className={compact ? 'text-sm' : 'text-base'}>{selectedEmoji || value || '😀'}</span>
					{showLabel && <Smile className={cn('ml-2 text-muted-foreground', compact ? 'h-3 w-3' : 'h-4 w-4')} />}
				</Button>
			</PopoverTrigger>

			<PopoverContent className={cn('p-0', compact ? 'w-80' : 'w-96')} align="start" sideOffset={8}>
				<div className="emoji-picker-core">
					{/* 🔍 Emojis frecuentes */}
					<div className="px-3 pt-3 pb-2 border-b">
						<div className="text-xs font-medium text-muted-foreground mb-2">Emojis frecuentes</div>
						<div className={cn('grid gap-1', compact ? 'grid-cols-10' : 'grid-cols-12')}>
							{frequentEmojis.slice(0, compact ? 20 : 24).map((emoji) => (
								<Button
									key={emoji}
									variant="ghost"
									size="sm"
									className={cn(
										'p-0 text-sm hover:bg-accent',
										compact ? 'h-6 w-6' : 'h-8 w-8',
										selectedEmoji === emoji && 'bg-accent text-accent-foreground'
									)}
									onClick={() => handleQuickSelect(emoji)}
								>
									{emoji}
								</Button>
							))}
						</div>
					</div>

					{/* 🎨 Picker principal con Frimousse */}
					<div className="p-3">
						<FrimousseEmojiPicker.Root onEmojiSelect={handleEmojiSelect} className="w-full">
							<FrimousseEmojiPicker.Search
								placeholder="Buscar emoji..."
								className="w-full mb-3 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
							/>
							<FrimousseEmojiPicker.Viewport
								className={cn('overflow-hidden rounded-md border', compact ? 'h-48' : 'h-64')}
							>
								<FrimousseEmojiPicker.Loading className="flex items-center justify-center h-full text-sm text-muted-foreground">
									Cargando emojis...
								</FrimousseEmojiPicker.Loading>
								<FrimousseEmojiPicker.Empty className="flex items-center justify-center h-full text-sm text-muted-foreground">
									No se encontraron emojis
								</FrimousseEmojiPicker.Empty>
								<FrimousseEmojiPicker.List className={cn('grid gap-1 p-2', compact ? 'grid-cols-8' : 'grid-cols-10')} />
							</FrimousseEmojiPicker.Viewport>
						</FrimousseEmojiPicker.Root>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
