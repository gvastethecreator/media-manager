'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface ShortcutPickerProps {
	name: string;
	defaultValue?: string;
	onChange?: (value: string) => void;
	className?: string;
}

export function ShortcutPicker({ name, defaultValue = '', onChange, className }: ShortcutPickerProps) {
	const [shortcut, setShortcut] = React.useState(defaultValue);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		e.preventDefault();

		const { key, ctrlKey, shiftKey, altKey, metaKey } = e;
		if (key === 'Backspace') {
			setShortcut('');
			onChange?.('');
			return;
		}

		if (key === 'Tab' || key === 'Enter' || key === 'Escape') {
			return;
		}

		const modifiers = [];
		if (ctrlKey) {
			modifiers.push('Ctrl');
		}
		if (shiftKey) {
			modifiers.push('Shift');
		}
		if (altKey) {
			modifiers.push('Alt');
		}
		if (metaKey) {
			modifiers.push('Meta');
		}

		const keyName = key.length === 1 ? key.toUpperCase() : key;
		const shortcutValue = [...modifiers, keyName].join('+');

		setShortcut(shortcutValue);
		onChange?.(shortcutValue);
	};

	return (
		<div className={cn('relative', className)}>
			<Input
				type="text"
				name={name}
				value={shortcut}
				onKeyDown={handleKeyDown}
				placeholder="Presiona una tecla..."
				readOnly
			/>
			{shortcut && (
				<button
					type="button"
					className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					onClick={() => {
						setShortcut('');
						onChange?.('');
					}}
				>
					×
				</button>
			)}
		</div>
	);
}
