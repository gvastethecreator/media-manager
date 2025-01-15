"use client";

import { MainLayout } from "@/components/layout/main-layout";

export default function Home() {
	return (
		<main className="h-[100vh] w-full overflow-hidden">
			<div className="h-full w-full">
				<MainLayout>
					<div className="h-full w-full bg-red-500">
						<h1>Hello World</h1>
					</div>
				</MainLayout>
			</div>
		</main>
	);
}
