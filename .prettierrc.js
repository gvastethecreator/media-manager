module.exports = {
	semi: true,
	trailingComma: 'es5',
	singleQuote: true,
	jsxSingleQuote: false,
	tabWidth: 2,
	useTabs: true,
	printWidth: 120,
	bracketSpacing: true,
	bracketSameLine: false,
	arrowParens: 'always',
	endOfLine: 'lf',
	overrides: [
		{
			files: '*.json',
			options: {
				useTabs: false,
				tabWidth: 2,
				printWidth: 80,
			},
		},
	],
};
