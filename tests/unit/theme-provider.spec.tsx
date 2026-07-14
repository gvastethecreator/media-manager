import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '@/components/ui/theme-provider';

function ThemeProbe() {
	const { resolvedTheme, setTheme, theme, themes } = useTheme();

	return (
		<>
			<output data-testid="theme-state">{`${theme}:${resolvedTheme}:${themes.length}`}</output>
			<button onClick={() => setTheme('neon')} type="button">
				Usar neón
			</button>
		</>
	);
}

function mockSystemTheme(matchesDark: boolean) {
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			addEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
			matches: matchesDark,
			media: query,
			onchange: null,
			removeEventListener: vi.fn(),
		})),
		writable: true,
	});
}

function installMemoryStorage() {
	const values = new Map<string, string>();
	const storage: Storage = {
		clear: () => values.clear(),
		getItem: (key) => values.get(key) ?? null,
		key: (index) => [...values.keys()][index] ?? null,
		get length() {
			return values.size;
		},
		removeItem: (key) => values.delete(key),
		setItem: (key, value) => values.set(key, String(value)),
	};
	Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
	Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
}

describe('ThemeProvider canónico', () => {
	beforeEach(() => {
		installMemoryStorage();
		document.documentElement.className = '';
		document.documentElement.removeAttribute('data-theme');
		mockSystemTheme(false);
	});

	it('descarta un tema persistido inválido y usa el sistema sin romper el render', async () => {
		window.localStorage.setItem('theme', 'tema-retirado');

		render(
			<ThemeProvider defaultTheme="system">
				<ThemeProbe />
			</ThemeProvider>
		);

		await waitFor(() => expect(screen.getByTestId('theme-state')).toHaveTextContent('system:light:14'));
		expect(window.localStorage.getItem('theme')).toBeNull();
		expect(document.documentElement).toHaveClass('light');
		expect(document.documentElement).toHaveAttribute('data-theme', 'light');
	});

	it('restaura y cambia temas personalizados desde una única fuente de verdad', async () => {
		window.localStorage.setItem('theme', 'aurora');
		render(
			<ThemeProvider defaultTheme="system">
				<ThemeProbe />
			</ThemeProvider>
		);

		await waitFor(() => expect(screen.getByTestId('theme-state')).toHaveTextContent('aurora:aurora:14'));
		expect(document.documentElement).toHaveClass('aurora');

		fireEvent.click(screen.getByRole('button', { name: 'Usar neón' }));

		await waitFor(() => expect(screen.getByTestId('theme-state')).toHaveTextContent('neon:neon:14'));
		expect(window.localStorage.getItem('theme')).toBe('neon');
		expect(document.documentElement).toHaveClass('neon');
		expect(document.documentElement).toHaveAttribute('data-theme', 'neon');
	});
});
