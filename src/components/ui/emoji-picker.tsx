'use client';

import { cn } from '@/lib/utils';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Search, Smile } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface EmojiPickerProps {
	onEmojiSelect?: (emoji: string) => void;
	value?: string;
	className?: string;
	compact?: boolean;
	showLabel?: boolean;
	onChange?: (emoji: string) => void;
}

const commonEmojis = [
	'📦', '🗃️', '🧰', '💎', '🏆', '🎁', '🔮', '⚔️', '🛡️', '📚',
	'🧙‍♂️', '🧝‍♀️', '🧪', '🧬', '🔍', '🔑', '💰', '🪙', '🧿', '🏺',
	'🍄', '🌿', '🔥', '💧', '⚡', '🌪️', '❄️', '🪄', '🧠', '💀'
];

export function EmojiPicker({ onEmojiSelect, value, className, compact = false, showLabel = true, onChange }: EmojiPickerProps) {
	const { theme } = useTheme();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedEmoji, setSelectedEmoji] = useState(value || '');
	const [open, setOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (value) {
			setSelectedEmoji(value);
		}
	}, [value]);

	const handleEmojiSelect = useCallback((emoji: any) => {
		setSelectedEmoji(emoji.native);
		if (onEmojiSelect) onEmojiSelect(emoji.native);
		if (onChange) onChange(emoji.native);
		if (compact) setOpen(false);
	}, [onEmojiSelect, compact, onChange]);

	const handleQuickSelect = useCallback((emoji: string) => {
		setSelectedEmoji(emoji);
		if (onEmojiSelect) onEmojiSelect(emoji);
		if (onChange) onChange(emoji);
		if (compact) setOpen(false);
	}, [onEmojiSelect, compact, onChange]);

	const handleSearchFocus = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	if (compact) {
		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"h-8 w-full",
							showLabel ? "justify-between" : "justify-center",
							className
						)}
					>
						<span className="text-base">{selectedEmoji}</span>
						{showLabel && (
							<Smile className="h-3.5 w-3.5 ml-2 text-muted-foreground" />
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-56 p-0" align="start" sideOffset={8}>
					<div className="emoji-picker-compact">
						<div className="p-1.5 border-b">
							<div className="relative">
								<Search className="absolute left-1.5 top-1.5 h-3 w-3 text-muted-foreground" />
								<Input
									ref={inputRef}
									placeholder="Buscar emoji..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-6 h-6 text-xs"
								/>
							</div>
						</div>

						<div className="px-1.5 pt-1.5 grid grid-cols-8 gap-0.5 border-b pb-1.5">
							{commonEmojis.slice(0, 16).map((emoji) => (
								<Button
									key={emoji}
									variant="ghost"
									className={cn(
										"h-6 w-6 p-0",
										selectedEmoji === emoji && "bg-accent text-accent-foreground"
									)}
									onClick={() => handleQuickSelect(emoji)}
								>
									<span className="text-sm">{emoji}</span>
								</Button>
							))}
						</div>

						<div className="emoji-picker-container-compact">
							<Picker
								data={data}
								onEmojiSelect={handleEmojiSelect}
								theme={theme === 'dark' ? 'dark' : 'light'}
								autoFocus={false}
								searchPosition="none"
								skinTonePosition="none"
								previewPosition="none"
								maxFrequentRows={0}
								navPosition="bottom"
								perLine={8}
								categories={['frequent', 'people', 'nature', 'objects']}
								dynamicWidth={false}
								searchTerms={searchTerm}
								emojiButtonSize={22}
								emojiSize={16}
							/>
						</div>

						<style jsx global>{`
							.emoji-picker-container-compact {
								--em-emoji-size: 16px;
								--em-padding: 0.25rem;
							}

							.emoji-picker-container-compact .em-emoji-picker {
								border: none;
								width: 100%;
								height: 160px;
								font-size: 12px;
							}
						`}</style>
					</div>
				</PopoverContent>
			</Popover>
		);
	}

	return (
		<div className={cn("flex flex-col w-[350px]", className)}>
			<div className="p-2 border-b">
				<div className="relative">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						ref={inputRef}
						placeholder="Buscar emoji..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-8"
						onClick={handleSearchFocus}
					/>
				</div>
			</div>

			<div className="px-2 pt-3 grid grid-cols-10 gap-1 border-b pb-3">
				{commonEmojis.map((emoji) => (
					<Button
						key={emoji}
						variant="ghost"
						className={cn(
							"h-8 w-8 p-0",
							selectedEmoji === emoji && "bg-accent text-accent-foreground"
						)}
						onClick={() => handleQuickSelect(emoji)}
					>
						<span className="text-lg">{emoji}</span>
					</Button>
				))}
			</div>

			<div className="emoji-picker-container">
				<Picker
					data={data}
					onEmojiSelect={handleEmojiSelect}
					theme={theme === 'dark' ? 'dark' : 'light'}
					autoFocus={false}
					searchPosition="none"
					skinTonePosition="none"
					previewPosition="none"
					maxFrequentRows={0}
					navPosition="bottom"
					perLine={9}
					categories={['frequent', 'people', 'nature', 'foods', 'activities', 'objects', 'symbols']}
					dynamicWidth={false}
					searchTerms={searchTerm}
					emojiButtonSize={30}
					emojiSize={20}
				/>
			</div>

			<style jsx global>{`
				.emoji-picker-container {
					--em-emoji-size: 20px;
					--em-padding: 0.5rem;
				}

				em-emoji-picker {
					--rgb-accent: var(--accent);
					--rgb-background: var(--background);
					height: 350px;
					--border-radius: 0.5rem;
				}

				.emoji-picker-container .em-emoji-picker {
					border: none;
					width: 100%;
					height: 300px;
				}
			`}</style>
		</div>
	);
}
