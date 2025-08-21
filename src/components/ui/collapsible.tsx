'use client';

import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import React from 'react';
import { cn } from '@/lib/utils';

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
	return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
	return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />;
}

function CollapsibleContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
	return (
		<CollapsiblePrimitive.CollapsibleContent
			className={cn(
				'overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
				className
			)}
			data-slot="collapsible-content"
			{...props}
		>
			{children}
		</CollapsiblePrimitive.CollapsibleContent>
	);
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
