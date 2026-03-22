'use client';

import { Accordion } from '@base-ui-components/react/accordion';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, Plus } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

// Variants
const accordionRootVariants = cva('', {
	variants: {
		variant: {
			default: '',
			outline: 'space-y-2',
			solid: 'space-y-2',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

const accordionItemVariants = cva('', {
	variants: {
		variant: {
			default: 'border-border border-b',
			outline: 'rounded-lg border border-border px-4',
			solid: 'rounded-lg bg-accent/70 px-4',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

const accordionHeaderVariants = cva('flex', {
	variants: {
		variant: {
			default: '',
			outline: '',
			solid: '',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

const accordionTriggerVariants = cva(
	'flex flex-1 cursor-pointer items-center justify-between gap-2.5 py-4 font-medium text-foreground transition-all [&[data-panel-open]>svg]:rotate-180',
	{
		variants: {
			variant: {
				default: '',
				outline: '',
				solid: '',
			},
			indicator: {
				arrow: '',
				plus: '[&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-panel-open]>svg>path:last-child]:rotate-90 [&[data-panel-open]>svg>path:last-child]:opacity-0 [&[data-panel-open]>svg]:rotate-180',
				none: '',
			},
		},
		defaultVariants: {
			variant: 'default',
			indicator: 'arrow',
		},
	}
);

const accordionPanelVariants = cva(
	'h-[var(--accordion-panel-height)] overflow-hidden text-accent-foreground text-sm transition-[height] ease-out data-[ending-style]:h-0 data-[starting-style]:h-0',
	{
		variants: {
			variant: {
				default: '',
				outline: '',
				solid: '',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

// Context
interface AccordionContextType {
	indicator?: 'arrow' | 'plus' | 'none';
	variant?: 'default' | 'outline' | 'solid';
}

const AccordionContext = React.createContext<AccordionContextType>({
	variant: 'default',
	indicator: 'arrow',
});

// Base UI Accordion Root
interface AccordionRootProps
	extends React.ComponentProps<typeof Accordion.Root>,
		VariantProps<typeof accordionRootVariants> {
	indicator?: 'arrow' | 'plus' | 'none';
}

function AccordionRoot(props: AccordionRootProps) {
	const { className, variant = 'default', indicator = 'arrow', children, ...rest } = props;

	return (
		<AccordionContext.Provider value={{ variant: variant || 'default', indicator }}>
			<Accordion.Root className={cn(accordionRootVariants({ variant }), className)} data-slot="accordion" {...rest}>
				{children}
			</Accordion.Root>
		</AccordionContext.Provider>
	);
}

// Base UI Accordion Item
function AccordionItem(props: React.ComponentProps<typeof Accordion.Item>) {
	const { className, children, ...rest } = props;
	const { variant } = React.useContext(AccordionContext);

	return (
		<Accordion.Item className={cn(accordionItemVariants({ variant }), className)} data-slot="accordion-item" {...rest}>
			{children}
		</Accordion.Item>
	);
}

// Base UI Accordion Header
function AccordionHeader(props: React.ComponentProps<typeof Accordion.Header>) {
	const { className, children, ...rest } = props;
	const { variant } = React.useContext(AccordionContext);

	return (
		<Accordion.Header
			className={cn(accordionHeaderVariants({ variant }), className)}
			data-slot="accordion-header"
			{...rest}
		>
			{children}
		</Accordion.Header>
	);
}

// Base UI Accordion Trigger
function AccordionTrigger(props: React.ComponentProps<typeof Accordion.Trigger>) {
	const { className, children, ...rest } = props;
	const { variant, indicator } = React.useContext(AccordionContext);

	return (
		<Accordion.Trigger
			className={cn(accordionTriggerVariants({ variant, indicator }), className)}
			data-slot="accordion-trigger"
			{...rest}
		>
			{children}
			{indicator === 'plus' && <Plus className="size-4 shrink-0 transition-transform duration-200" strokeWidth={1} />}
			{indicator === 'arrow' && (
				<ChevronDown className="size-4 shrink-0 transition-transform duration-200" strokeWidth={1} />
			)}
		</Accordion.Trigger>
	);
}

// Base UI Accordion Panel
function AccordionPanel(props: React.ComponentProps<typeof Accordion.Panel>) {
	const { className, children, ...rest } = props;
	const { variant } = React.useContext(AccordionContext);

	return (
		<Accordion.Panel
			className={cn(accordionPanelVariants({ variant }), className)}
			data-slot="accordion-panel"
			{...rest}
		>
			<div className={cn('pt-0 pb-5')}>{children}</div>
		</Accordion.Panel>
	);
}

// Exports with proper naming to match Base UI pattern
export { AccordionRoot as Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionPanel };
