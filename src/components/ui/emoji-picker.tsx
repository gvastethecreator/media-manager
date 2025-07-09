import EmojiPicker from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
// Tema eliminado - no se usa en este componente
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface EmojiPickerProps {
	onEmojiSelect?: (emoji: string) => void;
	value?: string;
	className?: string;
	compact?: boolean;
	showLabel?: boolean;
	onChange?: (emoji: string) => void;
}

// 🎯 Emojis comunes para el proyecto de gestión de imágenes
const commonEmojis = [
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
];

export function EmojiPicker({
	onEmojiSelect,
	value,
	className,
	compact = false,
	showLabel = true,
	onChange,
}: EmojiPickerProps) {
	const [selectedEmoji, setSelectedEmoji] = useState(value || '');
	const [open, setOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	// 🔄 Sincronizar con el valor externo
	useEffect(() => {
		if (value) {
			setSelectedEmoji(value);
		}
	}, [value]);

	// 🎯 Manejar selección de emoji desde EmojiPicker
	const handleEmojiSelect = useCallback(
		(emojiData: any) => {
			const emojiValue = emojiData.emoji;
			setSelectedEmoji(emojiValue);

			// 📢 Notificar cambios a los callbacks
			if (onEmojiSelect) onEmojiSelect(emojiValue);
			if (onChange) onChange(emojiValue);

			// 🎯 Cerrar popover en modo compacto
			if (compact) setOpen(false);
		},
		[onEmojiSelect, compact, onChange]
	);

	// 🚀 Selección rápida de emojis comunes
	const handleQuickSelect = useCallback(
		(emoji: string) => {
			setSelectedEmoji(emoji);
			if (onEmojiSelect) onEmojiSelect(emoji);
			if (onChange) onChange(emoji);
			if (compact) setOpen(false);
		},
		[onEmojiSelect, compact, onChange]
	);

	// 🎯 Versión compacta para formularios
	if (compact) {
		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn('h-8 w-full', showLabel ? 'justify-between' : 'justify-center', className)}
					>
						<span className="text-base">{selectedEmoji || '😀'}</span>
						{showLabel && <Smile className="h-3.5 w-3.5 ml-2 text-muted-foreground" />}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80 p-0" align="start" sideOffset={8}>
					<div className="emoji-picker-compact">
						{/* 🔍 Emojis comunes para acceso rápido */}
						<div className="px-3 pt-3 pb-2 border-b">
							<div className="text-xs font-medium text-muted-foreground mb-2">Emojis comunes</div>
							<div className="grid grid-cols-10 gap-1">
								{commonEmojis.slice(0, 20).map((emoji) => (
									<Button
										key={emoji}
										variant="ghost"
										size="sm"
										className={cn('h-6 w-6 p-0 text-sm', selectedEmoji === emoji && 'bg-accent text-accent-foreground')}
										onClick={() => handleQuickSelect(emoji)}
									>
										{emoji}
									</Button>
								))}
							</div>
						</div>

						{/* 🎨 Picker principal con EmojiPicker */}
						<div className="p-2">
							<EmojiPicker
								onEmojiClick={handleEmojiSelect}
								width={300}
								height={200}
								searchPlaceholder="Buscar emoji..."
							/>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		);
	}

	// 🎨 Versión completa para uso general
	return (
		<div className={cn('flex flex-col w-[400px] border rounded-lg', className)}>
			{/* 🔍 Emojis comunes */}
			<div className="p-4 border-b">
				<div className="text-sm font-medium text-muted-foreground mb-3">Emojis comunes</div>
				<div className="grid grid-cols-10 gap-2">
					{commonEmojis.map((emoji) => (
						<Button
							key={emoji}
							variant="ghost"
							size="sm"
							className={cn('h-8 w-8 p-0', selectedEmoji === emoji && 'bg-accent text-accent-foreground')}
							onClick={() => handleQuickSelect(emoji)}
						>
							{emoji}
						</Button>
					))}
				</div>
			</div>

			{/* 🎨 Picker principal */}
			<div className="p-4">
				<EmojiPicker
					onEmojiClick={handleEmojiSelect}
					width={350}
					height={300}
					searchPlaceholder="Buscar emoji..."
				/>
			</div>
		</div>
	);
}
