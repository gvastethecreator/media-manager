/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss';

const config: Config = {
	darkMode: 'class',
	content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				// Design Tokens v2 - Semantic colors
				'dt-primary': {
					50: 'var(--dt-primary-50)',
					100: 'var(--dt-primary-100)',
					200: 'var(--dt-primary-200)',
					300: 'var(--dt-primary-300)',
					400: 'var(--dt-primary-400)',
					500: 'var(--dt-primary-500)',
					600: 'var(--dt-primary-600)',
					700: 'var(--dt-primary-700)',
					800: 'var(--dt-primary-800)',
					900: 'var(--dt-primary-900)',
				},
				'dt-success': {
					50: 'var(--dt-success-50)',
					500: 'var(--dt-success-500)',
					600: 'var(--dt-success-600)',
				},
				'dt-warning': {
					50: 'var(--dt-warning-50)',
					500: 'var(--dt-warning-500)',
					600: 'var(--dt-warning-600)',
				},
				'dt-danger': {
					50: 'var(--dt-danger-50)',
					500: 'var(--dt-danger-500)',
					600: 'var(--dt-danger-600)',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				// Design Tokens v2
				'dt-xs': 'var(--dt-radius-xs)',
				'dt-sm': 'var(--dt-radius-sm)',
				'dt-md': 'var(--dt-radius-md)',
				'dt-lg': 'var(--dt-radius-lg)',
				'dt-xl': 'var(--dt-radius-xl)',
			},
			borderWidth: {
				// Design Tokens v2
				dt: 'var(--dt-border-width)',
				'dt-thin': 'var(--dt-border-width-thin)',
			},
			boxShadow: {
				// Design Tokens v2 - Elevations
				'dt-0': 'var(--dt-shadow-0)',
				'dt-1': 'var(--dt-shadow-1)',
				'dt-2': 'var(--dt-shadow-2)',
				'dt-3': 'var(--dt-shadow-3)',
				'dt-4': 'var(--dt-shadow-4)',
				// Inset shadows
				'dt-inset-1': 'var(--dt-inset-1)',
				'dt-inset-2': 'var(--dt-inset-2)',
				// Focus ring
				'dt-focus': 'var(--dt-focus-ring)',
				'dt-focus-error': 'var(--dt-focus-ring-error)',
			},
			transitionDuration: {
				// Design Tokens v2
				'dt-instant': 'var(--dt-duration-instant)',
				'dt-fast': 'var(--dt-duration-fast)',
				'dt-normal': 'var(--dt-duration-normal)',
				'dt-slow': 'var(--dt-duration-slow)',
			},
			transitionTimingFunction: {
				// Design Tokens v2
				'dt-default': 'var(--dt-ease-default)',
				'dt-in': 'var(--dt-ease-in)',
				'dt-out': 'var(--dt-ease-out)',
				'dt-bounce': 'var(--dt-ease-bounce)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				shimmer: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				shimmer: 'shimmer 1.5s infinite ease-in-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};

export default config;
