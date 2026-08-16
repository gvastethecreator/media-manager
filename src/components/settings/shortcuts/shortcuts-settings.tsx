import {
	Bookmark,
	Command,
	Copy,
	FileUp,
	Folder,
	Home,
	Image,
	Keyboard,
	Search,
	Settings2,
	Tag,
	Trash2,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from '@/components/ui/motion-shim';
import { useSettings } from '@/lib/contexts/settings-context';
import type { InterfacePreferences } from '@/types/ui/types';
import { SettingsPageHeader } from '../modern/settings-card';

const shortcutCategories = [
	{
		name: 'General',
		icon: Command,
		shortcuts: [
			{ action: 'Open settings', keys: 'Ctrl + ,', Icon: Settings2 },
			{ action: 'Search', keys: 'Ctrl + F', Icon: Search },
			{ action: 'Reload view', keys: 'F5', Icon: Command },
		],
	},
	{
		name: 'Navigation',
		icon: Home,
		shortcuts: [
			{ action: 'Go to Dashboard', keys: 'Alt + H', Icon: Home },
			{ action: 'Go to Folders', keys: 'Alt + F', Icon: Folder },
			{ action: 'Go to Collections', keys: 'Alt + C', Icon: Bookmark },
			{ action: 'Go to Gallery', keys: 'Alt + G', Icon: Image },
			{ action: 'Go to Tags', keys: 'Alt + T', Icon: Tag },
		],
	},
	{
		name: 'Files',
		icon: FileUp,
		shortcuts: [
			{ action: 'Select all', keys: 'Ctrl + A', Icon: Command },
			{ action: 'Copy', keys: 'Ctrl + C', Icon: Copy },
			{ action: 'Paste', keys: 'Ctrl + V', Icon: FileUp },
			{ action: 'Delete', keys: 'Delete', Icon: Trash2 },
		],
	},
];

interface ShortcutSettings {
	shortcuts: Record<string, string>;
}

interface ExtendedSettings extends InterfacePreferences {
	shortcuts?: Record<string, string>;
}

export function ShortcutsSettings() {
	const { settings, updateSettings } = useSettings();
	const [editingShortcut, setEditingShortcut] = React.useState<string | null>(null);
	const [listeningForKeys, setListeningForKeys] = React.useState(false);
	const [customShortcuts, setCustomShortcuts] = React.useState<Record<string, string>>(
		(settings as any)?.shortcuts || {}
	);

	const handleStartEditing = (action: string) => {
		setEditingShortcut(action);
		setListeningForKeys(true);
	};

	const handleKeyDown = (e: React.KeyboardEvent, action: string) => {
		if (!listeningForKeys) {
			return;
		}

		e.preventDefault();
		const keys = [];
		if (e.ctrlKey) {
			keys.push('Ctrl');
		}
		if (e.altKey) {
			keys.push('Alt');
		}
		if (e.shiftKey) {
			keys.push('Shift');
		}

		const key = e.key.toUpperCase();
		if (!['CONTROL', 'ALT', 'SHIFT'].includes(key)) {
			keys.push(key);
		}

		if (keys.length > 0) {
			const newShortcuts = {
				...customShortcuts,
				[action]: keys.join(' + '),
			};
			setCustomShortcuts(newShortcuts);

			const updatedSettings: ShortcutSettings = {
				shortcuts: newShortcuts,
			};
			updateSettings(updatedSettings);
			setEditingShortcut(null);
			setListeningForKeys(false);
		}
	};

	return (
		<div className="space-y-6">
			<SettingsPageHeader
				description="Review and customize common shortcuts. Categories use the available width on larger screens."
				title="Keyboard Shortcuts"
			/>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
				{shortcutCategories.map((category, categoryIndex) => (
					<motion.div
						animate={{
							opacity: 1,
							y: 0,
						}}
						initial={{
							opacity: 0,
							y: 20,
						}}
						key={category.name}
						transition={{ delay: categoryIndex * 0.1 }}
					>
						<Card className="h-full overflow-hidden border-border/50 bg-muted/30 shadow-sm">
							<CardHeader className="p-4 pb-3">
								<div className="flex items-center gap-2">
									<category.icon className="h-4 w-4" />
									<CardTitle className="font-medium text-sm">{category.name}</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="space-y-2 p-3">
								{category.shortcuts.map((shortcut, index) => (
									<motion.div
										animate={{
											opacity: 1,
											x: 0,
										}}
										className="group flex flex-col gap-2 rounded-lg p-2 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
										initial={{
											opacity: 0,
											x: -20,
										}}
										key={shortcut.action}
										transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
									>
										<div className="flex min-w-0 items-center gap-2">
											<div className="rounded-md bg-muted p-1">
												<shortcut.Icon className="h-3.5 w-3.5 text-muted-foreground" />
											</div>
											<span className="truncate font-medium text-xs">{shortcut.action}</span>
										</div>
										<div className="flex items-center gap-1 self-end sm:self-auto">
											{editingShortcut === shortcut.action ? (
												<Input
													autoFocus
													className="h-7 w-28 text-center text-xs"
													onKeyDown={(e) => handleKeyDown(e, shortcut.action)}
													placeholder="Presiona teclas..."
													value=""
												/>
											) : (
												<Badge className="px-1.5 py-0.5 font-mono text-[10px]" variant="outline">
													{customShortcuts[shortcut.action] || shortcut.keys}
												</Badge>
											)}
											<motion.div initial={{ opacity: 0, x: 20 }} whileHover={{ opacity: 1, x: 0 }}>
												<Button
													className="h-6 w-6 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
													onClick={() => handleStartEditing(shortcut.action)}
													size="icon"
													variant="ghost"
												>
													<Keyboard className="h-3 w-3" />
												</Button>
											</motion.div>
										</div>
									</motion.div>
								))}
							</CardContent>
						</Card>
					</motion.div>
				))}
			</div>
		</div>
	);
}
