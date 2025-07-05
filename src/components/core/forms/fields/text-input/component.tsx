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
				id={id}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				type={type}
				maxLength={maxLength}
				required={required}
				disabled={disabled}
				className={className}
				{...(props as any)}
			/>
			{error && <p className="text-sm text-red-500 mt-1">{error}</p>}
		</div>
	);
};

export default TextInput;
