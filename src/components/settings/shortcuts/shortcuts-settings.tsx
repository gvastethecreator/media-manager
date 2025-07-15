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
import { motion } from 'motion/react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/lib/contexts';
import type { InterfacePreferences } from '@/types/ui/types';

const shortcutCategories = [
	{
		name: 'General',
		icon: Command,
		shortcuts: [
			{ action: 'Abrir configuración', keys: 'Ctrl + ,', Icon: Settings2 },
			{ action: 'Buscar', keys: 'Ctrl + F', Icon: Search },
			{ action: 'Recargar vista', keys: 'F5', Icon: Command },
		],
	},
	{
		name: 'Navegación',
		icon: Home,
		shortcuts: [
			{ action: 'Ir a Dashboard', keys: 'Alt + H', Icon: Home },
			{ action: 'Ir a Carpetas', keys: 'Alt + F', Icon: Folder },
			{ action: 'Ir a Colecciones', keys: 'Alt + C', Icon: Bookmark },
			{ action: 'Ir a Galería', keys: 'Alt + G', Icon: Image },
			{ action: 'Ir a Etiquetas', keys: 'Alt + T', Icon: Tag },
		],
	},
	{
		name: 'Archivos',
		icon: FileUp,
		shortcuts: [
			{ action: 'Seleccionar todo', keys: 'Ctrl + A', Icon: Command },
			{ action: 'Copiar', keys: 'Ctrl + C', Icon: Copy },
			{ action: 'Pegar', keys: 'Ctrl + V', Icon: FileUp },
			{ action: 'Eliminar', keys: 'Delete', Icon: Trash2 },
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
		(settings as ExtendedSettings).shortcuts || {}
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
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm border-none">
				<CardHeader className="p-2 pb-0 bg-transparent">
					<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
						<span className="flex items-center gap-2 h-7">
							<Keyboard className="h-5 w-5" /> Atajos de Teclado
						</span>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />
				<CardContent className="p-2">
					<div className="space-y-3">
						{shortcutCategories.map((category, categoryIndex) => (
							<motion.div
								key={category.name}
								animate={{
									opacity: [0, 1],
									y: [20, 0],
								}}
								transition={{ delay: categoryIndex * 0.1 }}
							>
								<Card className="overflow-hidden bg-muted/30">
									<CardHeader className="p-4 pb-3">
										<div className="flex items-center gap-2">
											<category.icon className="h-4 w-4" />
											<CardTitle className="text-sm font-medium">{category.name}</CardTitle>
										</div>
									</CardHeader>
									<CardContent className="p-2">
										{category.shortcuts.map((shortcut, index) => (
											<motion.div
												key={shortcut.action}
												animate={{
													opacity: [0, 1],
													x: [-20, 0],
												}}
												transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
												className="flex items-center justify-between p-2 rounded-lg hover:bg-accent group"
											>
												<div className="flex items-center gap-2">
													<div className="p-1 rounded-md bg-muted">
														<shortcut.Icon className="h-3.5 w-3.5 text-muted-foreground" />
													</div>
													<span className="text-xs font-medium">{shortcut.action}</span>
												</div>
												<div className="flex items-center gap-1">
													{editingShortcut === shortcut.action ? (
														<Input
															className="w-24 h-7 text-center text-xs"
															placeholder="Presiona teclas..."
															value=""
															onKeyDown={(e) => handleKeyDown(e, shortcut.action)}
															autoFocus
														/>
													) : (
														<Badge variant="outline" className="px-1.5 py-0.5 text-[10px] font-mono">
															{customShortcuts[shortcut.action] || shortcut.keys}
														</Badge>
													)}
													<motion.div initial={{ opacity: 0, x: 20 }} whileHover={{ opacity: 1, x: 0 }}>
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
															onClick={() => handleStartEditing(shortcut.action)}
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
				</CardContent>
			</Card>
		</ScrollArea>
	);
}
