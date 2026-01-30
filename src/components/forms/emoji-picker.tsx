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

export const EmojiPicker = memo(function EmojiPickerImpl({ value, onChange, className }: EmojiPickerProps) {
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
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button className={cn('w-24 justify-center', className)} type="button" variant="outline">
					<span className="text-lg">{value || '😀'}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80 p-0">
				<Tabs onValueChange={setActiveTab} value={activeTab}>
					{/* 🎨 Navegación por categorías */}
					<div className="border-b px-3">
						<TabsList className="h-11 w-full">
							<TabsTrigger className="text-lg" title="Actividades" value="activities">
								🎨
							</TabsTrigger>
							<TabsTrigger className="text-lg" title="Caras" value="faces">
								😀
							</TabsTrigger>
							<TabsTrigger className="text-lg" title="Naturaleza" value="nature">
								🌟
							</TabsTrigger>
							<TabsTrigger className="text-lg" title="Comida" value="food">
								🍎
							</TabsTrigger>
							<TabsTrigger className="text-lg" title="Objetos" value="objects">
								📱
							</TabsTrigger>
							<TabsTrigger className="text-lg" title="Símbolos" value="symbols">
								❤️
							</TabsTrigger>
						</TabsList>
					</div>

					{/* 📱 Contenido de cada categoría */}
					<ScrollArea className="h-72">
						{Object.entries(emojisByCategory).map(([category, emojis]) => (
							<TabsContent className="m-0" key={category} value={category}>
								<div className="grid grid-cols-8 gap-2 p-4">
									{emojis.map((emoji) => (
										<Button
											className={cn(
												'h-9 w-9 p-0 text-lg hover:bg-accent',
												value === emoji && 'bg-accent text-accent-foreground'
											)}
											key={emoji}
											onClick={() => handleEmojiSelect(emoji)}
											variant="ghost"
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
