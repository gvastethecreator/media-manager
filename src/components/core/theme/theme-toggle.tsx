/**
 * @file Componente de toggle de tema
 * @module components/core/theme/theme-toggle
 * @description Toggle de tema migrado de next-themes a implementación nativa
 * @updated 2025-01-27 - Migrado de Next.js a React nativo
 */

import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/ui/theme-provider';

export function ThemeToggle() {
	const { theme, setTheme, themes } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="icon" variant="ghost">
					<Sun className="dark:-rotate-90 h-4 w-4 rotate-0 scale-100 transition-all dark:scale-0" />
					<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{themes.map((t) => (
					<DropdownMenuItem key={t} onClick={() => setTheme(t as any)}>
						{t.charAt(0).toUpperCase() + t.slice(1)}
						{theme === t && <span className="ml-2 text-primary text-xs">(actual)</span>}
					</DropdownMenuItem>
				))}
				<DropdownMenuItem onClick={() => setTheme('system')}>
					Sistema{theme === 'system' && <span className="ml-2 text-primary text-xs">(actual)</span>}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
