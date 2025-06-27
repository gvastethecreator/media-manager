<div>
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
</div>;
