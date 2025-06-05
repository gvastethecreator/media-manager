'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface EmojiPickerProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

// Categorías de emojis
const emojisByCategory = {
	activities: ['🎨', '🎮', '🎲', '🎭', '🎪', '🎰', '🎳', '🎯', '🎱', '🎤'],
	faces: ['😀', '😎', '🤔', '🤓', '😍', '🤩', '😴', '🤯', '🤠', '🥳'],
	nature: ['🌟', '🌙', '☀️', '🌈', '🌸', '🌺', '🌹', '🌷', '🌼', '🍀'],
	food: ['🍎', '🍕', '🍔', '🌮', '🍦', '🍪', '🍩', '🍫', '🍿', '🥤'],
	objects: ['📱', '💻', '📷', '🎥', '📚', '✏️', '📌', '🔍', '🎁', '🗂️'],
	symbols: ['❤️', '⭐', '🔥', '✨', '💫', '💡', '💭', '🔔', '🎵', '💎'],
};

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
	const [open, setOpen] = useState(false);
	const [activeTab, setActiveTab] = useState('activities');

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" type="button" className={cn('w-24 justify-between', className)}>
					{value}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="start">
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<div className="border-b px-3">
						<TabsList className="h-11">
							<TabsTrigger value="activities" className="text-lg">
								🎨
							</TabsTrigger>
							<TabsTrigger value="faces" className="text-lg">
								😀
							</TabsTrigger>
							<TabsTrigger value="nature" className="text-lg">
								🌟
							</TabsTrigger>
							<TabsTrigger value="food" className="text-lg">
								🍎
							</TabsTrigger>
							<TabsTrigger value="objects" className="text-lg">
								📱
							</TabsTrigger>
							<TabsTrigger value="symbols" className="text-lg">
								❤️
							</TabsTrigger>
						</TabsList>
					</div>
					<ScrollArea className="h-72">
						{Object.entries(emojisByCategory).map(([category, emojis]) => (
							<TabsContent key={category} value={category} className="m-0">
								<div className="grid grid-cols-8 gap-2 p-4">
									{emojis.map((emoji) => (
										<Button
											key={emoji}
											variant="ghost"
											className="h-9 w-9 p-0"
											onClick={() => {
												onChange(emoji);
												setOpen(false);
											}}
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
}
