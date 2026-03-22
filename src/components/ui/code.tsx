import * as SlotPrimitive from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';

export interface CodeProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof codeVariants> {
	asChild?: boolean;
	copyText?: string;
	showCopyButton?: boolean;
}

const codeVariants = cva('relative rounded-md bg-muted font-medium font-mono text-sm', {
	variants: {
		variant: {
			default: 'bg-muted text-muted-foreground',
			destructive: 'bg-destructive/10 text-destructive',
			outline: 'border border-border bg-background text-foreground',
		},
		size: {
			default: 'px-2.5 py-1.5 text-sm',
			sm: 'px-2 py-1.5 text-xs',
			lg: 'px-3 py-1.5 text-base',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'default',
	},
});

function Code({
	className,
	variant,
	size,
	asChild = false,
	showCopyButton = false,
	copyText,
	children,
	...props
}: CodeProps) {
	const { copy, copied } = useCopyToClipboard();
	const Comp = asChild ? SlotPrimitive.Slot : 'code';
	const textToCopy = copyText || (typeof children === 'string' ? children : '');

	return (
		<span className={cn('inline-flex items-center gap-2', className)} data-slot="code">
			<Comp className={cn(codeVariants({ variant, size }))} data-slot="code-panel" {...props}>
				{children}
			</Comp>
			{showCopyButton && textToCopy && (
				<Button
					className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
					mode="icon"
					onClick={() => copy(textToCopy)}
					size="sm"
					variant="ghost"
				>
					{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
				</Button>
			)}
		</span>
	);
}

export { Code, codeVariants };
