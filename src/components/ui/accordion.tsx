'use client';

import {
	Content as AccordionContentPrimitive,
	Header as AccordionHeader,
	Item as AccordionItemPrimitive,
	Root as AccordionRoot,
	Trigger as AccordionTriggerPrimitive,
} from '@radix-ui/react-accordion';
import { ChevronDownIcon } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

function Accordion({ ...props }: React.ComponentProps<typeof AccordionRoot>) {
	return <AccordionRoot data-slot="accordion" {...props} />;
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionItemPrimitive>) {
	return (
		<AccordionItemPrimitive
			className={cn('border-b last:border-b-0', className)}
			data-slot="accordion-item"
			{...props}
		/>
	);
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionTriggerPrimitive>) {
	return (
		<AccordionHeader className="flex">
			<AccordionTriggerPrimitive
				className={cn(
					'flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left font-medium text-sm outline-none transition-all hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
					className
				)}
				data-slot="accordion-trigger"
				{...props}
			>
				{children}
				<ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
			</AccordionTriggerPrimitive>
		</AccordionHeader>
	);
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionContentPrimitive>) {
	return (
		<AccordionContentPrimitive
			className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
			data-slot="accordion-content"
			{...props}
		>
			<div className={cn('pt-0 pb-4', className)}>{children}</div>
		</AccordionContentPrimitive>
	);
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
