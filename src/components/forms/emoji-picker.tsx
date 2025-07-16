
import { memo, useCallback, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface EmojiPickerProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

// 🎯 Categorías de emojis organizadas por uso en el proyecto
const emojisByCategory = {
	activities: [
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
		'🎸',
		'🎹',
		'🎺',
		'🎻',
		'🥁',
		'🎬',
		'🎭',
		'🎪',
		'🎨',
		'🖼️',
	],
	faces: [
		'😀',
		'😎',
		'🤔',
		'🤓',
		'😍',
		'🤩',
		'😴',
		'🤯',
		'🤠',
		'🥳',
		'😊',
		'😂',
		'🤣',
		'😆',
		'😄',
		'😃',
		'😁',
		'🙂',
		'🤗',
		'🤭',
	],
	nature: [
		'🌟',
		'🌙',
		'☀️',
		'🌈',
		'🌸',
		'🌺',
		'🌹',
		'🌷',
		'🌼',
		'🍀',
		'🌿',
		'🌱',
		'🌳',
		'🌲',
		'🍃',
		'🌾',
		'🌵',
		'🌴',
		'🏔️',
		'⛰️',
	],
	food: [
		'🍎',
		'🍕',
		'🍔',
		'🌮',
		'🍦',
		'🍪',
		'🍩',
		'🍫',
		'🍿',
		'🥤',
		'🍰',
		'🎂',
		'🧁',
		'🍊',
		'🍌',
		'🍇',
		'🍓',
		'🥝',
		'🥥',
		'🥭',
	],
	objects: [
		'📱',
		'💻',
		'📷',
		'🎥',
		'📚',
		'✏️',
		'📌',
		'🔍',
		'🎁',
		'🗂️',
		'📁',
		'📂',
		'🗃️',
		'📋',
		'📊',
		'📈',
		'📉',
		'🗒️',
		'📝',
		'📄',
	],
	symbols: [
		'❤️',
		'⭐',
		'🔥',
		'✨',
		'💫',
		'💡',
		'💭',
		'🔔',
		'🎵',
		'💎',
		'🏆',
		'🎯',
		'⚡',
		'🌟',
		'💯',
		'✅',
		'❌',
		'⚠️',
		'🚀',
		'🎉',
	],
};

export const EmojiPicker = memo(function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
	const [open, setOpen] = useState(false);
	const [activeTab, setActiveTab] = useState('activities');

	

	// Callback para manejar selección de emojis del grid
	const handleEmojiSelect = useCallback(
		(emoji: string) => {
			onChange(emoji);
			setOpen(false);
		},
		[onChange]
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" type="button" className={cn('w-24 justify-center', className)}>
					<span className="text-lg">{value || '😀'}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="start">
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					{/* 🎨 Navegación por categorías */}
					<div className="border-b px-3">
						<TabsList className="h-11 w-full">
							<TabsTrigger value="activities" className="text-lg" title="Actividades">
								🎨
							</TabsTrigger>
							<TabsTrigger value="faces" className="text-lg" title="Caras">
								😀
							</TabsTrigger>
							<TabsTrigger value="nature" className="text-lg" title="Naturaleza">
								🌟
							</TabsTrigger>
							<TabsTrigger value="food" className="text-lg" title="Comida">
								🍎
							</TabsTrigger>
							<TabsTrigger value="objects" className="text-lg" title="Objetos">
								📱
							</TabsTrigger>
							<TabsTrigger value="symbols" className="text-lg" title="Símbolos">
								❤️
							</TabsTrigger>
						</TabsList>
					</div>

					{/* 📱 Contenido de cada categoría */}
					<ScrollArea className="h-72">
						{Object.entries(emojisByCategory).map(([category, emojis]) => (
							<TabsContent key={category} value={category} className="m-0">
								<div className="grid grid-cols-8 gap-2 p-4">
									{emojis.map((emoji) => (
										<Button
											key={emoji}
											variant="ghost"
											className={cn(
												'h-9 w-9 p-0 text-lg hover:bg-accent',
												value === emoji && 'bg-accent text-accent-foreground'
											)}
											onClick={() => handleEmojiSelect(emoji)}
										>
											{emoji}
										</Button>
									))}
								</div>
							</TabsContent>
						))}
				</ScrollArea>
			</Tabs>
			</PopoverContent>
		</Popover>
	);
});
