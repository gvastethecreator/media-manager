import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
	'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
	{
		variants: {
			variant: {
				default: 'bg-background text-foreground',
				destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
				info: 'border-ui-info-border bg-ui-info text-ui-info-text [&>svg]:text-ui-info-text',
				warning: 'border-ui-warning-border bg-ui-warning text-ui-warning-text [&>svg]:text-ui-warning-text',
				success: 'border-ui-success-border bg-ui-success text-ui-success-text [&>svg]:text-ui-success-text',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

const AlertEnhanced = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
	<div className={cn(alertVariants({ variant }), className)} ref={ref} role="alert" {...props} />
));
AlertEnhanced.displayName = 'AlertEnhanced';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} ref={ref} {...props} />
	)
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => (
		<div className={cn('text-sm [&_p]:leading-relaxed', className)} ref={ref} {...props} />
	)
);
AlertDescription.displayName = 'AlertDescription';

export { AlertEnhanced as Alert, AlertDescription, AlertTitle };
