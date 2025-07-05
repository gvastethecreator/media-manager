declare global {
	interface Window {
		electron?: {
			openPath: (path: string) => void;
			downloadFile: (path: string) => void;
			copyFileToClipboard: (path: string) => void;
			deleteFile: (path: string) => void;
		};
	}

	interface RequestInit {
		duplex?: 'half';
	}

	const ENV: any;
}
