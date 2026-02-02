'use strict';
const fs = require('fs');

const content = `
function ImageRenderer(props: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<>
			<ImageRendererBase {...props} />
			<Button
				className="absolute top-4 right-4 z-50"
				size="icon"
				variant="secondary"
				onClick={() => setShowInfo(!showInfo)}
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={props.item} />}
		</>
	);
}

function VideoRenderer(props: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<>
			<VideoRendererBase {...props} />
			<Button
				className="absolute top-4 right-4 z-50"
				size="icon"
				variant="secondary"
				onClick={() => setShowInfo(!showInfo)}
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={props.item} />}
		</>
	);
}

function AudioRenderer(props: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<>
			<AudioRendererBase {...props} />
			<Button
				className="absolute top-4 right-4 z-50"
				size="icon"
				variant="secondary"
				onClick={() => setShowInfo(!showInfo)}
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={props.item} />}
		</>
	);
}

function JsonRenderer(props: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<>
			<JsonRendererBase {...props} />
			<Button
				className="absolute top-4 right-4 z-50"
				size="icon"
				variant="secondary"
				onClick={() => setShowInfo(!showInfo)}
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={props.item} />}
		</>
	);
}

function File3DRenderer(props: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<>
			<File3DRendererBase {...props} />
			<Button
				className="absolute top-4 right-4 z-50"
				size="icon"
				variant="secondary"
				onClick={() => setShowInfo(!showInfo)}
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={props.item} />}
		</>
	);
}

function FileContentRendererInner(props: FileContentRendererProps) {
	const { item, isLoading } = props;
	const fileType = detectFileType(item);

	if (isLoading) {
		return (
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<FileTypeIcon className="animate-pulse text-white/30" type={fileType} />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
		);
	}

	switch (fileType) {
		case 'image':
			return <ImageRenderer {...props} />;
		case 'video':
			return <VideoRenderer {...props} />;
		case 'audio':
			return <AudioRenderer {...props} />;
		case 'document':
			return <DocumentRenderer {...props} />;
		case 'json':
			return <JsonRenderer {...props} />;
		case 'file3d':
			return <File3DRenderer {...props} />;
		default:
			return <UnknownRenderer {...props} />;
	}
}

export const FileContentRenderer = memo(FileContentRendererInner);
export { detectFileType };
`;

fs.appendFileSync('src/components/features/file-viewer/file-content-renderer.tsx', content);
console.log('Part 3 appended - File complete');
