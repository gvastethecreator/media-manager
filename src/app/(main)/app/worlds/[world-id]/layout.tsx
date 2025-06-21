import { notFound } from 'next/navigation';

import { MainContainer } from '@/components/layout/main-container';
import { WorldProvider } from '@/context/world-context';
import { getWorldById } from '@/services/world.service';
import { World } from '@/types/entities/world';

export default async function WorldLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { 'world-id': string };
}) {
	const world = await getWorldById(params['world-id']);

	if (!world) {
		notFound();
	}

	return (
		<WorldProvider world={world}>
			<MainContainer>{children}</MainContainer>
		</WorldProvider>
	);
}