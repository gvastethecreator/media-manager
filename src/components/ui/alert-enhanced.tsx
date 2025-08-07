import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
	'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
	{
		variants: {
			variant: {
				default: 'bg-background text-foreground',
				destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
				info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 [&>svg]:text-blue-500',
				warning:
					'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 [&>svg]:text-yellow-500',
				success:
					'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300 [&>svg]:text-green-500',
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

export { AlertEnhanced as Alert, AlertTitle, AlertDescription };
