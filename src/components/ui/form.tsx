'use client';

import { Slot } from '@radix-ui/react-slot';
import { Label as LabelPrimitive } from 'radix-ui';
import * as React from 'react';
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const Form = FormProvider;

type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const { getFieldState, formState } = useFormContext();

	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error('useFormField should be used within <FormField>');
	}

	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

type FormItemContextValue = {
	id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	const id = React.useId();
	const { error } = useFormField();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div className={cn('flex flex-col gap-2.5', className)} data-invalid={!!error} data-slot="form-item" {...props} />
		</FormItemContext.Provider>
	);
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
	const { formItemId } = useFormField();

	return (
		<Label
			className={cn('font-medium text-foreground', className)}
			data-slot="form-label"
			htmlFor={formItemId}
			{...props}
		/>
	);
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
	const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

	return (
		<Slot
			aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`}
			aria-invalid={!!error}
			data-slot="form-control"
			id={formItemId}
			{...props}
		/>
	);
}

function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
	const { formDescriptionId, error } = useFormField();

	if (error) {
		return null; // Hide the description when there's an error
	}

	return (
		<div
			className={cn('-mt-0.5 text-muted-foreground text-xs', className)}
			data-slot="form-description"
			id={formDescriptionId}
			{...props}
		/>
	);
}

function FormMessage({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error?.message) : children;

	if (!body) {
		return null;
	}

	return (
		<div
			className={cn('-mt-0.5 font-normal text-destructive text-xs', className)}
			data-slot="form-message"
			id={formMessageId}
			{...props}
		>
			{body}
		</div>
	);
}

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField };
