import { Label } from '@radix-ui/react-label';
import React from 'react';
import { Input as BaseTextInput } from '@/components/ui/input';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	id: string;
	error?: string;
}

const TextInput: React.FC<TextInputProps> = ({
	label,
	id,
	name,
	value,
	onChange,
	placeholder,
	type = 'text',
	maxLength,
	required,
	disabled,
	className,
	error,
	...props
}) => {
	return (
		<div className="grid w-full max-w-sm items-center gap-1.5">
			{label && <Label htmlFor={id}>{label}</Label>}
			<BaseTextInput
				className={className}
				disabled={disabled}
				id={id}
				maxLength={maxLength}
				name={name}
				onChange={onChange}
				placeholder={placeholder}
				required={required}
				type={type}
				value={value}
				{...(props as any)}
			/>
			{error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
		</div>
	);
};

export default TextInput;
