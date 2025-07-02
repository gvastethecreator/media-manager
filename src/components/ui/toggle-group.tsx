import { Toggle as TogglePrimitive } from '@base-ui-components/react/toggle';
import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { toggleVariants } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
	size: 'default',
	variant: 'default',
});

interface ToggleGroupProps extends VariantProps<typeof toggleVariants> {
	className?: string;
	children?: React.ReactNode;
	type?: 'single' | 'multiple';
	value?: string | string[];
	defaultValue?: string | string[];
	onValueChange?: (value: string | string[]) => void;
	disabled?: boolean;
}

function ToggleGroup({
	className,
	variant,
	size,
	children,
	type = 'single',
	value,
	defaultValue,
	onValueChange,
	disabled,
	...props
}: ToggleGroupProps) {
	const [internalValue, setInternalValue] = React.useState<string | string[]>(
		defaultValue || (type === 'multiple' ? [] : '')
	);

	const currentValue = value !== undefined ? value : internalValue;

	const handleValueChange = React.useCallback(
		(itemValue: string) => {
			if (type === 'multiple') {
				const newValue = Array.isArray(currentValue)
					? currentValue.includes(itemValue)
						? currentValue.filter((v) => v !== itemValue)
						: [...currentValue, itemValue]
					: [itemValue];

				setInternalValue(newValue);
				onValueChange?.(newValue);
			} else {
				const newValue = currentValue === itemValue ? '' : itemValue;
				setInternalValue(newValue);
				onValueChange?.(newValue);
			}
		},
		[currentValue, type, onValueChange]
	);

	return (
		<fieldset
			data-slot="toggle-group"
			data-variant={variant}
			data-size={size}
			className={cn(
				'group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs border-0 p-0 m-0',
				className
			)}
			disabled={disabled}
			{...props}
		>
			<ToggleGroupContext.Provider value={{ variant, size }}>
				{React.Children.map(children, (child, index) => {
					if (React.isValidElement(child) && child.type === ToggleGroupItem) {
						return React.cloneElement(child, {
							...child.props,
							onValueChange: handleValueChange,
							isPressed:
								type === 'multiple'
									? Array.isArray(currentValue) && currentValue.includes(child.props.value)
									: currentValue === child.props.value,
							disabled: disabled || child.props.disabled,
							key: child.props.value || index,
						});
					}
					return child;
				})}
			</ToggleGroupContext.Provider>
		</fieldset>
	);
}

interface ToggleGroupItemProps extends VariantProps<typeof toggleVariants> {
	className?: string;
	children?: React.ReactNode;
	value: string;
	disabled?: boolean;
	onValueChange?: (value: string) => void;
	isPressed?: boolean;
}

function ToggleGroupItem({
	className,
	children,
	variant,
	size,
	value,
	disabled,
	onValueChange,
	isPressed,
	...props
}: ToggleGroupItemProps) {
	const context = React.useContext(ToggleGroupContext);

	return (
		<TogglePrimitive.Root
			data-slot="toggle-group-item"
			data-variant={context.variant || variant}
			data-size={context.size || size}
			className={cn(
				toggleVariants({
					variant: context.variant || variant,
					size: context.size || size,
				}),
				'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l',
				className
			)}
			pressed={isPressed}
			onPressedChange={() => onValueChange?.(value)}
			disabled={disabled}
			{...props}
		>
			{children}
		</TogglePrimitive.Root>
	);
}

export { ToggleGroup, ToggleGroupItem };
