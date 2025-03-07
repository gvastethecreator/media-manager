import type { PropsWithChildren } from 'react';

export default function FolderLayout({ children }: PropsWithChildren) {
	return <div className="h-full w-full">{children}</div>;
}
