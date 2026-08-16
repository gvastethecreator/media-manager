'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface AccordionMenuContextValue {
	classNames?: AccordionMenuClassNames;
	matchPath: (href: string) => boolean;
	nestedStates: Record<string, string | string[]>;
	onItemClick?: (value: string, event: React.MouseEvent) => void;
	selectedValue: string | undefined;
	setNestedStates: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>;
	setSelectedValue: React.Dispatch<React.SetStateAction<string | undefined>>;
}

interface AccordionMenuClassNames {
	group?: string;
	indicator?: string;
	item?: string;
	label?: string;
	root?: string;
	separator?: string;
	sub?: string;
	subContent?: string;
	subTrigger?: string;
	subWrapper?: string;
}

interface AccordionMenuProps {
	classNames?: AccordionMenuClassNames;
	matchPath?: (href: string) => boolean;
	onItemClick?: (value: string, event: React.MouseEvent) => void;
	selectedValue?: string;
}

const AccordionMenuContext = React.createContext<AccordionMenuContextValue>({
	matchPath: () => false,
	selectedValue: '',
	setSelectedValue: () => {},
	nestedStates: {},
	setNestedStates: () => {},
});

function AccordionMenu({
	className,
	matchPath = () => false,
	classNames,
	children,
	selectedValue,
	onItemClick,
	...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & AccordionMenuProps) {
	const [internalSelectedValue, setInternalSelectedValue] = React.useState<string | undefined>(selectedValue);
	React.useEffect(() => {
		setInternalSelectedValue(selectedValue);
	}, [selectedValue]);

	const initialNestedStates = React.useMemo(() => {
		const getActiveChain = (nodes: React.ReactNode, chain: string[] = []): string[] => {
			let result: string[] = [];
			React.Children.forEach(nodes, (node) => {
				if (React.isValidElement(node)) {
					const { value, children } = node.props as {
						value?: string;
						children?: React.ReactNode;
					};
					const newChain = value ? [...chain, value] : chain;
					if (value && (value === selectedValue || matchPath(value))) {
						result = newChain;
					} else if (children) {
						const childChain = getActiveChain(children, newChain);
						if (childChain.length > 0) {
							result = childChain;
						}
					}
				}
			});
			return result;
		};

		const chain = getActiveChain(children);
		const trimmedChain = chain.length > 1 ? chain.slice(0, chain.length - 1) : chain;
		const mapping: Record<string, string | string[]> = {};
		if (trimmedChain.length > 0) {
			if (props.type === 'multiple') {
				mapping.root = trimmedChain;
			} else {
				mapping.root = trimmedChain[0];
				for (let i = 0; i < trimmedChain.length - 1; i++) {
					mapping[trimmedChain[i]] = trimmedChain[i + 1];
				}
			}
		}
		return mapping;
	}, [children, matchPath, selectedValue, props.type]);

	const [nestedStates, setNestedStates] = React.useState<Record<string, string | string[]>>(initialNestedStates);
	const multipleValue = (
		Array.isArray(nestedStates.root)
			? nestedStates.root
			: typeof nestedStates.root === 'string'
				? [nestedStates.root]
				: []
	) as string[];
	const singleValue = (nestedStates.root ?? '') as string;

	return (
		<AccordionMenuContext.Provider
			value={{
				matchPath,
				selectedValue: internalSelectedValue,
				setSelectedValue: setInternalSelectedValue,
				classNames,
				onItemClick,
				nestedStates,
				setNestedStates,
			}}
		>
			{props.type === 'single' ? (
				<AccordionPrimitive.Root
					className={cn('w-full', classNames?.root, className)}
					data-slot="accordion-menu"
					onValueChange={(value: string) => setNestedStates((prev) => ({ ...prev, root: value }))}
					value={singleValue}
					{...props}
					role="menu"
				>
					{children}
				</AccordionPrimitive.Root>
			) : (
				<AccordionPrimitive.Root
					className={cn('w-full', classNames?.root, className)}
					data-slot="accordion-menu"
					onValueChange={(value: string | string[]) => setNestedStates((prev) => ({ ...prev, root: value }))}
					value={multipleValue}
					{...props}
					role="menu"
				>
					{children}
				</AccordionPrimitive.Root>
			)}
		</AccordionMenuContext.Provider>
	);
}

type AccordionMenuGroupProps = React.ComponentPropsWithoutRef<'fieldset'>;

function AccordionMenuGroup({ children, className, ...props }: AccordionMenuGroupProps) {
	const { classNames } = React.useContext(AccordionMenuContext);
	return (
		<fieldset className={cn('space-y-0.5', classNames?.group, className)} data-slot="accordion-menu-group" {...props}>
			{children}
		</fieldset>
	);
}

type AccordionMenuLabelProps = React.ComponentPropsWithoutRef<'div'>;

function AccordionMenuLabel({ children, className, ...props }: AccordionMenuLabelProps) {
	const { classNames } = React.useContext(AccordionMenuContext);

	return (
		<div
			className={cn('px-2 py-1.5 font-medium text-muted-foreground text-xs', classNames?.label, className)}
			data-slot="accordion-menu-label"
			role="presentation"
			{...props}
		>
			{children}
		</div>
	);
}

type AccordionMenuSeparatorProps = React.ComponentPropsWithoutRef<'hr'>;

function AccordionMenuSeparator({ className, ...props }: AccordionMenuSeparatorProps) {
	const { classNames } = React.useContext(AccordionMenuContext);
	return (
		<hr
			className={cn('my-1 h-px border-0 bg-border', classNames?.separator, className)}
			data-slot="accordion-menu-separator"
			{...props}
		/>
	);
}

const itemVariants = cva(
	'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-start text-foreground text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:bg-transparent disabled:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&>a]:w-full [&>a]:items-center [&>a]:gap-2 [&_a]:flex [&_svg:not([class*=size-])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-60',
	{
		variants: {
			variant: {
				default: '',
				destructive:
					'text-destructive hover:bg-destructive/5 hover:text-destructive focus:bg-destructive/5 focus:text-destructive data-[active=true]:bg-destructive/5',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

function AccordionMenuItem({
	className,
	children,
	variant,
	asChild,
	onClick,
	...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> &
	VariantProps<typeof itemVariants> & {
		onClick?: React.MouseEventHandler<HTMLElement>;
	}) {
	const { classNames, selectedValue, matchPath, onItemClick } = React.useContext(AccordionMenuContext);
	return (
		<AccordionPrimitive.Item className="flex" {...props}>
			<AccordionPrimitive.Header className="flex w-full">
				<AccordionPrimitive.Trigger
					asChild={asChild}
					className={cn(itemVariants({ variant }), classNames?.item, className)}
					data-selected={matchPath(props.value as string) || selectedValue === props.value ? 'true' : undefined}
					data-slot="accordion-menu-item"
					onClick={(e) => {
						if (onItemClick) {
							onItemClick(props.value, e);
						}

						if (onClick) {
							onClick(e);
						}
						e.preventDefault();
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							const target = e.currentTarget as HTMLElement;
							const firstChild = target.firstElementChild as HTMLElement | null;
							if (firstChild) {
								firstChild.click();
							}
						}
					}}
				>
					{children}
				</AccordionPrimitive.Trigger>
			</AccordionPrimitive.Header>
		</AccordionPrimitive.Item>
	);
}

function AccordionMenuSub({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
	const { classNames } = React.useContext(AccordionMenuContext);
	return (
		<AccordionPrimitive.Item className={cn(classNames?.sub, className)} data-slot="accordion-menu-sub" {...props}>
			{children}
		</AccordionPrimitive.Item>
	);
}

function AccordionMenuSubTrigger({
	className,
	children,
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
	const { classNames } = React.useContext(AccordionMenuContext);
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				className={cn(
					'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-start text-foreground text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground [&_svg:not([class*=size-])]:size-4 [&_svg:not([role=img]):not([class*=text-])]:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0',
					classNames?.subTrigger,
					className
				)}
				data-slot="accordion-menu-sub-trigger"
			>
				{children}
				<ChevronDown
					className={cn(
						'ms-auto size-3.5! shrink-0 text-muted-foreground transition-transform duration-dt-fast ease-dt-out [[data-state=open]>&]:-rotate-180'
					)}
					data-slot="accordion-menu-sub-indicator"
				/>
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

type AccordionMenuSubContentProps = (
	| (React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
			type: 'single';
			collapsible: boolean;
			defaultValue?: string;
	  })
	| (React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
			type: 'multiple';
			collapsible?: boolean;
			defaultValue?: string | string[];
	  })
) & {
	parentValue: string;
};

function AccordionMenuSubContent({
	className,
	children,
	type,
	collapsible,
	defaultValue,
	parentValue,
	...props
}: AccordionMenuSubContentProps) {
	const { nestedStates, setNestedStates, classNames } = React.useContext(AccordionMenuContext);
	let currentValue: string | string[];
	if (type === 'multiple') {
		const stateValue = nestedStates[parentValue];
		if (Array.isArray(stateValue)) {
			currentValue = stateValue;
		} else if (typeof stateValue === 'string') {
			currentValue = [stateValue];
		} else if (defaultValue) {
			currentValue = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
		} else {
			currentValue = [];
		}
	} else {
		currentValue = nestedStates[parentValue] ?? defaultValue ?? '';
	}

	return (
		<AccordionPrimitive.Content
			className={cn(
				'ps-5',
				'overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
				classNames?.subContent,
				className
			)}
			data-slot="accordion-menu-sub-content"
			{...props}
		>
			{type === 'multiple' ? (
				<AccordionPrimitive.Root
					className={cn('w-full py-0.5', classNames?.subWrapper)}
					data-slot="accordion-menu-sub-wrapper"
					onValueChange={(value: string | string[]) => {
						const newValue = Array.isArray(value) ? value : [value];
						setNestedStates((prev) => ({ ...prev, [parentValue]: newValue }));
					}}
					role="menu"
					type="multiple"
					value={currentValue as string[]}
				>
					{children}
				</AccordionPrimitive.Root>
			) : (
				<AccordionPrimitive.Root
					className={cn('w-full py-0.5', classNames?.subWrapper)}
					collapsible={collapsible}
					data-slot="accordion-menu-sub-wrapper"
					onValueChange={(value: string | string[]) => setNestedStates((prev) => ({ ...prev, [parentValue]: value }))}
					role="menu"
					type="single"
					value={currentValue as string}
				>
					{children}
				</AccordionPrimitive.Root>
			)}
		</AccordionPrimitive.Content>
	);
}

type AccordionMenuIndicatorProps = React.ComponentPropsWithoutRef<'span'>;

function AccordionMenuIndicator({ className, ...props }: AccordionMenuIndicatorProps) {
	const { classNames } = React.useContext(AccordionMenuContext);
	return (
		<span
			aria-hidden="true"
			className={cn('ms-auto flex items-center font-medium', classNames?.indicator, className)}
			data-slot="accordion-menu-indicator"
			{...props}
		/>
	);
}

export {
	AccordionMenu,
	AccordionMenuGroup,
	AccordionMenuIndicator,
	AccordionMenuItem,
	AccordionMenuLabel,
	AccordionMenuSeparator,
	AccordionMenuSub,
	AccordionMenuSubContent,
	AccordionMenuSubTrigger,
	type AccordionMenuClassNames,
};
