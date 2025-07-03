import { EmojiPicker as FrimousseEmojiPicker } from 'frimousse';
import { memo, useCallback, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
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

	// 🎯 Manejar selección con Frimousse
	const handleFrimousseSelect = useCallback((emoji: { native: string }) => {
		onChange(emoji.native);
		setOpen(false);
	}, [onChange]);

	// Callback para manejar selección de emojis del grid
	const handleEmojiSelect = useCallback((emoji: string) => {
		onChange(emoji);
		setOpen(false);
	}, [onChange]);

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

						{/* 🔍 Picker completo con búsqueda */}
						<TabsContent value="search" className="m-0">
							<div className="p-3">
								<FrimousseEmojiPicker.Root onEmojiSelect={handleFrimousseSelect} className="w-full">
									<FrimousseEmojiPicker.Search
										placeholder="Buscar emoji..."
										className="w-full mb-3 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
									/>
									<FrimousseEmojiPicker.Viewport className="h-48 overflow-hidden">
										<FrimousseEmojiPicker.Loading className="flex items-center justify-center h-full text-sm text-muted-foreground">
											Cargando emojis...
										</FrimousseEmojiPicker.Loading>
										<FrimousseEmojiPicker.Empty className="flex items-center justify-center h-full text-sm text-muted-foreground">
											No se encontraron emojis
										</FrimousseEmojiPicker.Empty>
										<FrimousseEmojiPicker.List className="grid grid-cols-8 gap-1" />
									</FrimousseEmojiPicker.Viewport>
								</FrimousseEmojiPicker.Root>
							</div>
						</TabsContent>
					</ScrollArea>

					{/* 🔍 Botón para acceder al buscador completo */}
					<div className="border-t p-2">
						<Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab('search')}>
							🔍 Buscar más emojis
						</Button>
					</div>
				</Tabs>
			</PopoverContent>
		</Popover>
	);
});
