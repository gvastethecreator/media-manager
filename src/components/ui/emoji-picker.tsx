import EmojiPickerReact from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
// Tema eliminado - no se usa en este componente
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface EmojiPickerProps {
	className?: string;
	compact?: boolean;
	onChange?: (emoji: string) => void;
	onEmojiSelect?: (emoji: string) => void;
	showLabel?: boolean;
	value?: string;
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
			if (onEmojiSelect) {
				onEmojiSelect(emojiValue);
			}
			if (onChange) {
				onChange(emojiValue);
			}

			// 🎯 Cerrar popover en modo compacto
			if (compact) {
				setOpen(false);
			}
		},
		[onEmojiSelect, compact, onChange]
	);

	// 🚀 Selección rápida de emojis comunes
	const handleQuickSelect = useCallback(
		(emoji: string) => {
			setSelectedEmoji(emoji);
			if (onEmojiSelect) {
				onEmojiSelect(emoji);
			}
			if (onChange) {
				onChange(emoji);
			}
			if (compact) {
				setOpen(false);
			}
		},
		[onEmojiSelect, compact, onChange]
	);

	// 🎯 Versión compacta para formularios
	if (compact) {
		return (
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<Button
						className={cn('h-8 w-full', showLabel ? 'justify-between' : 'justify-center', className)}
						variant="outline"
					>
						<span className="text-base">{selectedEmoji || '😀'}</span>
						{showLabel && <Smile className="ml-2 h-3.5 w-3.5 text-muted-foreground" />}
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-80 p-0" sideOffset={8}>
					<div className="emoji-picker-compact">
						{/* 🔍 Emojis comunes para acceso rápido */}
						<div className="border-b px-3 pt-3 pb-2">
							<div className="mb-2 font-medium text-muted-foreground text-xs">Emojis comunes</div>
							<div className="grid grid-cols-10 gap-1">
								{commonEmojis.slice(0, 20).map((emoji) => (
									<Button
										className={cn('h-6 w-6 p-0 text-sm', selectedEmoji === emoji && 'bg-accent text-accent-foreground')}
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

						{/* 🎨 Picker principal con EmojiPicker */}
						<div className="p-2">
							<EmojiPickerReact
								height={200}
								onEmojiClick={handleEmojiSelect}
								searchPlaceholder="Buscar emoji..."
								width={300}
							/>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		);
	}

	// 🎨 Versión completa para uso general
	return (
		<div className={cn('flex w-[400px] flex-col rounded-lg border', className)}>
			{/* 🔍 Emojis comunes */}
			<div className="border-b p-4">
				<div className="mb-3 font-medium text-muted-foreground text-sm">Emojis comunes</div>
				<div className="grid grid-cols-10 gap-2">
					{commonEmojis.map((emoji) => (
						<Button
							className={cn('h-8 w-8 p-0', selectedEmoji === emoji && 'bg-accent text-accent-foreground')}
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

			{/* 🎨 Picker principal */}
			<div className="p-4">
				<EmojiPickerReact
					height={300}
					onEmojiClick={handleEmojiSelect}
					searchPlaceholder="Buscar emoji..."
					width={350}
				/>
			</div>
		</div>
	);
}
