import { mergeProps } from '@base-ui-components/react/merge-props';
import { useRender } from '@base-ui-components/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, LucideIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'group inline-flex cursor-pointer items-center justify-center whitespace-nowrap whitespace-nowrap font-medium text-sm ring-offset-background transition-[color,box-shadow] focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-60 has-data-[arrow=true]:justify-between [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				primary: 'bg-primary text-primary-foreground hover:bg-primary/90 data-[state=open]:bg-primary/90',
				mono: 'bg-zinc-950 text-white hover:bg-zinc-950/90 data-[state=open]:bg-zinc-950/90 dark:bg-zinc-300 dark:text-black dark:data-[state=open]:bg-zinc-300/90 dark:hover:bg-zinc-300/90',
				destructive:
					'bg-destructive text-destructive-foreground hover:bg-destructive/90 data-[state=open]:bg-destructive/90',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 data-[state=open]:bg-secondary/90',
				outline: 'border border-input bg-background text-accent-foreground hover:bg-accent data-[state=open]:bg-accent',
				dashed:
					'border border-input border-dashed bg-background text-accent-foreground hover:bg-accent hover:text-accent-foreground data-[state=open]:text-accent-foreground',
				ghost:
					'text-accent-foreground hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
				dim: 'text-muted-foreground hover:text-foreground data-[state=open]:text-foreground',
				foreground: '',
				inverse: '',
			},
			appearance: {
				default: '',
				ghost: '',
			},
			underline: {
				solid: '',
				dashed: '',
			},
			underlined: {
				solid: '',
				dashed: '',
			},
			size: {
				lg: 'h-10 gap-1.5 rounded-md px-4 text-sm [&_svg:not([class*=size-])]:size-4',
				md: 'h-8.5 gap-1.5 rounded-md px-3 text-[0.8125rem] leading-(--text-sm--line-height) [&_svg:not([class*=size-])]:size-4',
				sm: 'h-7 gap-1.25 rounded-md px-2.5 text-xs [&_svg:not([class*=size-])]:size-3.5',
				icon: 'size-8.5 shrink-0 rounded-md [&_svg:not([class*=size-])]:size-4',
			},
			autoHeight: {
				true: '',
				false: '',
			},
			shape: {
				default: '',
				circle: 'rounded-full',
			},
			mode: {
				default: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
				icon: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
				link: 'h-auto rounded-none bg-transparent p-0 text-primary hover:bg-transparent data-[state=open]:bg-transparent',
				input: `
            justify-start font-normal hover:bg-background [&_svg]:transition-colors [&_svg]:hover:text-foreground data-[state=open]:bg-background 
            focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30 
            [[data-state=open]>&]:border-ring [[data-state=open]>&]:outline-hidden [[data-state=open]>&]:ring-[3px] 
            [[data-state=open]>&]:ring-ring/30 
            aria-invalid:border-destructive/60 aria-invalid:ring-destructive/10 dark:aria-invalid:border-destructive dark:aria-invalid:ring-destructive/20
            in-data-[invalid=true]:border-destructive/60 in-data-[invalid=true]:ring-destructive/10  dark:in-data-[invalid=true]:border-destructive dark:in-data-[invalid=true]:ring-destructive/20
          `,
			},
			placeholder: {
				true: 'text-muted-foreground',
				false: '',
			},
		},
		compoundVariants: [
			// Icons opacity for default mode
			{
				variant: 'ghost',
				mode: 'default',
				className: '[&_svg:not([role=img]):not([class*=text-]):not([class*=opacity-])]:opacity-60',
			},
			{
				variant: 'outline',
				mode: 'default',
				className: '[&_svg:not([role=img]):not([class*=text-]):not([class*=opacity-])]:opacity-60',
			},
			{
				variant: 'dashed',
				mode: 'default',
				className: '[&_svg:not([role=img]):not([class*=text-]):not([class*=opacity-])]:opacity-60',
			},
			{
				variant: 'secondary',
				mode: 'default',
				className: '[&_svg:not([role=img]):not([class*=text-]):not([class*=opacity-])]:opacity-60',
			},

			// Icons opacity for default mode
			{
				variant: 'outline',
				mode: 'input',
				className: '[&_svg:not([role=img]):not([class*=text-]):not([class*=opacity-])]:opacity-60',
			},
			{
				variant: 'outline',
				mode: 'icon',
				className: '[&_svg:not([role=img]):not([class*=text-]):not([class*=opacity-])]:opacity-60',
			},

			// Auto height
			{
				size: 'md',
				autoHeight: true,
				className: 'h-auto min-h-8.5',
			},
			{
				size: 'sm',
				autoHeight: true,
				className: 'h-auto min-h-7',
			},
			{
				size: 'lg',
				autoHeight: true,
				className: 'h-auto min-h-10',
			},

			// Shadow support
			{
				variant: 'primary',
				mode: 'default',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},
			{
				variant: 'mono',
				mode: 'default',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},
			{
				variant: 'secondary',
				mode: 'default',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},
			{
				variant: 'outline',
				mode: 'default',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},
			{
				variant: 'dashed',
				mode: 'default',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},
			{
				variant: 'destructive',
				mode: 'default',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},

			// Shadow support
			{
				variant: 'primary',
				mode: 'icon',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},
			{
				variant: 'mono',
				mode: 'icon',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},
			{
				variant: 'secondary',
				mode: 'icon',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},
			{
				variant: 'outline',
				mode: 'icon',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},
			{
				variant: 'dashed',
				mode: 'icon',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},
			{
				variant: 'destructive',
				mode: 'icon',
				appearance: 'default',
				className: 'shadow-black/5 shadow-xs',
			},

			// Link
			{
				variant: 'primary',
				mode: 'link',
				underline: 'solid',
				className:
					'font-medium text-primary hover:text-primary/90 hover:underline hover:decoration-solid hover:underline-offset-4 [&_svg:not([role=img]):not([class*=text-])]:opacity-60',
			},
			{
				variant: 'primary',
				mode: 'link',
				underline: 'dashed',
				className:
					'font-medium text-primary decoration-1 hover:text-primary/90 hover:underline hover:decoration-dashed hover:underline-offset-4 [&_svg]:opacity-60',
			},
			{
				variant: 'primary',
				mode: 'link',
				underlined: 'solid',
				className:
					'font-medium text-primary underline decoration-solid underline-offset-4 hover:text-primary/90 [&_svg:not([role=img]):not([class*=text-])]:opacity-60',
			},
			{
				variant: 'primary',
				mode: 'link',
				underlined: 'dashed',
				className:
					'font-medium text-primary underline decoration-1 decoration-dashed underline-offset-4 hover:text-primary/90 [&_svg]:opacity-60',
			},

			{
				variant: 'inverse',
				mode: 'link',
				underline: 'solid',
				className:
					'font-medium text-inherit hover:underline hover:decoration-solid hover:underline-offset-4 [&_svg:not([role=img]):not([class*=text-])]:opacity-60',
			},
			{
				variant: 'inverse',
				mode: 'link',
				underline: 'dashed',
				className:
					'font-medium text-inherit decoration-1 hover:underline hover:decoration-dashed hover:underline-offset-4 [&_svg:not([role=img]):not([class*=text-])]:opacity-60',
			},
			{
				variant: 'inverse',
				mode: 'link',
				underlined: 'solid',
				className:
					'font-medium text-inherit underline decoration-solid underline-offset-4 [&_svg:not([role=img]):not([class*=text-])]:opacity-60',
			},
			{
				variant: 'inverse',
				mode: 'link',
				underlined: 'dashed',
				className:
					'font-medium text-inherit underline decoration-1 decoration-dashed underline-offset-4 [&_svg:not([role=img]):not([class*=text-])]:opacity-60',
			},

			{
				variant: 'foreground',
				mode: 'link',
				underline: 'solid',
				className:
					'font-medium text-foreground hover:underline hover:decoration-solid hover:underline-offset-4 [&_svg:not([role=img]):not([class*=text-])]:opacity-60',
			},
			{
				variant: 'foreground',
				mode: 'link',
				underline: 'dashed',
				className:
					'font-medium text-foreground decoration-1 hover:underline hover:decoration-dashed hover:underline-offset-4 [&_svg:not([role=img]):not([class*=text-])]:opacity-60',
			},
			{
				variant: 'foreground',
				mode: 'link',
				underlined: 'solid',
				className:
					'font-medium text-foreground underline decoration-solid underline-offset-4 [&_svg:not([role=img]):not([class*=text-])]:opacity-60',
			},
			{
				variant: 'foreground',
				mode: 'link',
				underlined: 'dashed',
				className:
					'font-medium text-foreground underline decoration-1 decoration-dashed underline-offset-4 [&_svg:not([role=img]):not([class*=text-])]:opacity-60',
			},

			// Ghost
			{
				variant: 'primary',
				appearance: 'ghost',
				className: 'bg-transparent text-primary/90 hover:bg-primary/5 data-[state=open]:bg-primary/5',
			},
			{
				variant: 'destructive',
				appearance: 'ghost',
				className: 'bg-transparent text-destructive/90 hover:bg-destructive/5 data-[state=open]:bg-destructive/5',
			},
			{
				variant: 'ghost',
				mode: 'icon',
				className: 'text-muted-foreground',
			},

			// Size
			{
				size: 'sm',
				mode: 'icon',
				className: 'h-7 w-7 p-0 [[&_svg:not([class*=size-])]:size-3.5',
			},
			{
				size: 'md',
				mode: 'icon',
				className: 'h-8.5 w-8.5 p-0 [&_svg:not([class*=size-])]:size-4',
			},
			{
				size: 'icon',
				className: 'h-8.5 w-8.5 p-0 [&_svg:not([class*=size-])]:size-4',
			},
			{
				size: 'lg',
				mode: 'icon',
				className: 'h-10 w-10 p-0 [&_svg:not([class*=size-])]:size-4',
			},

			// Input mode
			{
				mode: 'input',
				placeholder: true,
				variant: 'outline',
				className: 'font-normal text-muted-foreground',
			},
			{
				mode: 'input',
				variant: 'outline',
				size: 'sm',
				className: 'gap-1.25',
			},
			{
				mode: 'input',
				variant: 'outline',
				size: 'md',
				className: 'gap-1.5',
			},
			{
				mode: 'input',
				variant: 'outline',
				size: 'lg',
				className: 'gap-1.5',
			},
		],
		defaultVariants: {
			variant: 'primary',
			mode: 'default',
			size: 'md',
			shape: 'default',
			appearance: 'default',
		},
	}
);

export interface ButtonProps extends useRender.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
	selected?: boolean;
	asChild?: boolean;
}

function Button({
	render,
	asChild = false,
	children,
	className,
	selected,
	variant,
	shape,
	appearance,
	mode,
	size,
	autoHeight,
	underlined,
	underline,
	placeholder = false,
	...props
}: ButtonProps) {
	const defaultProps = {
		'data-slot': 'button',
		className: cn(
			buttonVariants({
				variant,
				size,
				shape,
				appearance,
				mode,
				autoHeight,
				placeholder,
				underlined,
				underline,
				className,
			}),
			asChild && props.disabled && 'pointer-events-none opacity-50'
		),
		...(selected && { 'data-state': 'open' as const }),
	};

	// Determine render element based on asChild prop
	const renderElement =
		asChild && React.isValidElement(children)
			? (children as React.ReactElement<Record<string, unknown>, string | React.JSXElementConstructor<unknown>>)
			: render || <button type="button" />;

	// When using asChild, children becomes the element props, otherwise use children normally
	const finalProps =
		asChild && React.isValidElement(children)
			? mergeProps(defaultProps, props)
			: mergeProps(defaultProps, { ...props, children });

	const element = useRender({
		render: renderElement,
		props: finalProps,
	});

	return element;
}

interface ButtonArrowProps extends React.SVGProps<SVGSVGElement> {
	icon?: LucideIcon;
}

function ButtonArrow({ icon: Icon = ChevronDown, className, ...props }: ButtonArrowProps) {
	return <Icon className={cn('ms-auto -me-1', className)} data-slot="button-arrow" {...props} />;
}

export { Button, ButtonArrow, buttonVariants };
