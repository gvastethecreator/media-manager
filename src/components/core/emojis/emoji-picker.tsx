import EmojiPickerReact from 'emoji-picker-react';

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
 * Proporciona un selector de emojis usando EmojiPickerReact con:
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
		(emojiData: { emoji: string }) => {
			const emojiValue = emojiData.emoji;
			setSelectedEmoji(emojiValue);

			// 📢 Notificar a los callbacks
			if (onEmojiSelect) {
				onEmojiSelect(emojiValue);
			}
			if (onChange) {
				onChange(emojiValue);
			}

			// 🎯 Cerrar popover
			setOpen(false);
		},
		[onEmojiSelect, onChange]
	);

	// 🚀 Selección rápida de emojis frecuentes
	const handleQuickSelect = useCallback(
		(emoji: string) => {
			setSelectedEmoji(emoji);
			if (onEmojiSelect) {
				onEmojiSelect(emoji);
			}
			if (onChange) {
				onChange(emoji);
			}
			setOpen(false);
		},
		[onEmojiSelect, onChange]
	);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					className={cn(
						compact ? 'h-8 w-full' : 'h-10 w-full',
						showLabel ? 'justify-between' : 'justify-center',
						className
					)}
					size={compact ? 'sm' : 'md'}
					variant="outline"
				>
					<span className={compact ? 'text-sm' : 'text-base'}>{selectedEmoji || value || '😀'}</span>
					{showLabel && <Smile className={cn('ml-2 text-muted-foreground', compact ? 'h-3 w-3' : 'h-4 w-4')} />}
				</Button>
			</PopoverTrigger>

			<PopoverContent align="start" className={cn('p-0', compact ? 'w-80' : 'w-96')} sideOffset={8}>
				<div className="emoji-picker-core">
					{/* 🔍 Emojis frecuentes */}
					<div className="border-b px-3 pt-3 pb-2">
						<div className="mb-2 font-medium text-muted-foreground text-xs">Emojis frecuentes</div>
						<div className={cn('grid gap-1', compact ? 'grid-cols-10' : 'grid-cols-12')}>
							{frequentEmojis.slice(0, compact ? 20 : 24).map((emoji) => (
								<Button
									className={cn(
										'p-0 text-sm hover:bg-accent',
										compact ? 'h-6 w-6' : 'h-8 w-8',
										selectedEmoji === emoji && 'bg-accent text-accent-foreground'
									)}
									key={emoji}
									onClick={() => handleQuickSelect(emoji)}
									size="sm"
									variant="ghost"
								>
									{emoji}
								</Button>
							))}
						</div>
					</div>

					{/* 🎨 Picker principal con EmojiPickerReact */}
					<div className="p-3">
						<EmojiPickerReact height={compact ? 200 : 250} onEmojiClick={handleEmojiSelect} width="100%" />
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
