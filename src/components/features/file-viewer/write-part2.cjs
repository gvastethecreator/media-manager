const fs = require('fs');

const content = `
function DocumentRenderer({ item, contentUrl, onError, onLoad, className }: FileContentRendererProps) {
	const [textContent, setTextContent] = useState<string | null>(null);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [showInfo, setShowInfo] = useState(false);
	const ext = item.name?.toLowerCase().split('.').pop() || '';
	const isMarkdown = ext === 'md';
	const isText = ext === 'txt' || ext === 'rtf';
	const isPdf = ext === 'pdf';

	useEffect(() => {
		if ((isMarkdown || isText) && contentUrl) {
			fetch(contentUrl)
				.then((res) => res.text())
				.then((text) => {
					setTextContent(text);
					onLoad?.();
				})
				.catch(() => onError?.());
		} else if (isPdf) {
			setPdfUrl(contentUrl);
			onLoad?.();
		}
	}, [contentUrl, isMarkdown, isText, isPdf, onError, onLoad]);

	if (isPdf && pdfUrl) {
		return (
			<div className={cn('absolute inset-0 flex items-center justify-center p-4', className)}>
				<iframe className="h-full w-full rounded-lg bg-background shadow-dt-3" src={pdfUrl} title={item.name} />
				<Button
					className="absolute top-4 right-4 z-50"
					size="icon"
					variant="secondary"
					onClick={() => setShowInfo(!showInfo)}
				>
					<Info className="h-4 w-4" />
				</Button>
				{showInfo && <FileInfoPanel item={item} />}
			</div>
		);
	}

	if (isMarkdown && textContent) {
		return (
			<div className={cn('absolute inset-0 flex items-center justify-center p-4', className)} data-no-drag>
				<MarkdownViewer className="h-full w-full max-w-4xl" content={textContent} />
				<Button
					className="absolute top-4 right-4 z-50"
					size="icon"
					variant="secondary"
					onClick={() => setShowInfo(!showInfo)}
				>
					<Info className="h-4 w-4" />
				</Button>
				{showInfo && <FileInfoPanel item={item} />}
			</div>
		);
	}

	if (isText && textContent) {
		return (
			<div className={cn('absolute inset-0 flex items-center justify-center p-4', className)} data-no-drag>
				<div className="h-full w-full max-w-4xl overflow-auto rounded-lg bg-muted p-6 shadow-dt-3">
					<pre className="whitespace-pre-wrap font-mono text-foreground text-sm leading-relaxed">{textContent}</pre>
				</div>
				<Button
					className="absolute top-4 right-4 z-50"
					size="icon"
					variant="secondary"
					onClick={() => setShowInfo(!showInfo)}
				>
					<Info className="h-4 w-4" />
				</Button>
				{showInfo && <FileInfoPanel item={item} />}
			</div>
		);
	}

	return (
		<div className={cn('absolute inset-0 flex flex-col items-center justify-center gap-6', className)}>
			<div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-red-400 to-red-600 shadow-dt-3">
				<FileText className="h-16 w-16 text-primary-foreground" />
			</div>
			<div className="text-center">
				<h3 className="font-semibold text-foreground text-xl">{item.name}</h3>
				<p className="mt-1 text-muted-foreground text-sm">
					{item.size ? \`\${(item.size / 1024 / 1024).toFixed(2)} MB\` : 'Documento'}
				</p>
			</div>
			<a
				className="mt-4 rounded-lg bg-background/10 px-6 py-2 text-white transition-colors hover:bg-background/20"
				download={item.name}
				href={contentUrl}
			>
				Descargar archivo
			</a>
			<Button
				className="absolute top-4 right-4 z-50"
				size="icon"
				variant="secondary"
				onClick={() => setShowInfo(!showInfo)}
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={item} />}
		</div>
	);
}

function JsonRendererBase({ item, contentUrl, onError, onLoad, className }: FileContentRendererProps) {
	const [jsonContent, setJsonContent] = useState<string | null>(null);

	useEffect(() => {
		if (contentUrl) {
			fetch(contentUrl)
				.then((res) => res.text())
				.then((text) => {
					setJsonContent(text);
					onLoad?.();
				})
				.catch(() => onError?.());
		}
	}, [contentUrl, onError, onLoad]);

	if (!jsonContent) {
		return (
			<div className={cn('absolute inset-0 flex items-center justify-center', className)}>
				<Loader2 className="h-8 w-8 animate-spin text-white/50" />
			</div>
		);
	}

	return (
		<div className={cn('absolute inset-0 flex items-center justify-center p-4', className)} data-no-drag>
			<JsonFlowViewer className="h-full w-full max-w-6xl" content={jsonContent} fileName={item.name} />
		</div>
	);
}

function File3DRendererBase({ item, contentUrl, className }: FileContentRendererProps) {
	return (
		<div className={cn('absolute inset-0', className)} data-no-drag>
			<ThreeDViewer fileName={item.name} src={contentUrl} />
		</div>
	);
}

function UnknownRenderer({ item, contentUrl, className }: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<div className={cn('absolute inset-0 flex flex-col items-center justify-center gap-6', className)}>
			<div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-400 to-zinc-600 shadow-2xl">
				<AlertCircle className="h-16 w-16 text-white" />
			</div>
			<div className="text-center">
				<h3 className="font-semibold text-white text-xl">{item.name}</h3>
				<p className="mt-1 text-sm text-white/60">Tipo de archivo no soportado para vista previa</p>
			</div>
			<a
				className="mt-4 rounded-lg bg-background/10 px-6 py-2 text-white transition-colors hover:bg-background/20"
				download={item.name}
				href={contentUrl}
			>
				Descargar archivo
			</a>
			<Button
				className="absolute top-4 right-4 z-50"
				size="icon"
				variant="secondary"
				onClick={() => setShowInfo(!showInfo)}
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={item} />}
		</div>
	);
}
`;

fs.appendFileSync('src/components/features/file-viewer/file-content-renderer.tsx', content);
console.log('Part 2 appended');
